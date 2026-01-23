import { useEffect, useState } from 'react';
import api from '../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/modal';
import { Edit, Trash2, Plus, Package } from 'lucide-react';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    gstRate: 18,
    discount: 0,
    description: '',
  });

  // Fetch Items
  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items', err?.message);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handlers
  const openAddModal = () => {
    setFormData({
      name: '',
      price: '',
      gstRate: 18,
      discount: 0,
      description: '',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({
      name: item.name,
      price: item.price,
      gstRate: item.gstRate,
      discount: item.discount,
      description: item.description || '',
    });
    setCurrentItemId(item._id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/items/${currentItemId}`, formData);
      } else {
        await api.post('/items', formData);
      }
      fetchItems(); // Refresh list
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving item. Name must be unique.');
      console.error('Error saving item', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
    } catch (err) {
      alert('Error deleting item');
      console.error('Error deleting item', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button  className= "hover:cursor-pointer" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4 " /> Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> All Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 align-middle font-medium">Name</th>
                  <th className="h-12 px-4 align-middle font-medium">
                    Description
                  </th>
                  <th className="h-12 px-4 align-middle font-medium">Price</th>
                  <th className="h-12 px-4 align-middle font-medium">GST %</th>
                  <th className="h-12 px-4 align-middle font-medium">Disc %</th>
                  <th className="h-12 px-4 align-middle font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No items found. Add one to get started.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {item.name}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground truncate max-w-37.5">
                      {item.description || '-'}
                    </td>
                    <td className="p-4 align-middle">₹{item.price}</td>
                    <td className="p-4 align-middle">{item.gstRate}%</td>
                    <td className="p-4 align-middle">{item.discount}%</td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                        className= "hover:cursor-pointer"
                          variant="outline"
                          size="icon"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          className= "hover:cursor-pointer"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- Add/Edit Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Item' : 'Add New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Item Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Web Hosting"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional details"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                required
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">GST (%)</label>
              <Input
                type="number"
                value={formData.gstRate}
                onChange={(e) =>
                  setFormData({ ...formData, gstRate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Disc (%)</label>
              <Input
                type="number"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({ ...formData, discount: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
