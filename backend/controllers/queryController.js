const Query = require('../models/Query');

// @desc    Create a new query
// @route   POST /api/queries
// @access  Private (Business Admin)
const createQuery = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    if (!req.user.businessId) {
       return res.status(400).json({ message: 'User is not associated with a business' });
    }

    const query = await Query.create({
      businessId: req.user.businessId,
      subject,
      message,
      status: 'Pending'
    });

    res.status(201).json(query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my queries
// @route   GET /api/queries/my
// @access  Private (Business Admin)
const getMyQueries = async (req, res) => {
  try {
    const queries = await Query.find({ businessId: req.user.businessId }).sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all queries (Admin)
// @route   GET /api/queries/all
// @access  Private (Super Admin)
const getAllQueries = async (req, res) => {
  try {
    const queries = await Query.find()
      .populate('businessId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update query status
// @route   PUT /api/queries/:id
// @access  Private (Super Admin)
const updateQueryStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const query = await Query.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    if (status) query.status = status;
    if (adminResponse) query.adminResponse = adminResponse;

    const updatedQuery = await query.save();
    
    // Populate before returning
    await updatedQuery.populate('businessId', 'name email phone');

    res.json(updatedQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuery,
  getMyQueries,
  getAllQueries,
  updateQueryStatus,
};
