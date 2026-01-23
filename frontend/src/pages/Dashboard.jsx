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

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
      const base = item.price * item.quantity;
      const discount = (base * item.discount) / 100;
      const tax = ((base - discount) * item.gstRate) / 100;
      return acc + base - discount + tax;
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post('/invoices/generate', { customer, items });
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
        <div className="text-2xl font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
          Total: ₹{calculateTotal().toFixed(2)}
        </div>
      </div>

      {/* Customer Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 relative">
          <div className="relative">
            <label className="text-sm font-medium mb-1 block">
              Phone or Search
            </label>
            <div className="relative">
              <Input
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
                    <span className="font-bold">{res.name}</span>{' '}
                    <span className="text-gray-500">- {res.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <Input
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Address</label>
            <Input
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
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
            <div className="flex-1">Description</div>
            <div className="w-20 text-center">Qty</div>
            <div className="w-24 text-center">Price</div>
            <div className="w-16 text-center">GST%</div>
            <div className="w-16 text-center">Disc%</div>
            <div className="w-24 text-right">Total</div>
            <div className="w-10"></div>
          </div>

          {items.map((item, index) => {
            const base = item.price * item.quantity;
            const discount = (base * item.discount) / 100;
            const tax = ((base - discount) * item.gstRate) / 100;
            const rowTotal = base - discount + tax;

            return (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    list={`items-list-${index}`}
                    placeholder="Enter item name..."
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  <datalist id={`items-list-${index}`}>
                    {inventory.map((inv) => (
                      <option key={inv._id} value={inv.name} />
                    ))}
                  </datalist>
                </div>
                <Input
                  className="w-20 text-center"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', Number(e.target.value))
                  }
                />
                <Input
                  className="w-24 text-center"
                  type="number"
                  value={item.price}
                  min={0}
                  onChange={(e) =>
                    updateItem(index, 'price', Number(e.target.value))
                  }
                />
                <Input
                  className="w-16 text-center"
                  type="number"
                  value={item.gstRate}
                  min={0}
                  onChange={(e) =>
                    updateItem(index, 'gstRate', Number(e.target.value))
                  }
                />
                <Input
                  className="w-16 text-center"
                  type="number"
                  value={item.discount}
                  min={0}
                  onChange={(e) =>
                    updateItem(index, 'discount', Number(e.target.value))
                  }
                />
                <div className="w-24 text-right font-mono font-medium">
                  {rowTotal.toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button
            variant="outline"
            onClick={addItem}
            className="w-full mt-4 border-dashed border-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Another Item
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          className="w-full md:w-64 h-12 text-lg shadow-xl shadow-primary/20"
        >
          <FileText className="mr-2 h-5 w-5" /> Generate Invoice
        </Button>
      </div>
    </div>
  );
}
