const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  saveProfile,
  getProfile,
  createBusiness,
  getAllBusinesses,
  getBusinessUsers,
  updateBusinessUser,
  getBusinessStats,
  manageSubscription,
  getBusinessById,
} = require('../controllers/businessController');
const { createBusinessUser } = require('../controllers/authController');

// Super Admin Routes
router.post('/create', protect, admin, createBusiness);
router.get('/all', protect, admin, getAllBusinesses);
router.get('/:id/details', protect, admin, getBusinessById); // Specific business details
router.put('/:id', protect, admin, saveProfile); // Admin update business
// Subscription
router.post('/:businessId/subscription', protect, admin, manageSubscription);

// User Management for Business
router.get('/:id/users', protect, admin, getBusinessUsers);
router.post('/users/create', protect, admin, createBusinessUser);
router.put('/users/:userId', protect, admin, updateBusinessUser);
router.get('/:id/stats', protect, admin, getBusinessStats);

// Business Owner Routes
router.post('/profile', protect, saveProfile); // /api/business/profile
router.get('/profile', protect, getProfile);

module.exports = router;
