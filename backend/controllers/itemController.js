const Item = require('../models/Item');

// Get all items
exports.getItems = async (req, res, next) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Create a new item (Now saves discount too)
exports.createItem = async (req, res, next) => {
  try {
    const { name, price, gstRate, discount, description } = req.body;

    // Check if item exists
    let item = await Item.findOne({ name });
    if (item) return res.status(400).json({ message: 'Item already exists' });

    // Save with discount
    item = new Item({
      name,
      price,
      gstRate: gstRate || 0,
      discount: discount || 0, // Default to 0 if not provided
      description,
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// Update an Item
exports.updateItem = async (req, res, next) => {
  try {
    const { name, price, gstRate, discount, description } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, price, gstRate, discount, description },
      { new: true }, // Return the updated document
    );
    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};

// Delete an Item
exports.deleteItem = async (req, res, next) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};
