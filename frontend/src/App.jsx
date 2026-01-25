import { Suspense, lazy, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  Settings as SettingsIcon,
  PlusCircle,
  Package,
  FileClock,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Button } from '@/components/ui/button';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Items = lazy(() => import('./pages/Items'));
const SharedInvoice = lazy(() => import('./pages/SharedInvoice'));

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted/20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <div className="font-bold text-xl tracking-tight">InvoiceApp</div>
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
              label="Inventory"
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
          </nav>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-background border-r hidden md:flex flex-col sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b font-bold text-xl tracking-tight">
          InvoiceApp
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <NavItem
            to="/"
            icon={<PlusCircle size={20} />}
            label="New Invoice"
            isActive={location.pathname === '/'}
          />
          <NavItem
            to="/items"
            icon={<Package size={20} />}
            label="Inventory"
            isActive={location.pathname === '/items'}
          />
          <NavItem
            to="/history"
            icon={<FileClock size={20} />}
            label="History"
            isActive={location.pathname === '/history'}
          />
          <NavItem
            to="/settings"
            icon={<SettingsIcon size={20} />}
            label="Settings"
            isActive={location.pathname === '/settings'}
          />
        </nav>
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
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public / Standalone Routes */}
            <Route path="/share/:id" element={<SharedInvoice />} />

            {/* App Routes with Sidebar */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<Items />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label, isActive, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary hover:bg-primary/15'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default App;
