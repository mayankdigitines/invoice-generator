import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { FileDown } from 'lucide-react';

const InvoiceDownloadButton = ({ invoice, business }) => (
  <PDFDownloadLink
    document={<InvoicePDF invoice={invoice} business={business} />}
    fileName={`${invoice.invoiceNumber}.pdf`}
    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
  >
    {({ loading }) => (
      <>
        <FileDown size={16} />
        {loading ? 'Loading...' : 'Download'}
      </>
    )}
  </PDFDownloadLink>
);

export default InvoiceDownloadButton;
