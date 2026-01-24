import { useState, useEffect } from 'react';
import api from '../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, Search, CheckCircle, FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../components/InvoicePDF';

export default function Dashboard() {
  // --- States ---
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [items, setItems] = useState([
    { name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 },
  ]);
  const [inventory, setInventory] = useState([]);

  // Search & Results State
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Success & PDF State
  const [business, setBusiness] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Fetch Inventory & Business on Load ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, busRes] = await Promise.all([
          api.get('/items'),
          api.get('/business'),
        ]);
        setInventory(itemsRes.data);
        setBusiness(busRes.data);
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleSearch = async (query) => {
    setCustomer((prev) => ({
      ...prev,
      [isNaN(query) ? 'name' : 'phone']: query,
    }));
    if (query.length > 2) {
      const res = await api.get(`/customers/search?query=${query}`);
      setSearchResults(res.data);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const selectCustomer = (cust) => {
    setCustomer(cust);
    setShowResults(false);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-fill price from dropdown
    if (field === 'name') {
      const found = inventory.find((inv) => inv.name === value);
      if (found) {
        newItems[index].price = found.price;
        newItems[index].gstRate = found.gstRate;
        newItems[index].discount = found.discount;
      }
    }
    setItems(newItems);
  };

  const calculateTotals = () => {
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
      { subtotal: 0, discount: 0, tax: 0, total: 0 }
    );
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    try {
      const res = await api.post('/invoices/generate', { customer, items});
      setGeneratedInvoice(res.data);
      setIsSuccess(true);
    } catch (err) {
      alert('Error creating invoice');
      console.error('Error creating invoice', err?.message);
    }
  };

  const resetForm = () => {
    setCustomer({ name: '', phone: '', address: '' });
    setItems([{ name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 }]);
    setIsSuccess(false);
    setGeneratedInvoice(null);
  };

  // --- Success View ---
  if (isSuccess && generatedInvoice && business) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle className="h-24 w-24 text-green-500" />
        <h2 className="text-3xl font-bold">Invoice Ready!</h2>
        <div className="text-muted-foreground text-center">
          Invoice #{generatedInvoice.invoiceNumber} created for{' '}
          {generatedInvoice.customer.name}
        </div>

        <div className="flex gap-4 mt-4">
          <PDFDownloadLink
            document={
              <InvoicePDF invoice={generatedInvoice} business={business} />
            }
            fileName={`${generatedInvoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button size="lg" className="w-48" disabled={loading}>
                {loading ? 'Preparing...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>

          <Button variant="outline" size="lg" onClick={resetForm}>
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Form View ---
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Invoice</h2>
          <p className="text-muted-foreground">
            Fill in the details below to generate a new invoice.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          className="h-12 text-lg  from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <FileText className="mr-2 h-5 w-5" /> Generate PDF
        </Button>
      </div>

      {/* Customer Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 relative">
          <div className="relative">
            <label  htmlFor="phone" className="text-sm font-medium mb-1 block">
              Phone or Search
            </label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="Start typing..."
                value={customer.phone}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            {/* Autocomplete Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {searchResults.map((res) => (
                  <div
                    key={res._id}
                    className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                    onClick={() => selectCustomer(res)}
                  >
                    <span className="">{res.name}</span>{' '}
                    <span className="text-gray-500">- {res.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium mb-1 block">Full Name</label>
            <Input
              id="name"
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="address" className="text-sm font-medium mb-1 block">Address</label>
            <Input
            id="address"
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground px-1">
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-1 text-center">GST%</div>
            <div className="col-span-1 text-center">Disc%</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item, index) => {
            const base = item.price * item.quantity;
            const discount = (base * item.discount) / 100;
            const tax = ((base - discount) * item.gstRate) / 100;
            const rowTotal = base - discount + tax;

            return (
              <div key={index} className="grid grid-cols-12 gap-4 items-center group">
                <div className="col-span-4 relative">
                  <Input
                    list={`items-list-${index}`}
                    placeholder="Item name"
                    className="h-9"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  <datalist id={`items-list-${index}`}>
                    {inventory.map((inv) => (
                      <option key={inv._id} value={inv.name} />
                    ))}
                  </datalist>
                </div>
                <div className="col-span-1">
                  <Input
                    className="h-9 text-center p-0"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    className="h-9 text-center"
                    type="number"
                    value={item.price}
                    min={0}
                    onChange={(e) =>
                      updateItem(index, 'price', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    className="h-9 text-center p-0"
                    type="number"
                    value={item.gstRate}
                    min={0}
                    onChange={(e) =>
                      updateItem(index, 'gstRate', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    className="h-9 text-center p-0"
                    type="number"
                    value={item.discount}
                    min={0}
                    onChange={(e) =>
                      updateItem(index, 'discount', Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2 text-right font-mono font-medium">
                  {rowTotal.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full mt-2 border-dashed text-muted-foreground hover:text-primary"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
             <span className="text-muted-foreground">Discount</span>
             <span className="text-red-500">-₹{totals.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
             <span className="text-muted-foreground">GST</span>
             <span>+₹{totals.tax.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3 mt-3 flex justify-between items-center">
            <span className="font-semibold text-lg">Total Amount</span>
            <span className="font-bold text-2xl text-primary">₹{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
