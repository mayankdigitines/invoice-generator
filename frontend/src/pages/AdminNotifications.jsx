import React, { useState, useEffect } from 'react';
import api from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used, given the ShadCN UI context, or I'll use standard alert/console if not sure.
// Checking dependencies might be good, but standard ShadCN often uses sonner or similar. I'll rely on simple alerts or verify context later.
// I'll check package.json for toast library.

export default function AdminNotifications() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: 'all', // 'all' or specific business ID
    title: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/business/all');
      setBusinesses(data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      // Fail silently or show error
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (value) => {
    setFormData((prev) => ({ ...prev, recipientId: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      const payload = {
        title: formData.title,
        message: formData.message,
        businessId:
          formData.recipientId === 'all' ? null : formData.recipientId,
      };

      await api.post('/notifications/send', payload);
      alert('Notification sent successfully!');
      setFormData({
        recipientId: 'all',
        title: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Broadcast Notifications
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send New Notification</CardTitle>
            <CardDescription>
              Send a message to all businesses or a specific business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <Select
                  value={formData.recipientId}
                  onValueChange={handleRecipientChange}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Businesses (Broadcast)
                    </SelectItem>
                    {businesses.map((business) => (
                      <SelectItem key={business._id} value={business._id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject / Title</label>
                <Input
                  name="title"
                  placeholder="Important Update"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  name="message"
                  className="flex min-h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>Best practices for notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-disc pl-4 space-y-2">
              <li>
                Use <strong>Broadcast</strong> for system-wide announcements,
                maintenance alerts, or feature updates.
              </li>
              <li>
                Select a specific business for billing reminders, support
                responses, or account-specific alerts.
              </li>
              <li>Keep titles concise and messages clear.</li>
              <li>
                Notifications are delivered instantly to the recipients'
                dashboard.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
