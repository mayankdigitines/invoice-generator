const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = (invoiceData, businessData, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- Header ---
    doc.fontSize(20).text(businessData.name, { align: 'right' });
    doc.fontSize(10).text(businessData.address, { align: 'right' });
    doc.text(`GST: ${businessData.gstNumber}`, { align: 'right' });
    doc.moveDown();

    // --- Invoice Details ---
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Invoice Number: ${invoiceData.invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Bill To: ${invoiceData.customer.name}`);
    doc.text(`Phone: ${invoiceData.customer.phone}`);
    doc.moveDown();

    // --- Table Header ---
    const tableTop = 250;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 200, tableTop);
    doc.text('Price', 280, tableTop);
    doc.text('Total', 400, tableTop);
    doc.font('Helvetica');

    // --- Table Rows ---
    let y = tableTop + 25;
    invoiceData.items.forEach((item) => {
      doc.text(item.itemName, 50, y);
      doc.text(item.quantity, 200, y);
      doc.text(item.price.toFixed(2), 280, y);
      doc.text(item.amount.toFixed(2), 400, y);
      y += 20;
    });

    doc.moveDown();

    // --- Footer Totals ---
    doc.text(`Total Tax: ${invoiceData.taxAmount.toFixed(2)}`, {
      align: 'right',
    });
    doc
      .fontSize(14)
      .text(`Grand Total: ${invoiceData.grandTotal.toFixed(2)}`, {
        align: 'right',
      });

    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
};

module.exports = generateInvoicePDF;
