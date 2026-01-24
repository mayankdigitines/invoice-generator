import { useEffect, useState } from 'react';
import api from '../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card.tsx';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = invoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Invoice History</h2>

      <Card className="overflow-hidden p-0 gap-0">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                {currentItems.map((inv) => (
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
        <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/10">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            Showing <strong>{invoices.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, invoices.length)}</strong> of <strong>{invoices.length}</strong> invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="h-8 px-2 lg:px-3 hover:cursor-pointer"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 px-2 lg:px-3 hover:cursor-pointer"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
