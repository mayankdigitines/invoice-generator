const Customer = require('../models/Customer');

// Search for autocomplete (Name or Phone)
exports.searchCustomers = async (req, res, next) => {
  try {
    const { query } = req.query; // e.g. ?query=Jo
    const businessId = req.user.businessId;

    if (!query) return res.json([]);

    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Case-insensitive name match
        { phone: { $regex: query, $options: 'i' } }, // Partial phone match
      ],
    };

    if (businessId) {
      filter.businessId = businessId;
    }

    const customers = await Customer.find(filter).limit(10); // Limit results for performance

    res.json(customers);
  } catch (error) {
    next(error);
  }
};
