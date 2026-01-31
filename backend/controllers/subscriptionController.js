const Razorpay = require('razorpay');
const crypto = require('crypto');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction = require('../models/Transaction');
const Business = require('../models/Business');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Plan Management (Super Admin) ---

exports.createPlan = async (req, res) => {
  try {
    const { name, durationType, price, description, features } = req.body;

    // Check if duplicate
    const existing = await SubscriptionPlan.findOne({ name });
    if (existing)
      return res
        .status(400)
        .json({ message: 'Plan with this name already exists' });

    let durationDays = 30; // Default monthly
    if (durationType === 'quarterly') durationDays = 90;
    else if (durationType === 'half-yearly') durationDays = 180;
    else if (durationType === 'yearly') durationDays = 365;

    const slug = name.toLowerCase().replace(/ /g, '-');

    const plan = new SubscriptionPlan({
      name,
      slug,
      durationType,
      durationDays,
      price,
      description,
      features,
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating plan', error: error.message });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};
    if (role !== 'superadmin') {
      query.isActive = true;
    }
    const plans = await SubscriptionPlan.find(query).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching plans', error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, updates, {
      new: true,
    });
    res.json(plan);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating plan', error: error.message });
  }
};

// --- Business Subscription Flow ---

exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const businessId = req.user.businessId;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const business = await Business.findById(businessId);

    // Check if already active
    if (
      business.subscriptionStatus === 'active' &&
      business.subscriptionEndDate > new Date()
    ) {
      return res
        .status(400)
        .json({
          message: 'Current subscription is still active. Wait for expiration.',
        });
    }

    const options = {
      amount: plan.price * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        businessId: businessId.toString(),
        planId: planId.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: plan,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: 'Error creating order', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;
    const businessId = req.user.businessId;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Capture payment success
    const plan = await SubscriptionPlan.findById(planId);
    const business = await Business.findById(businessId);

    // Calculate Dates
    const startDate = new Date();
    // Use current endDate if future? No, user requirement says can't buy until expired.
    // So always start from now.
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create Transaction
    const transaction = new Transaction({
      businessId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: plan.price,
      status: 'success',
      type: 'subscription_purchase',
      planSnapshot: {
        planId: plan._id,
        name: plan.name,
        price: plan.price,
        durationType: plan.durationType,
        durationDays: plan.durationDays,
      },
      startDate,
      endDate,
    });
    await transaction.save();

    // Update Business
    business.subscriptionStatus = 'active';
    business.subscriptionEndDate = endDate;
    await business.save();

    res.json({
      message: 'Payment successful, subscription active',
      subscriptionEndDate: endDate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error verifying payment', error: error.message });
  }
};

// --- Super Admin Extensions & History ---

exports.manualExtension = async (req, res) => {
  try {
    const { businessId, days, remark } = req.body;

    const business = await Business.findById(businessId);
    if (!business)
      return res.status(404).json({ message: 'Business not found' });

    let startDate = new Date();
    // If currently active, extend from current end date
    if (
      business.subscriptionStatus === 'active' &&
      business.subscriptionEndDate > new Date()
    ) {
      startDate = new Date(business.subscriptionEndDate);
    }

    // New End Date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(days));

    // Create Transaction Record (Admin Extension)
    const transaction = new Transaction({
      businessId,
      amount: 0,
      status: 'success',
      type: 'admin_extension',
      remark: remark,
      startDate: startDate,
      endDate: endDate,
      planSnapshot: {
        name: `Manual Extension (${days} days)`,
        durationDays: days,
      },
    });

    await transaction.save();

    business.subscriptionStatus = 'active';
    business.subscriptionEndDate = endDate;
    await business.save();

    res.json({
      message: 'Subscription extended successfully',
      newEndDate: endDate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error extending subscription', error: error.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    // Optional query params for filtering
    const transactions = await Transaction.find()
      .populate('businessId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching transactions', error: error.message });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const transactions = await Transaction.find({ businessId }).sort({
      createdAt: -1,
    });
    res.json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching transactions', error: error.message });
  }
};

exports.getBusinessSubscriptionStatus = async (req, res) => {
  try {
    const businessId = req.path.includes('my-status')
      ? req.user.businessId
      : req.params.businessId;
    const business = await Business.findById(businessId).select(
      'subscriptionStatus subscriptionEndDate',
    );

    // Auto-check expiration logic if needed (can also be done via cron)
    if (
      business.subscriptionStatus === 'active' &&
      new Date() > business.subscriptionEndDate
    ) {
      business.subscriptionStatus = 'expired';
      await business.save();
    }

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching status' });
  }
};
