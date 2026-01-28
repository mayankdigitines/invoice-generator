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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trash2,
  Plus,
  Search,
  CheckCircle,
  FileText,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Share2,
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
  const [business, setBusiness] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
          api.get('/business/profile'), // Business Profile
        ];

        if (isEditing) {
          promises.push(api.get(`/invoices/${id}`));
        }

        const [itemsRes, busRes, invoiceRes] = await Promise.all(promises);

        // Handle items response
        if (Array.isArray(itemsRes.data)) {
          setInventory(itemsRes.data);
        } else if (itemsRes.data.items) {
          setInventory(itemsRes.data.items);
        }

        setBusiness(busRes.data);

        // Populate Invoice if Editing
        if (invoiceRes && invoiceRes.data) {
          const inv = invoiceRes.data;
          setCustomer({
            name: inv.customer?.name || '',
            phone: inv.customer?.phone || '',
            address: inv.customer?.address || '',
          });
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
      // Find the first error to scroll to or alert
      const firstError = Object.values(validationErrors)[0];
      // alert(`Form Error: ${firstError}`); // Optional: keep purely visual
      return;
    }

    setIsGenerating(true);
    try {
      let res;
      if (isEditing) {
        res = await api.put(`/invoices/${id}`, { customer, items });
      } else {
        res = await api.post('/invoices/create', { customer, items });
      }
      setGeneratedInvoice(res.data);
      setIsSuccess(true);
    } catch (err) {
      alert(`Error ${isEditing ? 'updating' : 'creating'} invoice`);
      console.error('Error handling invoice', err?.message);
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
  if (isSuccess && generatedInvoice) {
    const businessId =
      generatedInvoice.businessId?._id || generatedInvoice.businessId;
    const shareUrl = `${window.location.origin}/share/${generatedInvoice._id}/${businessId}`;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold ">
                Invoice {isEditing ? 'Updated' : 'Created'}
              </h2>
              <p className="text-sm ">
                Invoice{' '}
                <span className="font-mono ">
                  #{generatedInvoice.invoiceNumber}
                </span>{' '}
                is ready.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg border shadow-sm">
            <Button
              variant="default"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.open(shareUrl, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View PDF
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Invoice Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Invoice</DialogTitle>
                  <DialogDescription>
                    Copy the unique link below to share this invoice with your
                    customer.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="flex-1 font-mono text-sm bg-gray-50 h-10"
                  />
                  <Button
                    size="icon"
                    className={`shrink-0 transition-all duration-200 h-10 w-10 ${
                      copied ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                    }`}
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button variant="outline" onClick={resetForm}>
            {isEditing ? 'Start New Invoice' : 'Create New Invoice'}
          </Button>
        </div>
      </div>
    );
  }

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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                {isEditing ? 'Updating...' : 'Generating...'}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />{' '}
                {isEditing ? 'Update Invoice' : 'Generate Invoice'}
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Customer Details */}
          <div className="md:col-span-1 space-y-6">
            <Card className="h-full border-blue-100 dark:border-blue-900 shadow-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-base font-semibold text-blue-600">
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
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
                    <div className="absolute z-50 w-full bg-white dark:bg-zinc-950 border rounded-md shadow-xl mt-1 max-h-48 overflow-y-auto">
                      {searchResults.map((res) => (
                        <div
                          key={res._id}
                          className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-sm border-b last:border-0"
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
            <Card className="h-full shadow-sm">
              <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Items List
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Header */}
                <div className="hidden md:grid bg-muted/40 font-medium text-xs text-muted-foreground grid-cols-12 gap-2 px-4 py-2 border-b">
                  <div className="col-span-5">ITEM / DESCRIPTION</div>
                  <div className="col-span-1 text-center">QTY</div>
                  <div className="col-span-2 text-right">PRICE</div>
                  <div className="col-span-1 text-center">TAX%</div>
                  <div className="col-span-1 text-center">DISC%</div>
                  {/*want to move total to little right */}
                  <div className="col-span-2 text-right">TOTAL</div>
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
                        className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-2 p-4 md:p-3 border rounded-lg md:rounded-none md:border-b last:border-0 items-start md:items-center bg-card md:hover:bg-muted/20 transition-colors shadow-sm md:shadow-none mb-4 md:mb-0"
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
              <div className="bg-muted/10 p-4 border-t">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex justify-between w-48 text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-sm text-green-600">
                    <span>Discount:</span>
                    <span>- ₹{totals.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-sm text-muted-foreground">
                    <span>Tax (GST):</span>
                    <span>+ ₹{totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-48 font-bold text-lg pt-2 border-t mt-1">
                    <span>Total:</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
