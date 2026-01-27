const Invoice = require('../models/Invoice');
const Item = require('../models/Item');
const Customer = require('../models/Customer');

exports.createInvoice = async (req, res, next) => {
  try {
    const { customer, items } = req.body;

    // A. Handle Customer (Find or Create)
    let customerDoc = await Customer.findOne({ phone: customer.phone });
    if (customerDoc) {
      customerDoc.name = customer.name;
      customerDoc.address = customer.address;
      await customerDoc.save();
    } else {
      customerDoc = new Customer(customer);
      await customerDoc.save();
    }

    // B. Handle Items & Calculations
    let totalAmount = 0;
    let totalTax = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        // Auto-save new inventory
        if (!item._id && item.name) {
          let existingItem = await Item.findOne({ name: item.name });
          if (!existingItem) {
            await new Item({ ...item }).save();
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
          quantity: item.quantity,
          price: item.price,
          gstRate: item.gstRate,
          discount: item.discount,
          amount: taxableAmount + taxAmount,
        };
      }),
    );

    // C. Save Invoice
    const newInvoice = new Invoice({
      invoiceNumber: `INV-${Date.now()}`,
      customer: customerDoc._id,
      items: processedItems,
      totalAmount,
      taxAmount: totalTax,
      grandTotal: totalAmount + totalTax,
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
    const invoice = await Invoice.findById(req.params.id).populate('customer');
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
    const invoices = await Invoice.find({ customer: customerId }).sort({
      createdAt: -1,
    });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// 4. Update Invoice
exports.updateInvoice = async (req, res, next) => {
  try {
    const { items, customer } = req.body;
    let updateData = req.body;

    // Recalculate totals if items change
    if (items) {
      let totalAmount = 0;
      let totalTax = 0;

      const processedItems = items.map((item) => {
        const baseTotal = item.price * item.quantity;
        const discountAmount = (baseTotal * (item.discount || 0)) / 100;
        const taxableAmount = baseTotal - discountAmount;
        const taxAmount = (taxableAmount * (item.gstRate || 0)) / 100;

        totalAmount += taxableAmount;
        totalTax += taxAmount;

        return {
          ...item,
          amount: taxableAmount + taxAmount,
        };
      });

      updateData.items = processedItems;
      updateData.totalAmount = totalAmount;
      updateData.taxAmount = totalTax;
      updateData.grandTotal = totalAmount + totalTax;
    }
    
    // Update Customer info if provided
    if (customer && customer.phone) {
        let customerDoc = await Customer.findOne({ phone: customer.phone });
        if (customerDoc) {
             updateData.customer = customerDoc._id;
        }
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customer');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// 5. Delete Invoice
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Get All Invoices (With Pagination, Filtering & Search)
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;

    const query = {};

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

    // Search Logic (Invoice Number OR Customer Name)
    if (search) {
      // Find customers matching the search name
      const customers = await Customer.find({
        name: { $regex: search, $options: 'i' },
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
      .skip((page - 1) * limit);

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
