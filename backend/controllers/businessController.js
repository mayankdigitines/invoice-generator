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

    // Security: Prevent non-admins from updating subscription details
    if (req.user.role !== 'super_admin') {
      delete req.body.subscription;
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

exports.manageSubscription = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { planType, amount, paymentStatus, startDate } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end = new Date(start);

    if (planType === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else if (planType === 'yearly') {
      end.setFullYear(end.getFullYear() + 1);
    }

    let subscriptionStatus = 'inactive';
    if (paymentStatus === 'paid') {
      subscriptionStatus = 'active';
    } else if (paymentStatus === 'pending') {
      subscriptionStatus = 'pending';
    } else if (paymentStatus === 'failed') {
      subscriptionStatus = 'failed';
    }

    business.subscription = {
      planType,
      amount,
      startDate: start,
      endDate: end,
      paymentStatus,
      status: subscriptionStatus,
    };

    await business.save();
    res.json(business);
  } catch (error) {
    next(error);
  }
};

exports.getMyBusinessStats = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json({ message: 'No business associated with user' });
    }
    const Invoice = require('../models/Invoice');

    const revenueStats = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
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

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.getBusinessAnalytics = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json({ message: 'No business associated with user' });
    }
    const Invoice = require('../models/Invoice');

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $addFields: {
          effectiveDate: { $ifNull: ['$date', '$createdAt'] },
        },
      },
      {
        $match: {
          effectiveDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$effectiveDate' },
            year: { $year: '$effectiveDate' },
          },
          revenue: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format for frontend (e.g., "Jan 2024")
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const formattedData = monthlyRevenue.map((item) => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      invoices: item.count,
    }));

    res.json(formattedData);
  } catch (error) {
    next(error);
  }
};

exports.getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    next(error);
  }
};
