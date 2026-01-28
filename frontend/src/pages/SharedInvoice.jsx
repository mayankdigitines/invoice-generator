import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, Download } from 'lucide-react';
import api from '../api';
import { InvoicePDF } from '../components/InvoicePDF';
import { Button } from '../components/ui/button';

export default function SharedInvoice() {
  const { id, businessId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('Fetching invoice with id:', id, 'and businessId:', businessId);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        // Only fetch invoice, business data is populated inside it now
        const { data } = await api.get(`/invoices/${id}/${businessId}`);
        setInvoice(data);
        setBusiness(data.businessId); // businessId is now the populated object
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

      {/* PDF Viewer for Desktop */}
      <div className="hidden md:block flex-1 w-full h-full">
        <PDFViewer
          width="100%"
          height="100%"
          className="border-none w-full h-full"
          showToolbar={true}
        >
          <InvoicePDF invoice={invoice} business={business} />
        </PDFViewer>
      </div>

      {/* Mobile View - Simple */}
      <div className="md:hidden flex-1 w-full flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {business?.name || 'Invoice'}
            </h2>
            <p className="text-sm text-gray-500">Ready for download</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Invoice No.</span>
              <span className="font-medium text-gray-900">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Billed To</span>
              <span className="font-medium text-gray-900 truncate max-w-37.5 text-right">
                {invoice.customer?.name || 'N/A'}
              </span>
            </div>
          </div>

          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} business={business} />}
            fileName={`Invoice-${invoice.invoiceNumber}.pdf`}
            className="w-full block"
          >
            {({ blob, url, loading, error }) => (
              <Button
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}
