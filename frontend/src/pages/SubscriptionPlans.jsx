import { useState, useEffect } from 'react';
import api from '../api';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal.jsx';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    durationType: 'monthly',
    price: '',
    description: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/subscriptions/plans');
      setPlans(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/plans', formData);
      setIsModalOpen(false);
      fetchPlans(); // refresh
      setFormData({
        name: '',
        durationType: 'monthly',
        price: '',
        description: '',
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating plan');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/subscriptions/plans/${id}`, { isActive: !currentStatus });
      fetchPlans();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create New Plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : (
          plans.map((plan) => (
            <Card key={plan._id} className={!plan.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {plan.durationType}
                </p>
                <p className="mt-4">{plan.description}</p>
                <p className="text-xs text-gray-400 mt-2">ID: {plan._id}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.isActive ? 'destructive' : 'default'}
                  onClick={() => toggleStatus(plan._id, plan.isActive)}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Plan"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plan Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <select
              className="w-full border rounded p-2 bg-background"
              value={formData.durationType}
              onChange={(e) =>
                setFormData({ ...formData, durationType: e.target.value })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Create Plan
          </Button>
        </form>
      </Modal>
    </div>
  );
}
