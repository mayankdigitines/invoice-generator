import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api';
import {
  Loader2,
  ArrowLeft,
  DollarSign,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BusinessDetails() {
  const { businessId } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTax: 0,
    count: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Business Details
        const businessRes = await api.get(`/business/${businessId}/details`);
        setBusiness(businessRes.data);

        // Fetch Stats
        const statsRes = await api.get(`/business/${businessId}/stats`);
        setStats(statsRes.data);

        // Fetch Analytics
        const analyticsRes = await api.get(`/business/${businessId}/analytics`);
        setChartData(analyticsRes.data);
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchData();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Details
          </h1>
          <p className="text-muted-foreground">ID: {businessId}</p>
          <div className="mt-2">
            <h2 className="text-xl font-semibold">{business.name}</h2>
            <p className="text-sm text-muted-foreground">{business.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime accumulated revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">Invoices generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tax Collected
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalTax.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">GST/Tax accumulated</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-87.5 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, 'Revenue']}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb" // Blue-600
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground p-10">
                  No data available for the chart
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Invoices Created</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-87.5 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="invoices"
                      stroke="#16a34a" // Green-600
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#16a34a" }}
                      activeDot={{ r: 6 }}
                      name="Invoices"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground p-10">
                  No data available for the chart
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
