import { useEffect, useState } from 'react';
import api from '../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Building2 } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    gstNumber: '',
    email: '',
    phone: '',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const canEdit = false;

  useEffect(() => {
    api.get('/business/profile').then((res) => {
      if (res.data) setForm(res.data);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-8 md:pt-8 md:pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full h-10 w-10 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 transition-all" />
          ) : (
            <Moon className="h-5 w-5 transition-all" />
          )}
        </Button>
      </div>

      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Business Profile</CardTitle>
          </div>
          <CardDescription>
            This information will appear on your invoices.
            {!canEdit && ' (Read Only)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Company Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Acme Inc."
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  GST Number
                </label>
                <Input
                  value={form.gstNumber}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value })
                  }
                  placeholder="GSTIN12345"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Address
              </label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                placeholder="123 Business St, City, State"
                disabled={!canEdit}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="billing@example.com"
                  type="email"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Phone
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  type="tel"
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Logo Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Logo URL
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  value={form.logoUrl || ''}
                  onChange={(e) =>
                    setForm({ ...form, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  className="flex-1"
                  disabled={!canEdit}
                />
                {form.logoUrl && (
                  <div className="h-10 w-10 border rounded overflow-hidden shrink-0 bg-muted/50">
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
