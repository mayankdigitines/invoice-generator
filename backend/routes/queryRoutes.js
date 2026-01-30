const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createQuery,
  getMyQueries,
  getAllQueries,
  updateQueryStatus,
} = require('../controllers/queryController');

// Business Owner Routes
router.post('/', protect, createQuery);
router.get('/my', protect, getMyQueries);

// Admin Routes
router.get('/all', protect, admin, getAllQueries);
router.put('/:id', protect, admin, updateQueryStatus);

module.exports = router;
