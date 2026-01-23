const express = require('express');
const router = express.Router();
const {
  saveProfile,
  getProfile,
} = require('../controllers/businessController');

router.post('/', saveProfile);
router.get('/', getProfile);

module.exports = router;
