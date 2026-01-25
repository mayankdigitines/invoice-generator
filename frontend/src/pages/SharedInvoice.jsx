import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import api from '../api';
import { InvoicePDF } from '../components/InvoicePDF';
import { Loader2 } from 'lucide-react';

export default function SharedInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const [invRes, busRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/business'),
        ]);
        setInvoice(invRes.data);
        setBusiness(busRes.data);
      } catch (err) {
        console.error('Failed to load invoice', err);
        setError('Invoice not found or link expired.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !business) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center space-y-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800">Oops!</h1>
          <p className="text-gray-600">
            {error || 'Could not load the invoice details.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header for context (optional, but nice) */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="font-bold text-lg text-gray-800">
          Invoice #{invoice.invoiceNumber}
        </div>
        {/* Make the Date format more readable with time */}
        <div className="text-sm text-gray-500">
          Created on:{' '}
          {new Date(invoice.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 w-full h-full">
        <PDFViewer
          width="100%"
          height="100%"
          className="border-none w-full h-full"
          showToolbar={true}
        >
          <InvoicePDF invoice={invoice} business={business} />
        </PDFViewer>
      </div>
    </div>
  );
}
