import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api';
import {
  Loader2,
  ArrowLeft,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar as CalendarIcon,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function BusinessDetails() {
  const { businessId } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    planType: 'monthly',
    amount: '',
    paymentStatus: 'paid',
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTax: 0,
    count: 0,
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Business Details
        const businessRes = await api.get(`/business/${businessId}/details`);
        setBusiness(businessRes.data);
        if (businessRes.data?.subscription) {
            setSubscriptionForm({
                planType: businessRes.data.subscription.planType || 'monthly',
                amount: businessRes.data.subscription.amount || '',
                paymentStatus: businessRes.data.subscription.paymentStatus || 'paid'
            });
        }

        // Fetch Stats
        const statsRes = await api.get(`/business/${businessId}/stats`);
        setStats(statsRes.data);

        // Fetch Invoices
        const invoicesRes = await api.get('/invoices', {
          params: {
            businessId,
            page,
            limit: 10,
            search: debouncedSearch,
          },
        });
        setInvoices(invoicesRes.data.invoices);
        setTotalPages(Math.max(1, invoicesRes.data.totalPages));
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchData();
    }
  }, [businessId, page, debouncedSearch]);

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/business/${businessId}/subscription`, subscriptionForm);
      setBusiness(res.data);
      setSubscriptionModalOpen(false);
      alert('Subscription updated successfully');
    } catch (error) {
       console.error(error);
       alert('Failed to update subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Details
          </h1>
          <p className="text-muted-foreground">ID: {businessId}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime accumulated revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">Invoices generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tax Collected
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalTax.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">GST/Tax accumulated</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage business subscription plan</CardDescription>
            </div>
            <Button onClick={() => setSubscriptionModalOpen(true)}>Manage Subscription</Button>
        </CardHeader>
        <CardContent>
            {['active', 'pending', 'failed'].includes(business?.subscription?.status) ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium leading-none mb-1">Plan Type</div>
                        <div className="font-medium capitalize">{business.subscription.planType}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium leading-none mb-1">Status</div>
                        <div className={`font-medium capitalize ${
                            business.subscription.status === 'active' ? 'text-green-600' :
                            business.subscription.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>{business.subscription.status}</div>
                    </div>
                     <div>
                        <div className="text-sm font-medium leading-none mb-1">Start Date</div>
                        <div className="font-medium">{business.subscription.startDate ? format(new Date(business.subscription.startDate), 'dd MMM yyyy') : '-'}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium leading-none mb-1">End Date</div>
                        <div className="font-medium">{business.subscription.endDate ? format(new Date(business.subscription.endDate), 'dd MMM yyyy') : '-'}</div>
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground mr-4">No active subscription. Status: {business?.subscription?.status || 'None'}</div>
            )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            History of invoices linked to this business.
          </CardDescription>
          <div className="pt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{invoice.customer?.name || 'Unknown'}</TableCell>
                  <TableCell>₹{invoice.grandTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/share/${invoice._id}/${businessId}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Subscription</DialogTitle>
                <DialogDescription>Add or update subscription for this business.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="planType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Plan Type</label>
                    <select
                        id="planType"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={subscriptionForm.planType}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, planType: e.target.value})}
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Amount</label>
                    <Input
                        id="amount"
                        type="number"
                        value={subscriptionForm.amount}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, amount: e.target.value})}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="paymentStatus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Payment Status</label>
                     <select
                        id="paymentStatus"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={subscriptionForm.paymentStatus}
                        onChange={(e) => setSubscriptionForm({...subscriptionForm, paymentStatus: e.target.value})}
                    >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
                <DialogFooter>
                    <Button type="submit">Save Subscription</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
