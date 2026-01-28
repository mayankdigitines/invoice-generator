const Item = require('../models/Item');

// Get all items with Pagination & Search
exports.getItems = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    if (!businessId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Business context required' });
    }

    const query = businessId ? { businessId } : {};

    // If 'all' query param is present, return all items (for dropdowns)
    if (req.query.all === 'true') {
      const items = await Item.find(query).sort({ name: 1 });
      return res.json(items);
    }

    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Item.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(query),
    ]);

    res.json({
      items,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new item (Now saves discount too)
exports.createItem = async (req, res, next) => {
  try {
    const { name, price, gstRate, discount, description } = req.body;
    const businessId = req.user.businessId;

    if (!businessId) {
      return res
        .status(400)
        .json({ message: 'User must belong to a business' });
    }

    // Check if item exists in THIS business
    let item = await Item.findOne({ name, businessId });
    if (item)
      return res
        .status(400)
        .json({ message: 'Item already exists in this business' });

    // Save with discount
    item = new Item({
      name,
      price,
      gstRate: gstRate || 0,
      discount: discount || 0,
      description,
      businessId,
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

    // Ensure we are updating only if it belongs to the user's business
    const filter = { _id: req.params.id };
    if (req.user.businessId) {
      filter.businessId = req.user.businessId;
    }

    const updatedItem = await Item.findOneAndUpdate(
      filter,
      { name, price, gstRate, discount, description },
      { new: true },
    );

    if (!updatedItem)
      return res
        .status(404)
        .json({ message: 'Item not found or unauthorized' });

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};

// Delete an Item
exports.deleteItem = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.businessId) {
      filter.businessId = req.user.businessId;
    }

    const result = await Item.findOneAndDelete(filter);

    if (!result)
      return res
        .status(404)
        .json({ message: 'Item not found or unauthorized' });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};
