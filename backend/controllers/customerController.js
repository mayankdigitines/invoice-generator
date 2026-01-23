const Customer = require('../models/Customer');

// Search for autocomplete (Name or Phone)
exports.searchCustomers = async (req, res, next) => {
  try {
    const { query } = req.query; // e.g. ?query=Jo
    if (!query) return res.json([]);

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Case-insensitive name match
        { phone: { $regex: query, $options: 'i' } }, // Partial phone match
      ],
    }).limit(10); // Limit results for performance

    res.json(customers);
  } catch (error) {
    next(error);
  }
};
