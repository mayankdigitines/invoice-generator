const Notification = require('../models/Notification');
const Business = require('../models/Business');

// @desc    Get all notifications for the logged-in business
// @route   GET /api/notifications
// @access  Private (Business Admin)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.businessId,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (Business Admin)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.businessId,
    });

    if (notification) {
      notification.isRead = true;
      const updatedNotification = await notification.save();
      res.json(updatedNotification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Business Admin)
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.businessId,
    });

    if (notification) {
      await notification.deleteOne();
      res.json({ message: 'Notification removed' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a notification (Broadcast or Individual)
// @route   POST /api/notifications/send
// @access  Private (Super Admin)
const sendNotification = async (req, res) => {
  const { title, message, businessId } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    // If businessId is provided, send to that business (Individual)
    if (businessId) {
      const type = 'individual';
      const notification = await Notification.create({
        recipient: businessId,
        sender: req.user._id,
        title,
        message,
        type,
      });

      req.app.get('io').to(businessId).emit('newNotification', notification);

      return res
        .status(201)
        .json({ message: 'Notification sent successfully', notification });
    }

    // If no businessId, send to ALL businesses (Broadcast)
    else {
      const businesses = await Business.find({});
      if (businesses.length === 0) {
        return res
          .status(404)
          .json({ message: 'No businesses found to broadcast to.' });
      }

      const notificationsToCreate = businesses.map((business) => ({
        recipient: business._id,
        sender: req.user._id,
        title,
        message,
        type: 'broadcast',
      }));

      await Notification.insertMany(notificationsToCreate);

      // Notify all businesses
      req.app.get('io').to('all_businesses').emit('newBroadcast', {
        title,
        message,
        type: 'broadcast',
        createdAt: new Date(),
      });

      return res
        .status(201)
        .json({ message: `Broadcast sent to ${businesses.length} businesses` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private (Business Admin)
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.businessId, isRead: false },
      { $set: { isRead: true } },
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  sendNotification,
  markAllAsRead,
};
