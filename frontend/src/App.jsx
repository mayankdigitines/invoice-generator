import { Suspense, lazy, useState, useMemo } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom';
import {
  Settings as SettingsIcon,
  PlusCircle,
  Package,
  FileClock,
  Loader2,
  Menu,
  BarChart2,
  HelpCircle,
  CreditCard,
  Receipt,
  Bell,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sidebar, MobileSidebar } from '@/components/Layout/Sidebar';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
const Notifications = lazy(() => import('./pages/Notifications'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Support = lazy(() => import('./pages/Support'));
const Items = lazy(() => import('./pages/Items'));
const SharedInvoice = lazy(() => import('./pages/SharedInvoice'));
const Login = lazy(() => import('./pages/Login'));
const BusinessDetails = lazy(() => import('./pages/BusinessDetails'));
const SubscriptionPlans = lazy(() => import('./pages/SubscriptionPlans'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Transactions = lazy(() => import('./pages/Transactions'));
const MyTransactions = lazy(() => import('./pages/MyTransactions'));

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted/20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireBusiness() {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = useMemo(() => {
    if (user?.role === 'super_admin') {
      return [
        {
          to: '/',
          icon: <SettingsIcon size={20} />,
          label: 'Overview',
          isActive: location.pathname === '/',
        },
        {
          to: '/admin/plans',
          icon: <CreditCard size={20} />,
          label: 'Subscription Plans',
          isActive: location.pathname === '/admin/plans',
        },
        {
          to: '/admin/transactions',
          icon: <Receipt size={20} />,
          label: 'Transactions',
          isActive: location.pathname === '/admin/transactions',
        },
        {
          to: '/admin/notifications',
          icon: <Bell size={20} />,
          label: 'Notifications',
          isActive: location.pathname === '/admin/notifications',
        },
      ];
    }
    return [
      {
        to: '/',
        icon: <PlusCircle size={20} />,
        label: 'New Invoice',
        isActive: location.pathname === '/',
      },
      {
        to: '/analytics',
        icon: <BarChart2 size={20} />,
        label: 'Analytics',
        isActive: location.pathname === '/analytics',
      },
      {
        to: '/items',
        icon: <Package size={20} />,
        label: 'Items Manage',
        isActive: location.pathname === '/items',
      },
      {
        to: '/history',
        icon: <FileClock size={20} />,
        label: 'History',
        isActive: location.pathname === '/history',
      },
      {
        to: '/subscription',
        icon: <CreditCard size={20} />,
        label: 'My Subscription',
        isActive: location.pathname === '/subscription',
      },
      {
        to: '/notifications',
        icon: <Bell size={20} />,
        label: 'Notifications',
        isActive: location.pathname === '/notifications',
      },
      {
        to: '/my-transactions',
        icon: <Receipt size={20} />,
        label: 'Transactions',
        isActive: location.pathname === '/my-transactions',
      },
      {
        to: '/settings',
        icon: <SettingsIcon size={20} />,
        label: 'Settings',
        isActive: location.pathname === '/settings',
      },
      {
        to: '/support',
        icon: <HelpCircle size={20} />,
        label: 'Support',
        isActive: location.pathname === '/support',
      },
    ];
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <Link to="/" className="font-bold text-xl tracking-tight">
          InvoiceApp
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        navItems={navItems}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        navItems={navItems}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public / Standalone Routes */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/share/:id/:businessId"
                element={<SharedInvoice />}
              />

              {/* App Routes with Sidebar */}
              <Route
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<DashboardRouter />} />
                <Route
                  path="/admin/notifications"
                  element={<AdminNotifications />}
                />
                <Route path="/admin/plans" element={<SubscriptionPlans />} />
                <Route path="/admin/transactions" element={<Transactions />} />

                {/* Business User Routes Only */}
                <Route element={<RequireBusiness />}>
                  <Route path="/edit/:id" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/my-transactions" element={<MyTransactions />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>

                <Route
                  path="/business/:businessId"
                  element={<BusinessDetails />}
                />

                {/* Catch all - Redirect to Home/Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
