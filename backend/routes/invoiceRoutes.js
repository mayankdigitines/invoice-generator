const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoiceById,
  getCustomerInvoices,
  getAllInvoices,
  getInvoicePdf,
} = require('../controllers/invoiceController');

// Save invoice data
router.post('/create', createInvoice);

// Get single invoice by ID
router.get('/:id', getInvoiceById);

// Get invoices for a specific customer
router.get('/customer/:customerId', getCustomerInvoices);

// Get all invoices with customer details
router.get('/', getAllInvoices);

module.exports = router;
