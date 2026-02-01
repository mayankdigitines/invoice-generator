import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCcw } from 'lucide-react';

export default function Support() {
  const [queries, setQueries] = useState([]);
  const [newQuery, setNewQuery] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (statusFilter === 'All') return true;
      return q.status === statusFilter;
    });
  }, [queries, statusFilter]);

  useEffect(() => {
    fetchQueries();
    // Poll for updates every 60 seconds
    const interval = setInterval(fetchQueries, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueries = async () => {
    try {
      const { data } = await api.get('/queries/my');
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch queries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchQueries();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuery.subject || !newQuery.message) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/queries', newQuery);
      setQueries([data, ...queries]);
      setNewQuery({ subject: '', message: '' });
      alert('Query submitted successfully!');
    } catch (error) {
      console.error('Failed to create query', error);
      alert(
        error.response?.data?.message ||
          'Failed to submit query. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          {/* Add loading in icon */}
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Query</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* ... */}
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                value={newQuery.subject}
                onChange={(e) =>
                  setNewQuery({ ...newQuery, subject: e.target.value })
                }
                placeholder="Brief subject regarding your issue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newQuery.message}
                onChange={(e) =>
                  setNewQuery({ ...newQuery, message: e.target.value })
                }
                placeholder="Describe your issue in detail..."
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Query'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>My Queries</CardTitle>
          <div className="w-45">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueries.map((q) => (
                <TableRow key={q._id}>
                  <TableCell>
                    {new Date(q.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{q.subject}</div>
                    <div className="text-sm text-gray-500">{q.message}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        q.status === 'Resolved'
                          ? 'bg-green-100 text-green-800'
                          : q.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </TableCell>
                  <TableCell>{q.adminResponse || '-'}</TableCell>
                </TableRow>
              ))}
              {filteredQueries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No queries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
