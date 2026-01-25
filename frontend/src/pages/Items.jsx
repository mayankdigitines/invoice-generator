import { useEffect, useState, useCallback } from 'react';
import api from '@/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
} from 'lucide-react';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

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

  // Debouce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/items', {
        params: {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
        },
      });
      // Handle response
      if (res.data.items) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.totalItems);
        setCurrentPage(res.data.currentPage); // Sync with backend
      } else {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch items', err?.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    // Simple validation
    if (!formData.name || !formData.price) {
      alert('Please fill in required fields');
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/items/${currentItemId}`, formData);
      } else {
        await api.post('/items', formData);
      }
      setIsModalOpen(false);
      fetchItems(); // Refresh list
    } catch (err) {
      alert('Error saving item. Name must be unique.');
      console.error('Error saving item', err?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      alert('Error deleting item');
      console.error('Error deleting item', err?.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground mt-1">
            Manage your products and services here.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="w-full md:w-auto hover:cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Filters Section */}
      <Card classname="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name..."
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch('')}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Clear Search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 gap-0 border-muted/60 shadow-sm">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Name
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Description
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Price
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    GST %
                  </th>
                  <th className="h-12 px-4 align-middle font-medium whitespace-nowrap">
                    Disc %
                  </th>
                  <th className="h-12 px-4 align-middle font-medium text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center">
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">
                          Loading inventory...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {debouncedSearch
                        ? 'No items found matching your search.'
                        : 'No items found. Add one to get started.'}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b transition-colors hover:bg-muted/40"
                    >
                      <td className="p-3 align-middle font-medium">
                        {item.name}
                      </td>
                      <td className="p-3 align-middle text-muted-foreground truncate max-w-37.5">
                        {item.description || '-'}
                      </td>
                      <td className="p-3 align-middle">₹{item.price}</td>
                      <td className="p-3 align-middle">{item.gstRate}%</td>
                      <td className="p-3 align-middle">{item.discount}%</td>
                      <td className="p-3 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            className="hover:cursor-pointer h-8 w-8"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(item)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            className="hover:cursor-pointer h-8 w-8"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        {!loading && totalPages > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t p-4 bg-muted/20 gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Page <strong>{currentPage}</strong> of{' '}
              <strong>{totalPages}</strong> ({totalItems} items)
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 hover:cursor-pointer"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-3 hover:cursor-pointer"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
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
