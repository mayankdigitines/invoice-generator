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
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sidebar, MobileSidebar } from '@/components/Layout/Sidebar';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Items = lazy(() => import('./pages/Items'));
const SharedInvoice = lazy(() => import('./pages/SharedInvoice'));
const Login = lazy(() => import('./pages/Login'));
const BusinessDetails = lazy(() => import('./pages/BusinessDetails'));

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted/20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
        to: '/settings',
        icon: <SettingsIcon size={20} />,
        label: 'Settings',
        isActive: location.pathname === '/settings',
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

                {/* Business User Routes Only */}
                <Route element={<RequireBusiness />}>
                  <Route path="/edit/:id" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route
                  path="/business/:businessId"
                  element={<BusinessDetails />}
                />
              </Route>

              {/* Catch all - Redirect to Home/Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
