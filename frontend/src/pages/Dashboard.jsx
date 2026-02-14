
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Loader2,
  Copy,
  Calendar as CalendarIcon,
  Check,
  Zap,
  Search,
  ExternalLink,
  RefreshCcw,
  FileText
} from 'lucide-react';
import { validateInvoiceForm } from '../lib/validation';

// --- Helper: Currency Formatter ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// --- Helper: WhatsApp Icon Component ---
const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function InvoiceGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Refs for Auto-Focus
  const itemNameRefs = useRef([]);

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  // Form Data
  const [date, setDate] = useState(new Date());
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [items, setItems] = useState([
    {
      id: 'initial_0',
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      gstRate: 18,
      discount: 0,
    },
  ]);
  const [overallDiscount, setOverallDiscount] = useState(0);

  // Data Lists
  const [inventory, setInventory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Post-Submit State
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  // Optimized Lookup
  const inventoryMap = useMemo(
    () => new Map(inventory.map((i) => [i.name, i])),
    [inventory],
  );

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      try {
        const [itemsRes, invoiceRes] = await Promise.all([
          api.get('/items?all=true'),
          isEditing
            ? api.get(`/invoices/${id}`)
            : Promise.resolve({ data: null }),
        ]);

        if (itemsRes.data?.items || Array.isArray(itemsRes.data)) {
          setInventory(
            Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.items,
          );
        }

        if (invoiceRes?.data) {
          const inv = invoiceRes.data;
          setCustomer({
            name: inv.customer?.name || '',
            phone: inv.customer?.phone || '',
            address: inv.customer?.address || '',
          });
          if (inv.date) setDate(new Date(inv.date));
          setItems(
            inv.items.map((i) => ({
              id: crypto.randomUUID(),
              name: i.itemName || i.name,
              description: i.itemDescription || '',
              quantity: i.quantity,
              price: i.price,
              gstRate: i.gstRate || 0,
              discount: i.discount || 0,
            })),
          );
          if (inv.overallDiscount) setOverallDiscount(inv.overallDiscount);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEditing]);

  // --- Search Logic ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await api.get(`/customers/search?query=${searchQuery}`);
          setSearchResults(res.data);
          setShowResults(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Core Logic ---
  const handleCustomerPhone = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setCustomer((prev) => ({ ...prev, phone: cleanVal }));
    setSearchQuery(cleanVal);
    if (errors.customerPhone) setErrors({ ...errors, customerPhone: null });
  };

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        gstRate: 18,
        discount: 0,
      },
    ]);
    setTimeout(() => {
      const lastIndex = items.length;
      itemNameRefs.current[lastIndex]?.focus();
    }, 10);
  }, [items.length]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' && index === items.length - 1) {
      e.preventDefault();
      addItem();
    }
  };

  const updateItem = (index, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };

      if (field === 'name') {
        const match = inventoryMap.get(val);
        if (match) {
          copy[index].price = match.price;
          copy[index].description = match.description || '';
          copy[index].gstRate = match.gstRate;
          copy[index].discount = match.discount;
        }
        if (errors[`item_${index}_name`]) {
          const newErrs = { ...errors };
          delete newErrs[`item_${index}_name`];
          setErrors(newErrs);
        }
      }
      return copy;
    });
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        const base = i.price * i.quantity;
        const itemDiscAmount = (base * i.discount) / 100;
        const netItemTotal = base - itemDiscAmount;
        const overallShare = (netItemTotal * overallDiscount) / 100;
        const taxableValue = netItemTotal - overallShare;
        const tax = (taxableValue * i.gstRate) / 100;

        return {
          sub: acc.sub + base,
          disc: acc.disc + itemDiscAmount,
          overallDiscAmount: acc.overallDiscAmount + overallShare,
          tax: acc.tax + tax,
          final: acc.final + (taxableValue + tax),
        };
      },
      { sub: 0, disc: 0, overallDiscAmount: 0, tax: 0, final: 0 },
    );
  }, [items, overallDiscount]);

  const handleSubmit = async () => {
    const { isValid, errors: errs } = validateInvoiceForm(customer, items);
    setErrors(errs);
    if (!isValid) return;

    setIsGenerating(true);
    try {
      const payload = { customer, items, date, overallDiscount };
      const res = isEditing
        ? await api.put(`/invoices/${id}`, payload)
        : await api.post('/invoices/create', payload);

      setGeneratedInvoice(res.data);
      setIsSuccess(true);
    } catch (err) {
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED')
        setSubscriptionRequired(true);
      else alert(err.message || 'Error creating invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- WhatsApp Logic ---
  const handleWhatsAppShare = () => {
    if (!generatedInvoice) return;
    
    // Construct the link
    const link = `${window.location.origin}/share/${generatedInvoice._id}/${generatedInvoice.businessId}`;
    
    // Construct the message
    const message = `Hello ${customer.name || 'Customer'},\n\nHere is your invoice for ${formatCurrency(totals.final)}.\n\nView and download it here:\n${link}\n\nThank you for your business!`;
    
    // Clean phone number (strip spaces, dashes). If no country code, you might want to prepend one via config.
    // For now, we assume user enters valid digits or we prepend international format if needed.
    let phone = customer.phone.replace(/\D/g, '');
    
    // Default to a generic country code if length is exactly 10 (common in India/US)
    // Adjust '91' to your default country code if needed.
    if (phone.length === 10) {
        phone = `91${phone}`; 
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyToClipboard = () => {
    if (!generatedInvoice) return;
    const link = `${window.location.origin}/share/${generatedInvoice._id}/${generatedInvoice.businessId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setIsSuccess(false);
    if (!isEditing) {
      setCustomer({ name: '', phone: '', address: '' });
      setItems([{
        id: crypto.randomUUID(), name: '', description: '', quantity: 1, price: 0, gstRate: 18, discount: 0,
      }]);
      setGeneratedInvoice(null);
      setOverallDiscount(0);
      setDate(new Date());
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {isEditing ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Fill details below to generate PDF
            </p>
          </div>
        </div>
        {/* <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(0)} className="hidden sm:flex">
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="min-w-36 shadow-md font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2 fill-current" />
            )}
            {isEditing ? 'Save Changes' : 'Generate Now'}
          </Button>
        </div> */}
      </div>

      <div className="max-w-5xl mx-auto mt-6 px-4 sm:px-6">
        <Card className="border shadow-md bg-card">
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* 1. Customer & Date Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Bill To */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Bill To
                </h3>
                <div className="grid gap-3">
                  {/* Phone with Search */}
                  <div className="relative group">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone</label>
                    <div className="relative">
                      <Input
                        value={customer.phone}
                        onChange={(e) => handleCustomerPhone(e.target.value)}
                        placeholder="Customer Phone (Search...)"
                        className={cn('bg-muted/30 font-mono', errors.customerPhone && 'border-red-500')}
                      />
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                    {/* Search Dropdown */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full bg-popover border rounded-md shadow-xl mt-1 max-h-40 overflow-y-auto">
                        {searchResults.map((res) => (
                          <div
                            key={res._id}
                            className="p-2 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => {
                              setCustomer({
                                name: res.name,
                                phone: res.phone,
                                address: res.address || '',
                              });
                              setShowResults(false);
                            }}
                          >
                            <div className="font-bold">{res.name}</div>
                            <div className="text-xs text-muted-foreground">{res.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.customerPhone && <span className="text-xs text-red-500">{errors.customerPhone}</span>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Name</label>
                    <Input
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (errors.customerName) setErrors({ ...errors, customerName: null });
                      }}
                      placeholder="Customer Name"
                      className={cn('bg-muted/30 font-medium', errors.customerName && 'border-red-500')}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Invoice Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 text-right md:text-left">
                  Invoice Details
                </h3>
                <div className="grid gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Date Issued</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn('w-full justify-start text-left font-normal bg-muted/30', !date && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Address */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Billing Address</label>
                    <Input
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Street Address, City"
                      className="bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Items Table Section */}
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-3 text-[10px] uppercase font-bold text-muted-foreground px-4 bg-muted/40 py-2 rounded-t-lg border-b">
                <div className="col-span-12 md:col-span-5">Item Details</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-center">Tax %</div>
                <div className="col-span-1 text-center">Disc %</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => {
                   const rowTotal = item.price * item.quantity - (item.price * item.quantity * item.discount) / 100 + ((item.price * item.quantity - (item.price * item.quantity * item.discount) / 100) * item.gstRate) / 100;

                  return (
                    <div
                      key={item.id || i}
                      className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all items-start"
                    >
                      <div className="md:hidden absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Item Inputs */}
                      <div className="md:col-span-5 space-y-2">
                        <label className="md:hidden text-[10px] font-bold text-muted-foreground">ITEM</label>
                        <Input
                          ref={(el) => (itemNameRefs.current[i] = el)}
                          list={`list-${i}`}
                          value={item.name}
                          onChange={(e) => updateItem(i, 'name', e.target.value)}
                          placeholder="Item Name"
                          className={cn('font-bold border-transparent hover:border-input focus:border-primary bg-muted/20 focus:bg-background px-3 transition-all', errors[`item_${i}_name`] && 'border-red-500 bg-red-50')}
                        />
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="h-8 text-xs text-muted-foreground border-transparent hover:border-input focus:border-primary bg-transparent px-3"
                        />
                        <datalist id={`list-${i}`}>
                          {inventory.map((x) => (
                            <option key={x._id} value={x.name} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex flex-col md:col-span-1">
                        <label className="md:hidden text-[10px] font-bold text-muted-foreground">QTY</label>
                        <Input
                          type="number"
                          min="1"
                          className="text-center bg-muted/20 focus:bg-background"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      <div className="flex flex-col md:col-span-2">
                        <label className="md:hidden text-[10px] font-bold text-muted-foreground">PRICE</label>
                        <div className="relative">
                          <span className="hidden md:block absolute left-2 top-2 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            min="0"
                            className="text-right md:pl-6 bg-muted/20 focus:bg-background"
                            value={item.price}
                            onChange={(e) => updateItem(i, 'price', Number(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 md:contents">
                        <div className="flex-1 md:col-span-1">
                          <label className="md:hidden text-[10px] font-bold text-muted-foreground">TAX %</label>
                          <Input
                            type="number"
                            className="text-center text-xs bg-muted/20 focus:bg-background"
                            value={item.gstRate}
                            onChange={(e) => updateItem(i, 'gstRate', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div className="flex-1 md:col-span-1">
                          <label className="md:hidden text-[10px] font-bold text-muted-foreground">DISC %</label>
                          <Input
                            type="number"
                            className="text-center text-xs bg-muted/20 focus:bg-background"
                            value={item.discount}
                            onChange={(e) => updateItem(i, 'discount', Number(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 border-dashed">
                        <span className="md:hidden font-bold text-sm">Total</span>
                        <div className="font-mono font-bold text-sm">
                            {formatCurrency(rowTotal)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
                          }}
                          className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={addItem}
                className="w-full border-dashed py-4 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-muted/50 transition-all font-medium mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Another Item (or press Enter on last item)
              </Button>
            </div>

            <div className=''>
              {/* 3. Totals Section */}
              <div className="flex flex-col md:flex-row pt-4 pb-12">
                <div className="w-full md:w-1/2 lg:w-1/3 space-y-1 bg-muted/20 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(totals.sub)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">- {formatCurrency(totals.disc)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST Output</span>
                    <span className="font-mono">{formatCurrency(totals.tax)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <span className="text-xs font-semibold">Overall Discount (%)</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-7 w-16 text-right text-sm bg-background"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  {totals.overallDiscAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 font-bold">
                      <span>Extra Off</span>
                      <span>- {formatCurrency(totals.overallDiscAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-blue-700">{formatCurrency(totals.final)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mr-6 -mt-32">
              <Button
                onClick={handleSubmit}
                disabled={isGenerating}
                className="min-w-72 shadow-md font-semibold bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2 fill-current" />
                )}
                {isEditing ? 'Save Changes' : 'Generate Now'}
              </Button>
              </div>
            </div>
          </CardContent>
          
        </Card>
       
      </div>

      {/* --- Optimized Success Modal (WhatsApp Integrated) --- */}
      <Dialog open={isSuccess} onOpenChange={handleReset}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 text-center bg-green-50/50">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl text-center">Invoice Generated!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Invoice <b>#{generatedInvoice?.invoiceNumber}</b> is ready to share.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            
             <div className="grid grid-cols-3 gap-3">
              {/* Secondary: View PDF */}
              <Button
                variant="outline"
                className="h-12 border-primary/20 hover:bg-primary/5 text-primary hover:text-primary"
                onClick={() =>
                  window.open(
                    `${window.location.origin}/share/${generatedInvoice?._id}/${generatedInvoice?.businessId}`,
                    '_blank'
                  )
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                View PDF
              </Button>

              {/* Tertiary: Copy Link */}
               <Button
                variant="outline"
                className="h-12"
                onClick={handleCopyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy Link
                  </>
                )}
              </Button>
              {/* Primary Action: WhatsApp */}
            <Button
              variant="primary"
                className="bg-green-400 h-12 border-primary/20 text-white hover:text-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all"
              onClick={handleWhatsAppShare}
            >
              <WhatsAppIcon className="w-8 h-8" />
            </Button>
            </div>
          </div>

          <DialogFooter className="bg-muted/50 p-4 justify-center sm:justify-center border-t">
             <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                <RefreshCcw className="w-3 h-3 mr-2" /> Create Another Invoice
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Required Modal */}
      <Dialog open={subscriptionRequired} onOpenChange={setSubscriptionRequired}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle>Subscription Required</DialogTitle>
            <DialogDescription>
              Your business subscription has expired or is inactive.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4 w-full">
            <Button variant="outline" onClick={() => setSubscriptionRequired(false)}>
              Later
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate('/subscription')}>
              Update Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
