import { useEffect, useState } from 'react';
import api from '@/api';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  X,
  FileText,
  Trash2,
  Edit,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // Query Params
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: undefined,
    end: undefined,
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Pagination meta
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Invoices (On params change)
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
          search: debouncedSearch,
          startDate: dateRange.start
            ? format(dateRange.start, 'yyyy-MM-dd')
            : '',
          endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : '',
        };
        const { data } = await api.get('/invoices', { params });
        setInvoices(data.invoices);
        setTotalPages(data.totalPages);
        setTotalInvoices(data.totalInvoices);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [page, debouncedSearch, dateRange]);

  const clearFilters = () => {
    setSearch('');
    setDateRange({ start: undefined, end: undefined });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = {
        search: debouncedSearch,
        startDate: dateRange.start
          ? format(dateRange.start, 'yyyy-MM-dd')
          : '',
        endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : '',
      };

      const response = await api.get('/invoices/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export invoices:', error);
      alert('Failed to export invoices');
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
      setTotalInvoices((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoice History</h2>
          <p className="text-muted-foreground mt-1">
            View and manage your generated invoices.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Invoice #, Name or Phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-60 justify-start text-left font-normal bg-background px-3 py-1 h-9 shadow-sm hover:bg-background',
                    !dateRange.start && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.start ? (
                    format(dateRange.start, 'PPP')
                  ) : (
                    <span>From Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, start: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-60 justify-start text-left font-normal bg-background px-3 py-1 h-9 shadow-sm hover:bg-background',
                    !dateRange.end && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.end ? (
                    format(dateRange.end, 'PPP')
                  ) : (
                    <span>To Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                  disabled={(date) =>
                    dateRange.start ? date < dateRange.start : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(search || dateRange.start || dateRange.end) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Clear Filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card className="overflow-hidden p-0 gap-0 border-muted/60 shadow-sm">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Invoice #
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Customer
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Date
                  </th>
                  <th className="h-12 px-4 align-middle font-medium text-right whitespace-nowrap">
                    Amount
                  </th>
                  <th className="h-12 px-4 py-2 align-middle font-medium text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  '[&_tr:last-child]:border-0 transition-opacity duration-200',
                  loading && invoices.length > 0
                    ? 'opacity-50 pointer-events-none'
                    : '',
                )}
              >
                {invoices.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv._id}
                      className="border-b transition-colors hover:bg-muted/40"
                    >
                      <td className="p-3 align-middle font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {inv.customer?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {inv.customer?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(inv.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(inv.createdAt).toLocaleTimeString(
                              undefined,
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 align-middle text-right font-medium">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="p-3 align-middle text-right grid grid-flow-col gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="View PDF"
                          onClick={() =>
                            window.open(
                              `/share/${inv._id}/${inv.businessId}`,
                              '_blank',
                            )
                          }
                        >
                          <FileText className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Edit"
                          onClick={() => navigate(`/edit/${inv._id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              {deletingId === inv._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete invoice #{inv.invoiceNumber}{' '}
                                from your database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(inv._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))
                )}
                {/* Initial Loading Skeleton */}
                {loading &&
                  invoices.length === 0 &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-muted animate-pulse rounded w-16 ml-auto"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-8 bg-muted animate-pulse rounded w-24 ml-auto"></div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Pagination Footer */}
        {!loading && totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t p-4 bg-muted/20 gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
              {totalInvoices} results)
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
