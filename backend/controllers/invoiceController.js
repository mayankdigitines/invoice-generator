const Invoice = require('../models/Invoice');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const Business = require('../models/Business');
const { Parser } = require('json2csv');

exports.createInvoice = async (req, res, next) => {
  try {
    const { customer, items, date, overallDiscount = 0 } = req.body;
    const businessId = req.user.businessId;

    if (!businessId)
      return res.status(400).json({ message: 'Business context missing' });

    // Subscription Check
    const businessChecker = await Business.findById(businessId);
    if (!businessChecker)
      return res.status(404).json({ message: 'Business not found' });

    if (req.user.role !== 'superadmin') {
      const isExpired =
        !businessChecker.subscriptionEndDate ||
        new Date() > new Date(businessChecker.subscriptionEndDate);
      if (businessChecker.subscriptionStatus !== 'active' || isExpired) {
        return res.status(403).json({
          message: 'Active subscription required to create invoices.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
    }

    // A. Handle Customer (Find or Create) -> SCoped by Business
    let customerDoc = await Customer.findOne({
      phone: customer.phone,
      businessId,
    });
    if (customerDoc) {
      customerDoc.name = customer.name;
      customerDoc.address = customer.address;
      await customerDoc.save();
    } else {
      customerDoc = new Customer({ ...customer, businessId });
      await customerDoc.save();
    }

    // B. Handle Items & Calculations
    let totalAmount = 0;
    let totalTax = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        // Auto-save new inventory -> Scoped by Business
        if (!item._id && item.name) {
          let existingItem = await Item.findOne({
            name: item.name,
            businessId,
          });
          if (!existingItem) {
            await new Item({ ...item, businessId }).save();
          }
        }

        // Calculations
        const baseTotal = item.price * item.quantity;
        const discountAmount = (baseTotal * (item.discount || 0)) / 100;
        const taxableAmount = baseTotal - discountAmount;
        const taxAmount = (taxableAmount * (item.gstRate || 0)) / 100;

        totalAmount += taxableAmount;
        totalTax += taxAmount;

        return {
          itemName: item.name,
          itemDescription: item.description || '',
          quantity: item.quantity,
          price: item.price,
          gstRate: item.gstRate,
          discount: item.discount,
          amount: taxableAmount + taxAmount,
        };
      }),
    );

    // Apply Overall Discount on the total amount + total tax (or just total amount? usually on subtotal)
    // Assuming overall discount is a percentage on the Final Total (post tax) or Pre-Tax Total?
    // Let's apply it on the Grand Total for simplicity unless specified otherwise.
    // However, usually "Overall Discount" in accounting software is subtotal discount.
    // If I apply it to grandTotal, the math is: grandTotal = (totalAmount + totalTax) * (1 - overallDiscount/100)

    let grandTotal = totalAmount + totalTax;
    const overallDiscountAmount = (grandTotal * (overallDiscount || 0)) / 100;
    grandTotal -= overallDiscountAmount;

    // C. Save Invoice
    const newInvoice = new Invoice({
      invoiceNumber: `INV-${Date.now()}`,
      customer: customerDoc._id,
      businessId,
      items: processedItems,
      date: date || new Date(),
      overallDiscount,
      totalAmount,
      taxAmount: totalTax,
      grandTotal,
    });

    await newInvoice.save();

    // D. Return the Full Object (Populated) so Frontend can Print immediately
    const fullInvoice = await Invoice.findById(newInvoice._id).populate(
      'customer',
    );

    res.status(201).json(fullInvoice);
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Invoice (For re-printing later)
exports.getInvoiceById = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      businessId: req.params.businessId,
    };

    console.log('Querying Invoice with:', query);

    const invoice = await Invoice.findOne(query)
      .populate('customer')
      .populate('businessId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// 3. Get Invoices by specific Customer
exports.getCustomerInvoices = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // Verify customer belongs to business (implied by invoice query later, but good to check context)
    const query = { customer: customerId };
    if (req.user.businessId) {
      query.businessId = req.user.businessId;
    }

    const invoices = await Invoice.find(query).sort({
      createdAt: -1,
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// 4. Update Invoice (With Items & Customer Handling)
exports.updateInvoice = async (req, res, next) => {
  try {
    const { items, customer, overallDiscount } = req.body;
    let updateData = { ...req.body };

    // A. Update Customer Info if provided
    if (customer && customer.phone) {
      let customerDoc = await Customer.findOne({ phone: customer.phone });
      if (customerDoc) {
        // Update existing customer details
        customerDoc.name = customer.name;
        customerDoc.address = customer.address;
        await customerDoc.save();
        updateData.customer = customerDoc._id;
      } else {
        // Create new if somehow not found (or changed phone entirely)
        customerDoc = new Customer(customer);
        await customerDoc.save();
        updateData.customer = customerDoc._id;
      }
    }

    // B. Recalculate totals if items change or overallDiscount changes
    if (items || overallDiscount !== undefined) {
      let totalAmount = 0;
      let totalTax = 0;

      // If items are not provided, we might need to fetch existing ones to recalc,
      // but usually update sends full payload. Let's assume items are present if recalculation is needed
      // OR we just use provided items.

      const itemsToProcess = items || []; // Ideally should fetch check if items not passed but mostly FE sends all

      const processedItems = itemsToProcess.map((item) => {
        const baseTotal = item.price * item.quantity;
        const discountAmount = (baseTotal * (item.discount || 0)) / 100;
        const taxableAmount = baseTotal - discountAmount;
        const taxAmount = (taxableAmount * (item.gstRate || 0)) / 100;

        totalAmount += taxableAmount;
        totalTax += taxAmount;

        return {
          itemName: item.name, // Ensure strict mapping
          itemDescription: item.description || '',
          quantity: item.quantity,
          price: item.price,
          gstRate: item.gstRate,
          discount: item.discount,
          amount: taxableAmount + taxAmount,
        };
      });

      if (items) {
        updateData.items = processedItems;
      }

      // If items were not passed, we can't easily recalculate without fetching.
      // Assuming frontend sends items when updating amounts.
      if (items) {
        updateData.totalAmount = totalAmount;
        updateData.taxAmount = totalTax;
        let grandTotal = totalAmount + totalTax;

        // Use new overallDiscount or existing one?
        // If overallDiscount is in body, use it. If not, we might lose it if we don't fetch.
        // Good practice: FE sends everything.
        const discountToApply =
          overallDiscount !== undefined ? overallDiscount : 0;
        updateData.overallDiscount = discountToApply;

        const overallDiscountAmount = (grandTotal * discountToApply) / 100;
        updateData.grandTotal = grandTotal - overallDiscountAmount;
      }
    }

    const filter = { _id: req.params.id };
    if (req.user.businessId) {
      filter.businessId = req.user.businessId;
    }

    const invoice = await Invoice.findOneAndUpdate(filter, updateData, {
      new: true,
    }).populate('customer');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// 5. Delete Invoice
exports.deleteInvoice = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.businessId) {
      filter.businessId = req.user.businessId;
    }

    const invoice = await Invoice.findOneAndDelete(filter);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Get All Invoices (With Pagination, Filtering & Search)
exports.getAllInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      startDate,
      endDate,
      businessId, // Allow businessId override for Super Admin
    } = req.query;

    let targetBusinessId = req.user.businessId;

    // Super Admin Override
    if (req.user.role === 'super_admin' && businessId) {
      targetBusinessId = businessId;
    }

    const query = {
      businessId: targetBusinessId,
    };

    // Date Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search Logic (Invoice Number OR Customer Name OR Customer Phone)
    if (search) {
      // Find customers matching the search name or phone
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const customerIds = customers.map((c) => c._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('customer')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Invoice.countDocuments(query);

    res.json({
      invoices,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalInvoices: count,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Export Invoices
exports.exportInvoices = async (req, res, next) => {
  try {
    const {
      search = '',
      startDate,
      endDate,
      businessId, // Allow businessId override for Super Admin
    } = req.query;

    let targetBusinessId = req.user.businessId;

    // Super Admin Override
    if (req.user.role === 'super_admin' && businessId) {
      targetBusinessId = businessId;
    }

    const query = {
      businessId: targetBusinessId,
    };

    // Date Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search Logic (Invoice Number OR Customer Name OR Customer Phone)
    if (search) {
      // Find customers matching the search name or phone
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const customerIds = customers.map((c) => c._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('customer')
      .sort({ createdAt: -1 })
      .lean();

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found to export' });
    }

    const fields = [
      { label: 'Invoice Number', value: 'invoiceNumber' },
      { label: 'Customer Name', value: 'customerName' },
      { label: 'Customer Phone', value: 'customerPhone' },
      { label: 'Customer Address', value: 'customerAddress' },
      { label: 'Date', value: 'date' },
      { label: 'Subtotal', value: 'amount' },
      { label: 'Tax', value: 'tax' },
      { label: 'Grand Total', value: 'grandTotal' },
    ];

    const data = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || 'N/A',
      customerPhone: inv.customer?.phone || 'N/A',
      customerAddress: inv.customer?.address || 'N/A',
      date: new Date(inv.createdAt).toLocaleDateString(),
      amount: inv.totalAmount.toFixed(2),
      tax: inv.taxAmount.toFixed(2),
      grandTotal: inv.grandTotal.toFixed(2),
    }));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// 8. Get Single Invoice for Logged-In User
exports.getSingleInvoice = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      businessId: req.user.businessId,
    };

    const invoice = await Invoice.findOne(query).populate('customer');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};
