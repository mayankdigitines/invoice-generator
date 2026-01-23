import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import History from './pages/History';
import Settings from './pages/Settings';
import Items from './pages/Items';
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  PlusCircle,
  Package,
  FileClock,
} from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-muted/20 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-background border-r hidden md:block">
          <div className="h-16 flex items-center px-6 border-b font-bold text-xl tracking-tight">
            InvoiceApp
          </div>
          <nav className="p-4 space-y-2">
            <NavItem
              to="/"
              icon={<PlusCircle size={20} />}
              label="New Invoice"
            />
            <NavItem
              to="/items"
              icon={<Package size={20} />}
              label="Inventory"
            />
            <NavItem
              to="/history"
              icon={<FileClock size={20} />}
              label="History"
            />
            <NavItem
              to="/settings"
              icon={<SettingsIcon size={20} />}
              label="Settings"
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<Items />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

export default App;
