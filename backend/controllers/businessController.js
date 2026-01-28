const Business = require('../models/Business');
const User = require('../models/User');
const mongoose = require('mongoose');

// --- SUPER ADMIN ACTIONS ---

exports.createBusiness = async (req, res, next) => {
  try {
    const { name, address, email, phone, gstNumber, logoUrl } = req.body;
    const business = await Business.create({
      name,
      address,
      email,
      phone,
      gstNumber,
      logoUrl,
    });
    res.status(201).json(business);
  } catch (error) {
    next(error);
  }
};

exports.getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    next(error);
  }
};

exports.getBusinessUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await User.find({ businessId: id }).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.updateBusinessUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { email, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBusinessStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Invoice = require('../models/Invoice'); // Lazy load to avoid circular dependency issues if any

    // 1. Total Revenue & Total Tax
    const revenueStats = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalTax: { $sum: '$taxAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = revenueStats[0] || {
      totalRevenue: 0,
      totalTax: 0,
      count: 0,
    };

    // 2. Recent activity or other stats can be added here
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// --- BUSINESS OWNER ACTIONS ---

exports.saveProfile = async (req, res, next) => {
  try {
    const businessId = req.user.businessId || req.params.id;

    if (!businessId) {
      return res.status(400).json({ message: 'No business context found' });
    }

    const profile = await Business.findByIdAndUpdate(businessId, req.body, {
      new: true,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const businessId = req.user.businessId || req.params.id;

    if (!businessId) {
      // If super admin and no param, getting their "own" profile doesn't make sense unless we define a super admin profile
      return res.status(400).json({ message: 'No business context found' });
    }

    const profile = await Business.findById(businessId);
    if (!profile)
      return res.status(404).json({ message: 'Business profile not found' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
};
