const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchCustomers } = require('../controllers/customerController');

router.get('/search', protect, searchCustomers);

module.exports = router;
