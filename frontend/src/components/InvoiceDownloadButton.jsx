import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { FileDown, Loader2 } from 'lucide-react';

const InvoiceDownloadButton = ({ invoice, business }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} business={business} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown size={16} />}
      {loading ? 'Generating...' : 'Download'}
    </button>
  );
};

export default InvoiceDownloadButton;
