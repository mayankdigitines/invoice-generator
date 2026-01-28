const express = require('express');
const router = express.Router();
const {
  loginUser,
  createBusinessUser,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
// router.post('/register', registerUser); // Disabled public registration

// Super Admin creates Business Login
router.post('/create-business-user', protect, admin, createBusinessUser);

module.exports = router;
