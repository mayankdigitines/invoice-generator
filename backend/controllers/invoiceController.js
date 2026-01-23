const Invoice = require('../models/Invoice');
const Business = require('../models/Business');
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

// 4. Get All Invoices (With Customer Details)
exports.getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};
