import { useEffect, useState } from 'react';
import api from '../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.tsx';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';
import { Loader2 } from 'lucide-react';

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We need both Invoices and Business Profile to generate PDFs
    const fetchData = async () => {
      try {
        const [invRes, busRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/business'),
        ]);
        setInvoices(invRes.data);
        setBusiness(busRes.data);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Invoice History</h2>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 align-middle font-medium">
                    Invoice #
                  </th>
                  <th className="h-12 px-4 align-middle font-medium">
                    Customer
                  </th>
                  <th className="h-12 px-4 align-middle font-medium">Date</th>
                  <th className="h-12 px-4 align-middle font-medium text-right">
                    Amount
                  </th>
                  <th className="h-12 px-4 align-middle font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No invoices found
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4 align-middle">
                      {inv.customer?.name || 'Unknown'}
                    </td>
                    <td className="p-4 align-middle">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {/* Using the new Frontend PDF Generator Button */}
                      {business && (
                        <InvoiceDownloadButton
                          invoice={inv}
                          business={business}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
