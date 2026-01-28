const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createInvoice,
  getInvoiceById,
  getCustomerInvoices,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
  getSingleInvoice,
} = require('../controllers/invoiceController');

// Save invoice data
router.post('/create', protect, createInvoice);

// Get single invoice by ID (Public for shared link)
router.get('/:id/:businessId', getInvoiceById);

// Get single invoice by ID (Protected for editing/viewing in dashboard)
router.get('/:id', protect, getSingleInvoice);

// Update/Delete Invoice
router.put('/:id', protect, updateInvoice);
router.delete('/:id', protect, deleteInvoice);

// Get invoices for a specific customer
router.get('/customer/:customerId', protect, getCustomerInvoices);

// Get all invoices with customer details
router.get('/', protect, getAllInvoices);

module.exports = router;
