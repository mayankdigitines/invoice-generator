const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  saveProfile,
  getProfile,
} = require('../controllers/businessController');

router.post('/', protect, saveProfile);
router.get('/', getProfile);

module.exports = router;
