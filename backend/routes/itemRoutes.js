const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');

router.get('/', protect, getItems);
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
