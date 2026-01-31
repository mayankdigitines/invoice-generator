import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Search,
  FileText,
  Loader2,
  Copy,
  AlertCircle,
  CalendarIcon,
  ExternalLink,
} from 'lucide-react';
import { validateInvoiceForm } from '../lib/validation';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  // Invoice Form States
  const [date, setDate] = useState(new Date());
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [items, setItems] = useState([
    { name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 },
  ]);
  const [inventory, setInventory] = useState([]); // All items for dropdown

  // Search & Results State
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Success & PDF State
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  // Optimized Inventory Lookup
  const inventoryMap = useMemo(() => {
    return new Map(inventory.map((item) => [item.name, item]));
  }, [inventory]);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          api.get('/items?all=true'), // Fetch all for dropdown
        ];

        if (isEditing) {
          promises.push(api.get(`/invoices/${id}`));
        }

        const [itemsRes, invoiceRes] = await Promise.all(promises);

        // Handle items response
        if (Array.isArray(itemsRes.data)) {
          setInventory(itemsRes.data);
        } else if (itemsRes.data.items) {
          setInventory(itemsRes.data.items);
        }

        // Populate Invoice if Editing
        if (invoiceRes && invoiceRes.data) {
          const inv = invoiceRes.data;
          setCustomer({
            name: inv.customer?.name || '',
            phone: inv.customer?.phone || '',
            address: inv.customer?.address || '',
          });
          if (inv.date) {
            setDate(new Date(inv.date));
          }
          // Ensure items have all fields for editing
          setItems(
            inv.items.map((i) => ({
              name: i.itemName || i.name,
              quantity: i.quantity,
              price: i.price,
              gstRate: i.gstRate || 0,
              discount: i.discount || 0,
            })),
          );
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        if (isEditing) {
          alert('Failed to load invoice details');
          navigate('/history');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing, navigate]);

  // --- Debounced Search ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await api.get(`/customers/search?query=${searchQuery}`);
          setSearchResults(res.data);
          setShowResults(true);
        } catch (err) {
          console.error('Search failed', err);
        }
      } else {
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Handlers ---
  const handleSearchChange = (val) => {
    // Update customer phone immediately for UI
    setCustomer((prev) => ({
      ...prev,
      [isNaN(val) ? 'name' : 'phone']: val,
    }));
    setSearchQuery(val);
  };

  const selectCustomer = useCallback((cust) => {
    setCustomer({
      name: cust.name,
      phone: cust.phone,
      address: cust.address || '',
    });
    setShowResults(false);
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 },
    ]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const updateItem = useCallback(
    (index, field, value) => {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill price from dropdown using optimized map
        if (field === 'name') {
          const found = inventoryMap.get(value);
          if (found) {
            newItems[index].price = found.price;
            newItems[index].gstRate = found.gstRate;
            newItems[index].discount = found.discount;
          }
        }
        return newItems;
      });
    },
    [inventoryMap],
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const base = item.price * item.quantity;
        const discountAmount = (base * item.discount) / 100;
        const taxable = base - discountAmount;
        const taxAmount = (taxable * item.gstRate) / 100;

        acc.subtotal += base;
        acc.discount += discountAmount;
        acc.tax += taxAmount;
        acc.total += taxable + taxAmount;

        return acc;
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );
  }, [items]);

  const handleSubmit = async () => {
    // Run Validation
    const { isValid, errors: validationErrors } = validateInvoiceForm(
      customer,
      items,
    );
    setErrors(validationErrors);

    if (!isValid) {
      return;
    }

    setIsGenerating(true);
    try {
      let res;

      if (isEditing) {
        res = await api.put(`/invoices/${id}`, { customer, items, date });
      } else {
        res = await api.post('/invoices/create', { customer, items, date });
      }
      setGeneratedInvoice(res.data);
      setIsSuccess(true);
    } catch (err) {
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscriptionRequired(true);
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Error: ${msg}`);
      console.error('Error handling invoice', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    if (isEditing) {
      navigate('/'); // Go back to create mode
      return;
    }
    setCustomer({ name: '', phone: '', address: '' });
    setItems([{ name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 }]);
    setIsSuccess(false);
    setGeneratedInvoice(null);
    setSearchQuery('');
  };

  // --- Success View ---
  /* Success View Logic Moved to Dialog at bottom */

  if (loading) {
    return (
      <div className="flex bg-muted/20 items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- Main Dashboard View ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-8">
      {/* Invoice Generator Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Modify invoice details below.'
                : 'Enter customer and item details to generate a PDF.'}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="min-w-45 shadow-sm font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="ml-2">
                  {isEditing ? 'Updating...' : 'Generating...'}
                </span>
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                <span className="ml-2">
                  {isEditing ? 'Update Invoice' : 'Generate Invoice'}
                </span>
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Customer Details */}
          <div className="md:col-span-1 space-y-6">
            <Card className="h-full border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className=" pt-4 border-b">
                <CardTitle className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 px-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase flex justify-between tracking-wider">
                    Invoice Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                    Phone Number
                    {errors.customerPhone && (
                      <span className="text-red-500 font-normal normal-case">
                        {errors.customerPhone}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search or enter phone..."
                      value={customer.phone}
                      maxLength={10} // Enforce 10 chars max
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // Only allow numbers
                        if (val.length <= 10) {
                          handleSearchChange(val);
                          if (errors.customerPhone)
                            setErrors({ ...errors, customerPhone: null });
                        }
                      }}
                      className={`pr-8 font-mono ${errors.customerPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                  </div>

                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full border rounded-md shadow-xl mt-1 max-h-48 overflow-y-auto">
                      {searchResults.map((res) => (
                        <div
                          key={res._id}
                          className="px-3 py-2 cursor-pointer text-sm border-b last:border-0"
                          onClick={() => selectCustomer(res)}
                        >
                          <div className="font-medium">{res.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {res.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                    Full Name
                    {errors.customerName && (
                      <span className="text-red-500 font-normal normal-case">
                        {errors.customerName}
                      </span>
                    )}
                  </label>
                  <Input
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (errors.customerName)
                        setErrors({ ...errors, customerName: null });
                    }}
                    placeholder="Customer Name"
                    className={
                      errors.customerName
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                    Address
                    {errors.customerAddress && (
                      <span className="text-red-500 font-normal normal-case">
                        {errors.customerAddress}
                      </span>
                    )}
                  </label>
                  <Input
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({ ...customer, address: e.target.value })
                    }
                    placeholder="Billing Address"
                    className={
                      errors.customerAddress
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Items Table */}
          <div className="md:col-span-2">
            <Card className="h-full border-0 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="pb-3 pt-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wide">
                  Items List
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Header */}
                <div className="hidden md:grid font-semibold text-[10px] uppercase tracking-widest grid-cols-12 gap-2 px-4 py-2 border-b">
                  <div className="col-span-5">Items</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-center">Tax</div>
                  <div className="col-span-1 text-center">Disc</div>
                  {/*want to move total to little right */}
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="max-h-100 overflow-y-auto p-4 md:p-0">
                  {items.map((item, index) => {
                    const base = item.price * item.quantity;
                    const discount = (base * item.discount) / 100;
                    const tax = ((base - discount) * item.gstRate) / 100;
                    const rowTotal = base - discount + tax;

                    return (
                      <div
                        key={index}
                        className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-2 p-4 md:p-2 border rounded-lg md:rounded-none md:border-b last:border-0 items-start md:items-center bg-card shadow-sm md:shadow-none mb-4 md:mb-0"
                      >
                        {/* Mobile Delete Button */}
                        <button
                          onClick={() => removeItem(index)}
                          className="absolute top-2 right-2 md:hidden text-red-500 p-2"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="w-full md:col-span-5 space-y-1 relative">
                          <label className="text-xs text-muted-foreground md:hidden">
                            Item Name
                          </label>
                          <Input
                            list={`items-list-${index}`}
                            placeholder="Item name"
                            className={`h-9 md:h-8 text-sm ${errors[`item_${index}_name`] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            value={item.name}
                            onChange={(e) => {
                              updateItem(index, 'name', e.target.value);
                              if (errors[`item_${index}_name`]) {
                                const newErrors = { ...errors };
                                delete newErrors[`item_${index}_name`];
                                setErrors(newErrors);
                              }
                            }}
                          />
                          {/* Inline Error Icon for Desktop */}
                          {errors[`item_${index}_name`] && (
                            <div
                              className="absolute right-2 top-2 text-red-500 pointer-events-none hidden md:block"
                              title={errors[`item_${index}_name`]}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          )}
                          <datalist id={`items-list-${index}`}>
                            {inventory.map((inv) => (
                              <option key={inv._id} value={inv.name} />
                            ))}
                          </datalist>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:contents">
                          <div className="md:col-span-1 relative">
                            <label className="text-xs text-muted-foreground md:hidden block mb-1">
                              Qty
                            </label>
                            <Input
                              className={`h-9 md:h-8 text-center px-1 ${errors[`item_${index}_quantity`] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                              onBlur={(e) => {
                                if (
                                  !e.target.value ||
                                  Number(e.target.value) < 1
                                ) {
                                  updateItem(index, 'quantity', 1);
                                }
                              }}
                            />
                          </div>
                          <div className="md:col-span-2 relative">
                            <label className="text-xs text-muted-foreground md:hidden block mb-1">
                              Price
                            </label>
                            <Input
                              className={`h-9 md:h-8 text-right px-1 ${errors[`item_${index}_price`] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'price',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:contents">
                          <div className="md:col-span-1">
                            <label className="text-xs text-muted-foreground md:hidden block mb-1">
                              Tax %
                            </label>
                            <Input
                              className="h-9 md:h-8 text-center px-1 text-xs"
                              type="number"
                              value={item.gstRate}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'gstRate',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-xs text-muted-foreground md:hidden block mb-1">
                              Disc %
                            </label>
                            <Input
                              className="h-9 md:h-8 text-center px-1 text-xs"
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  'discount',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-dashed">
                          <span className="text-sm font-medium md:hidden text-muted-foreground">
                            Total:
                          </span>
                          <span className="font-mono font-bold text-sm">
                            ₹{rowTotal.toFixed(0)}
                          </span>
                          <button
                            onClick={() => removeItem(index)}
                            className="hidden md:block text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              {/* Totals Section */}
              <div className="p-4 border-t">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex justify-between w-56 text-xs font-medium">
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-56 text-xs text-green-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{totals.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-56 text-xs font-medium">
                    <span>Tax (GST)</span>
                    <span>+ ₹{totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-56 font-bold text-base pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              Invoice{' '}
              <span className="font-mono font-medium">
                #{generatedInvoice?.invoiceNumber}
              </span>{' '}
              created successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Button
              variant="default"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const shareUrl = `${window.location.origin}/share/${generatedInvoice?._id}/${generatedInvoice?.businessId?._id || generatedInvoice?.businessId}`;
                window.open(shareUrl, '_blank');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View PDF
            </Button>

            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={
                  generatedInvoice
                    ? `${window.location.origin}/share/${generatedInvoice._id}/${generatedInvoice.businessId?._id || generatedInvoice.businessId}`
                    : ''
                }
                className="flex-1 font-mono text-xs h-9 bg-muted/50"
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-9 w-9 p-0"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${generatedInvoice?._id}/${generatedInvoice?.businessId?._id || generatedInvoice?.businessId}`;
                  navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsSuccess(false)}
              >
                Close
              </Button>
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Create New
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Required Dialog */}
      <Dialog
        open={subscriptionRequired}
        onOpenChange={setSubscriptionRequired}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Subscription Required
            </DialogTitle>
            <DialogDescription>
              Your subscription plan has expired or is inactive. To create new
              invoices, please purchase a subscription plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setSubscriptionRequired(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => navigate('/subscription')}>
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
