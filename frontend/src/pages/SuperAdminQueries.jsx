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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Loader2, MessageSquare, Check, X as XIcon, Search, Clock, Archive } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function SuperAdminQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/queries/all'); // Keep original endpoint
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
      alert('Failed to update query');
    }
  };

  const openQueryModal = (query) => {
    setSelectedQuery(query);
    setAdminResponse(query.adminResponse || '');
    setIsQueryModalOpen(true);
  };

  // Split and Sort Queries
  const { pendingQueries, historyQueries } = useMemo(() => {
    // Basic search filtering
    const searchFiltered = queries.filter((query) => 
      query.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.businessId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.businessId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pending: Oldest first (FIFO queue)
    const pending = searchFiltered
      .filter(q => q.status === 'Pending')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // History: Newest first
    const history = searchFiltered
      .filter(q => q.status !== 'Pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { pendingQueries: pending, historyQueries: history };
  }, [queries, searchTerm]);

  if (loading && queries.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const QueryTable = ({ data, showQueueNumber = false }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[200px]">Business</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((q, index) => (
            <TableRow key={q._id}>
              <TableCell className="font-medium">
                {showQueueNumber ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs">
                        {index + 1}
                    </span>
                ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(q.createdAt).toLocaleDateString()}
                <div className="text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
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
                {q.adminResponse && (
                    <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Responded
                    </div>
                )}
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
          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-12 text-muted-foreground"
              >
                No queries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">Manage support tickets and inquiries.</p>
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
            placeholder="Search all queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-background/50 w-min flex space-x-2">
            <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending Queue
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {pendingQueries.length}
                </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
                <Archive className="h-4 w-4" />
                History
                <span className="ml-1 text-xs text-muted-foreground">
                    ({historyQueries.length})
                </span>
            </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Needs Attention</CardTitle>
                    <CardDescription>
                        {pendingQueries.length > 0 
                            ? `You have ${pendingQueries.length} pending tickets in queue.` 
                            : "No pending tickets. Good job!"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QueryTable data={pendingQueries} showQueueNumber={true} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>Past Tickets</CardTitle>
                    <CardDescription>
                        View resolved and rejected tickets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QueryTable data={historyQueries} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Query Detail Modal */}
      <Dialog open={isQueryModalOpen} onOpenChange={setIsQueryModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedQuery ? pendingQueries.indexOf(selectedQuery) !== -1 ? pendingQueries.indexOf(selectedQuery) + 1 : '' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Customer Info Section */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Business</h4>
                    <p className="font-medium text-sm">{selectedQuery?.businessId?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedQuery?.businessId?.email}</p>
                 </div>
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Submitted</h4>
                    <p className="text-sm">{selectedQuery && new Date(selectedQuery.createdAt).toLocaleString()}</p>
                 </div>
            </div>

            {/* Message Section */}
            <div className="space-y-2">
                <h4 className="font-semibold text-sm">Subject: {selectedQuery?.subject}</h4>
                <div className="p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedQuery?.message}
                </div>
            </div>
            
             {/* Admin Response Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                 <span>Response</span>
                 {selectedQuery?.status !== 'Pending' && (
                    <Badge variant="outline" className={
                        selectedQuery?.status === 'Resolved' ? 'text-green-600 border-green-200 bg-green-50' : 
                        selectedQuery?.status === 'Rejected' ? 'text-red-600 border-red-200 bg-red-50' : ''
                    }>{selectedQuery?.status}</Badge>
                 )}
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Type your reply here to resolve or reject the query..."
                disabled={selectedQuery?.status !== 'Pending'}
              />
            </div>
            
            {selectedQuery?.status === 'Pending' && (
                <DialogFooter className="gap-2 sm:gap-0">
                <div className="flex gap-2 w-full justify-between items-center">
                    <span className="text-xs text-muted-foreground">Action required</span>
                    <div className="flex gap-2">
                        <Button 
                        variant="destructive" 
                        onClick={() => handleUpdateQueryStatus('Rejected')}
                        disabled={!adminResponse}
                        
                        >
                        <XIcon className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button 
                        className="bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => handleUpdateQueryStatus('Resolved')}
                        disabled={!adminResponse}
                        >
                        <Check className="mr-2 h-4 w-4" /> Resolve
                        </Button>
                    </div>
                </div>
                </DialogFooter>
            )}

            {selectedQuery?.status !== 'Pending' && (
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQueryModalOpen(false)}>Close</Button>
                 </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
