import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MessageSquare, Check, X as XIcon, Search, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function SuperAdminQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/queries/all');
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      setQueries([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleUpdateQueryStatus = async (status) => {
    if (!selectedQuery) return;
    
    try {
      await api.put(`/queries/${selectedQuery._id}`, {
        status,
        adminResponse 
      });
      setIsQueryModalOpen(false);
      setAdminResponse('');
      fetchQueries();
    } catch (error) {
       // In a real app we'd use a toast here
      alert('Failed to update query');
    }
  };

  const openQueryModal = (query) => {
    setSelectedQuery(query);
    setAdminResponse(query.adminResponse || '');
    setIsQueryModalOpen(true);
  };

  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      const matchesSearch = 
        query.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.businessId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.businessId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || query.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queries, searchTerm, statusFilter]);

  if (loading && queries.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Queries</h1>
          <p className="text-muted-foreground">Manage and respond to business support tickets.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchQueries} size="sm">
                Refresh
            </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
             <Filter className="h-4 w-4 text-muted-foreground" />
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {filteredQueries.length} {filteredQueries.length === 1 ? 'ticket' : 'tickets'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[200px]">Business</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredQueries.map((q) => (
                    <TableRow key={q._id}>
                    <TableCell className="whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium truncate max-w-[150px]" title={q.businessId?.name}>
                            {q.businessId?.name || 'Unknown Business'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={q.businessId?.email}>
                            {q.businessId?.email}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium truncate max-w-[200px] sm:max-w-[300px]" title={q.subject}>
                            {q.subject}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px]" title={q.message}>
                            {q.message}
                        </div>
                    </TableCell>
                    <TableCell>
                         <Badge 
                            variant={
                                q.status === 'Resolved' ? 'success' : 
                                q.status === 'Rejected' ? 'destructive' : 
                                'secondary'
                            }
                            className={
                                q.status === 'Resolved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                q.status === 'Rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }
                        >
                            {q.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openQueryModal(q)}
                        >
                        <MessageSquare className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                {filteredQueries.length === 0 && (
                    <TableRow>
                    <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                    >
                        No queries found matching your criteria.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Query Detail Modal */}
      <Dialog open={isQueryModalOpen} onOpenChange={setIsQueryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
              <div className="flex justify-between items-start text-sm text-muted-foreground">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-base">
                    {selectedQuery?.businessId?.name}
                  </span>
                  <span className="text-xs">
                    {selectedQuery?.businessId?.email}
                  </span>
                  {selectedQuery?.businessId?.phone && (
                     <span className="text-xs">
                        Phone: <a href={`tel:${selectedQuery.businessId.phone}`} className="hover:underline">{selectedQuery.businessId.phone}</a>
                     </span>
                  )}
                </div>
                <span className="text-xs border px-2 py-0.5 rounded bg-background">
                    {selectedQuery && new Date(selectedQuery.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                 <h4 className="font-semibold text-sm mb-1">{selectedQuery?.subject}</h4>
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedQuery?.message}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Response</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Write your response here..."
              />
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
               <div className="flex gap-2 w-full justify-end">
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateQueryStatus('Rejected')}
                  disabled={!adminResponse}
                  size="sm"
                >
                  <XIcon className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={() => handleUpdateQueryStatus('Resolved')}
                  disabled={!adminResponse}
                  size="sm"
                >
                  <Check className="mr-2 h-4 w-4" /> Resolve
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
