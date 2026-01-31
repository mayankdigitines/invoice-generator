const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/Auth routes
router.get('/plans', protect, subscriptionController.getPlans);
router.get(
  '/my-status',
  protect,
  subscriptionController.getBusinessSubscriptionStatus,
);
router.post('/create-order', protect, subscriptionController.createOrder); // Business
router.post('/verify-payment', protect, subscriptionController.verifyPayment); // Business
router.get(
  '/my-transactions',
  protect,
  subscriptionController.getMyTransactions,
); // Business

// Super Admin routes
router.post('/plans', protect, admin, subscriptionController.createPlan);
router.put('/plans/:id', protect, admin, subscriptionController.updatePlan);
router.post('/extend', protect, admin, subscriptionController.manualExtension);
router.get(
  '/transactions',
  protect,
  admin,
  subscriptionController.getAllTransactions,
);

module.exports = router;
