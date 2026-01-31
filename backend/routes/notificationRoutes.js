const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  sendNotification,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Business routes
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Super Admin routes
router.post('/send', protect, admin, sendNotification);

module.exports = router;
