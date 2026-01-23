import { useState, useEffect } from 'react';
import api from '../api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, Search, CheckCircle } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../components/InvoicePDF';

export default function CreateInvoice() {
  // --- States ---
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [items, setItems] = useState([
    { name: '', quantity: 1, price: 0, gstRate: 18, discount: 0 },
  ]);
  const [inventory, setInventory] = useState([]); // For item dropdown

  // NEW STATES
  const [business, setBusiness] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null); // To store response
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch Inventory AND Business Profile on Load
  useEffect(() => {
    const fetchData = async () => {
      const [itemsRes, busRes] = await Promise.all([
        api.get('/items'),
        api.get('/business'),
      ]);
      setInventory(itemsRes.data);
      setBusiness(busRes.data);
    };
    fetchData();
  }, []);

  // --- Customer Search Logic ---
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

  // --- Item Logic ---
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

    // Auto-fill price if item selected from dropdown
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

  // --- Calculations ---
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
      // 1. Send data to backend to save
      const res = await api.post('/invoices/generate', { customer, items });

      // 2. Store the returned invoice object
      setGeneratedInvoice(res.data); // Backend now returns full JSON
      setIsSuccess(true);
    } catch (err) {
      alert('Error creating invoice');
      console.error('Error creating invoice', err?.message);
    }
  };

  if (isSuccess && generatedInvoice && business) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-3xl font-bold">Invoice Generated Successfully!</h2>
        <p className="text-muted-foreground">
          The invoice has been saved to history.
        </p>

        <div className="flex gap-4">
          {/* THE PDF DOWNLOAD BUTTON */}
          <PDFDownloadLink
            document={
              <InvoicePDF invoice={generatedInvoice} business={business} />
            }
            fileName={`${generatedInvoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button size="lg" disabled={loading}>
                {loading ? 'Preparing PDF...' : 'Download PDF Now'}
              </Button>
            )}
          </PDFDownloadLink>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Create New Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">New Invoice</h2>
        <div className="text-xl font-bold text-primary">
          Total: ₹{calculateTotal().toFixed(2)}
        </div>
      </div>

      {/* Customer Section */}
      <Card>
        <CardContent className="pt-6 grid md:grid-cols-3 gap-4 relative">
          <div className="relative">
            <label className="text-sm font-medium">Search / Phone</label>
            <div className="relative">
              <Input
                placeholder="Type Phone or Name..."
                value={customer.phone}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            {/* Autocomplete Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {searchResults.map((res) => (
                  <div
                    key={res._id}
                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => selectCustomer(res)}
                  >
                    {res.name} - {res.phone}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Customer Name</label>
            <Input
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
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
        <CardContent className="pt-6 space-y-4">
          <div className="flex font-medium text-sm text-muted-foreground mb-2">
            <div className="flex-1">Item Name</div>
            <div className="w-20 mx-2">Qty</div>
            <div className="w-24 mx-2">Price</div>
            <div className="w-20 mx-2">Disc %</div>
            <div className="w-16 mx-2">GST %</div>
            <div className="w-24 text-right">Total</div>
            <div className="w-10"></div>
          </div>

          {items.map((item, index) => {
            const rowBase = item.price * item.quantity;
            const rowTotal =
              rowBase -
              (rowBase * item.discount) / 100 +
              ((rowBase - (rowBase * item.discount) / 100) * item.gstRate) /
                100;

            return (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    list={`items-${index}`}
                    placeholder="Item Name"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  <datalist id={`items-${index}`}>
                    {inventory.map((inv) => (
                      <option key={inv._id} value={inv.name} />
                    ))}
                  </datalist>
                </div>
                <Input
                  className="w-20"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', Number(e.target.value))
                  }
                />
                <Input
                  className="w-24"
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(index, 'price', Number(e.target.value))
                  }
                />
                <Input
                  className="w-20"
                  type="number"
                  value={item.discount}
                  onChange={(e) =>
                    updateItem(index, 'discount', Number(e.target.value))
                  }
                />
                <Input
                  className="w-16"
                  type="number"
                  value={item.gstRate}
                  onChange={(e) =>
                    updateItem(index, 'gstRate', Number(e.target.value))
                  }
                />
                <div className="w-24 text-right pt-2 font-medium">
                  {rowTotal.toFixed(2)}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button variant="outline" onClick={addItem} className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} className="w-48 text-lg">
            Generate Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
