import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function Sidebar({ isCollapsed, toggleSidebar, navItems }) {
  const { logout, user } = useAuth();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card transition-all duration-300 relative h-screen top-0',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <span className="font-bold text-xl tracking-tight truncate">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto', isCollapsed ? 'mx-auto' : '')}
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2',
              )
            }
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            'w-full flex items-center gap-2 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            isCollapsed && 'justify-center px-0',
          )}
          onClick={logout}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

export function MobileSidebar({ isOpen, setIsOpen, navItems }) {
  const { logout, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-card border-r shadow-lg animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="font-bold text-xl tracking-tight truncate">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
