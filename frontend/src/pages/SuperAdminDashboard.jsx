import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, UserPlus, Loader2, Edit, Users, Key, Eye, MessageSquare, Check, X as XIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isEditBusinessModalOpen, setIsEditBusinessModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  // Data State
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessUsers, setBusinessUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');

  // Forms State
  const [businessForm, setBusinessForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    gstNumber: '',
    logoUrl: '',
  });

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
  });

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get('/business/all');
      setBusinesses(data);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    }
  };

  const fetchQueries = async () => {
    try {
      const { data } = await api.get('/queries/all');
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      setQueries([]); 
    }
  };

  const loadData = async () => {
     setLoading(true);
     await Promise.all([fetchBusinesses(), fetchQueries()]);
     setLoading(false);
  };

  const fetchBusinessUsers = async (businessId) => {
    try {
      const { data } = await api.get(`/business/${businessId}/users`);
      setBusinessUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetBusinessForm = () => {
    setBusinessForm({
      name: '',
      address: '',
      email: '',
      phone: '',
      gstNumber: '',
      logoUrl: '',
    });
  };

  const resetUserForm = () => {
    setUserForm({ email: '', password: '' });
  };

  // --- Handlers ---

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.post('/business/create', businessForm);
      setIsBusinessModalOpen(false);
      resetBusinessForm();
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create business');
    }
  };

  const handleEditBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/business/${selectedBusiness._id}`, businessForm);
      setIsEditBusinessModalOpen(false);
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update business');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/business/users/create', {
        ...userForm,
        businessId: selectedBusiness._id,
      });
      setIsCreateUserModalOpen(false);
      resetUserForm();
      fetchBusinessUsers(selectedBusiness._id);
      alert('User created successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/business/users/${selectedUser._id}`, userForm);
      setIsEditUserModalOpen(false);
      resetUserForm();
      fetchBusinessUsers(selectedBusiness._id);
      alert('User credentials updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleUpdateQueryStatus = async (status) => {
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

  const openEditBusiness = (business) => {
    setSelectedBusiness(business);
    setBusinessForm({
      name: business.name,
      address: business.address,
      email: business.email || '',
      phone: business.phone || '',
      gstNumber: business.gstNumber || '',
      logoUrl: business.logoUrl || '',
    });
    setIsEditBusinessModalOpen(true);
  };

  const openUsersModal = (business) => {
    setSelectedBusiness(business);
    fetchBusinessUsers(business._id);
    setIsUsersModalOpen(true);
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({ email: user.email, password: '' });
    setIsEditUserModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Generic Label component since shadcn Label might not be available
  const Label = ({ children, htmlFor }) => (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block"
    >
      {children}
    </label>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage businesses and users</p>
        </div>
        <Button
          onClick={() => {
            resetBusinessForm();
            setIsBusinessModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Business
        </Button>
      </div>

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="queries">Queries & Support</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Registered Businesses</CardTitle>
              <CardDescription>
                A list of all businesses using the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => (
                    <TableRow key={business._id}>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell>{business.address}</TableCell>
                      <TableCell>
                        <div className="text-sm">{business.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {business.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/business/${business._id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditBusiness(business)}
                            title="Edit Details"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUsersModal(business)}
                            title="Manage Users"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {businesses.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No businesses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle>Support Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((q) => (
                    <TableRow key={q._id}>
                      <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{q.businessId?.name}</div>
                        <div className="text-xs text-muted-foreground">{q.businessId?.email}</div>
                        {q.businessId?.phone && (
                          <div className="text-xs text-muted-foreground">{q.businessId?.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{q.subject}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{q.message}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          q.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          q.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {q.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedQuery(q);
                            setAdminResponse(q.adminResponse || '');
                            setIsQueryModalOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Business Modal */}
      <Dialog open={isBusinessModalOpen} onOpenChange={setIsBusinessModalOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
            <DialogDescription>
              Add a new business entity to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={businessForm.name}
                onChange={(e) =>
                  setBusinessForm({ ...businessForm, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={businessForm.address}
                onChange={(e) =>
                  setBusinessForm({ ...businessForm, address: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={businessForm.email}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={businessForm.phone}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={businessForm.gstNumber}
                onChange={(e) =>
                  setBusinessForm({
                    ...businessForm,
                    gstNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={businessForm.logoUrl}
                onChange={(e) =>
                  setBusinessForm({
                    ...businessForm,
                    logoUrl: e.target.value,
                  })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create Business</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Business Modal */}
      <Dialog
        open={isEditBusinessModalOpen}
        onOpenChange={setIsEditBusinessModalOpen}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBusiness} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Business Name</Label>
              <Input
                id="edit-name"
                value={businessForm.name}
                onChange={(e) =>
                  setBusinessForm({ ...businessForm, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={businessForm.address}
                onChange={(e) =>
                  setBusinessForm({ ...businessForm, address: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={businessForm.email}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={businessForm.phone}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-gstNumber">GST Number</Label>
              <Input
                id="edit-gstNumber"
                value={businessForm.gstNumber}
                onChange={(e) =>
                  setBusinessForm({
                    ...businessForm,
                    gstNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logoUrl">Logo URL</Label>
              <Input
                id="edit-logoUrl"
                placeholder="https://example.com/logo.png"
                value={businessForm.logoUrl}
                onChange={(e) =>
                  setBusinessForm({
                    ...businessForm,
                    logoUrl: e.target.value,
                  })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Users Modal */}
      <Dialog open={isUsersModalOpen} onOpenChange={setIsUsersModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Users - {selectedBusiness?.name}</DialogTitle>
            <DialogDescription>
              View and manage login credentials for this business.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  resetUserForm();
                  setIsCreateUserModalOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">
                        {user.role.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditUser(user)}
                        >
                          <Key className="mr-2 h-3 w-3" /> Reset / Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {businessUsers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Modal (Nested) */}
      <Dialog
        open={isCreateUserModalOpen}
        onOpenChange={setIsCreateUserModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User for {selectedBusiness?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="text"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                required
                placeholder="Enter password"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Credentials</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-password">
                New Password (Optional)
              </Label>
              <Input
                id="edit-user-password"
                type="text"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Update Credentials</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Query Detail Modal */}
      <Dialog open={isQueryModalOpen} onOpenChange={setIsQueryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handle Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-start text-sm text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">{selectedQuery?.businessId?.name}</span>
                  <span className="text-xs">
                    Phone: <a href={`tel:${selectedQuery?.businessId?.phone}`} className="hover:underline">{selectedQuery?.businessId?.phone || 'N/A'}</a>
                  </span>
                </div>
                <span>{selectedQuery && new Date(selectedQuery.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="font-semibold pt-1">{selectedQuery?.subject}</h4>
              <p className="text-sm">{selectedQuery?.message}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Admin Response</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                >
                  <XIcon className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={() => handleUpdateQueryStatus('Resolved')}
                  disabled={!adminResponse}
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
