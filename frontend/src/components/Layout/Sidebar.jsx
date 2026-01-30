import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Sidebar({ isCollapsed, toggleSidebar, navItems }) {
  const { logout, user } = useAuth();
  const SidebarIcon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b shrink-0 bg-card">
        {!isCollapsed && (
          <span className="font-semibold text-lg tracking-tight truncate text-foreground">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('text-muted-foreground hover:text-foreground h-8 w-8', isCollapsed ? 'mx-auto' : 'ml-auto')}
          onClick={toggleSidebar}
        >
          <SidebarIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const navLinkStyle = ({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md transition-colors duration-200',
              isCollapsed ? 'justify-center p-2' : 'px-3 py-2',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            );

          const content = (
            <>
              {item.icon}
              {!isCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
            </>
          );

          if (isCollapsed) {
            return (
              <TooltipProvider key={item.to} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink to={item.to} className={navLinkStyle}>
                       <span className="flex items-center justify-center">
                         {item.icon}
                       </span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <NavLink key={item.to} to={item.to} className={navLinkStyle}>
              {content}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t shrink-0 bg-card">
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </Button>
        )}
      </div>
    </aside>
  );
}

export function MobileSidebar({ isOpen, setIsOpen, navItems }) {
  const { logout, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden font-sans">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
          <span className="font-semibold text-lg tracking-tight text-foreground">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="-mr-2 text-muted-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
