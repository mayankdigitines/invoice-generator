import { useState, useEffect } from 'react';
import api from '../api';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export default function Subscription() {
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Assuming user context has basic info

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, statusRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/my-status'),
      ]);
      setPlans(plansRes.data);
      setStatus(statusRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingDays = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleBuy = async (plan) => {
    try {
      // 1. Create Order
      const { data: orderData } = await api.post(
        '/subscriptions/create-order',
        { planId: plan._id },
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Invoice Generator',
        description: `Subscription for ${plan.name}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 2. Verify Payment
            await api.post('/subscriptions/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
            });
            alert('Payment Successful!');
            fetchData(); // Refresh status
          } catch (err) {
            alert('Payment Verification Failed');
            console.error(err);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#3399cc',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert(response.error.description);
      });
      rzp1.open();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error initiating payment');
    }
  };

  const isActive = status?.subscriptionStatus === 'active';
  const remainingDays = calculateRemainingDays(status?.subscriptionEndDate);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Current Status Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Your Subscription Status</CardTitle>
          <CardDescription>
            {isActive
              ? `You have an active subscription.`
              : 'You do not have an active subscription.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p
                className={`text-xl font-bold ${isActive ? 'text-green-600' : 'text-red-600'} capitalize`}
              >
                {status?.subscriptionStatus || 'Inactive'}
              </p>
            </div>
            {isActive && (
              <div>
                <p className="text-sm text-gray-500">Expiring In</p>
                <p className="text-xl font-bold">
                  {remainingDays} days (
                  {new Date(status.subscriptionEndDate).toLocaleDateString()})
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        {isActive ? (
          <div className="p-4 bg-yellow-50 dark:text-black border border-yellow-200 rounded">
            Note: You can only purchase a new plan after your current plan
            expires.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">₹{plan.price}</div>
                  <div className="text-gray-500 capitalize mb-4">
                    {plan.durationType}
                  </div>
                  <p>{plan.description}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleBuy(plan)}>
                    Subscribe Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
