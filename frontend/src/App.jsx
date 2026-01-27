import { Suspense, lazy, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation,
  Navigate,
} from 'react-router-dom';
import {
  Settings as SettingsIcon,
  PlusCircle,
  Package,
  FileClock,
  Loader2,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from './lib/utils';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Items = lazy(() => import('./pages/Items'));
const SharedInvoice = lazy(() => import('./pages/SharedInvoice'));
const Login = lazy(() => import('./pages/Login'));

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

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  // Close mobile menu when route changes
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

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

      {/* Mobile Sidebar / Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <nav className="relative w-64 bg-background h-full shadow-xl p-4 flex flex-col gap-2 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="font-bold text-xl tracking-tight">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <NavItem
              onClick={handleNavClick}
              to="/"
              icon={<PlusCircle size={20} />}
              label="New Invoice"
              isActive={location.pathname === '/'}
            />
            <NavItem
              onClick={handleNavClick}
              to="/items"
              icon={<Package size={20} />}
              label="Items Manage"
              isActive={location.pathname === '/items'}
            />
            <NavItem
              onClick={handleNavClick}
              to="/history"
              icon={<FileClock size={20} />}
              label="History"
              isActive={location.pathname === '/history'}
            />
            <NavItem
              onClick={handleNavClick}
              to="/settings"
              icon={<SettingsIcon size={20} />}
              label="Settings"
              isActive={location.pathname === '/settings'}
            />
            <div className="mt-auto border-t pt-4">
              <div className="px-4 py-2 text-sm text-gray-500 truncate">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside
        className={cn(
          'bg-background border-r hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!isSidebarCollapsed && (
            <Link
              to="/"
              className="font-bold text-xl tracking-tight hover:text-primary transition-colors truncate"
            >
              InvoiceApp
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('ml-auto', isSidebarCollapsed && 'mx-auto')}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem
            to="/"
            icon={<PlusCircle size={20} />}
            label="New Invoice"
            isActive={location.pathname === '/'}
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem
            to="/items"
            icon={<Package size={20} />}
            label="Items Manage"
            isActive={location.pathname === '/items'}
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem
            to="/history"
            icon={<FileClock size={20} />}
            label="History"
            isActive={location.pathname === '/history'}
            isCollapsed={isSidebarCollapsed}
          />
          <NavItem
            to="/settings"
            icon={<SettingsIcon size={20} />}
            label="Settings"
            isActive={location.pathname === '/settings'}
            isCollapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="p-4 border-t space-y-2">
          {!isSidebarCollapsed && (
            <div className="px-4 py-2 text-sm text-gray-500 truncate animate-in fade-in">
              {user?.email}
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              'w-full text-red-500 hover:text-red-600 hover:bg-red-50',
              isSidebarCollapsed ? 'justify-center px-2' : 'justify-start',
            )}
            onClick={logout}
            title="Log Out"
          >
            <LogOut className={cn('h-5 w-5', !isSidebarCollapsed && 'mr-2 h-4 w-4')} />
            {!isSidebarCollapsed && 'Log Out'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
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
              <Route path="/share/:id" element={<SharedInvoice />} />

              {/* App Routes with Sidebar */}
              <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/edit/:id" element={<Dashboard />} />
                <Route path="/items" element={<Items />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label, isActive, onClick, isCollapsed }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group relative',
        isActive
          ? 'bg-primary/10 text-primary hover:bg-primary/15'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2',
      )}
      title={isCollapsed ? label : undefined}
    >
      <span className={cn(isCollapsed ? 'mr-0' : '')}>{icon}</span>
      {!isCollapsed && <span className="animate-in fade-in duration-200">{label}</span>}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 w-max rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
          {label}
        </div>
      )}
    </Link>
  );
}

export default App;
