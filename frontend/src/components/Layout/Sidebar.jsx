import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut, X, Command } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function Sidebar({ navItems }) {
  const { logout, user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="hidden md:block w-16 h-screen sticky top-0 z-40 bg-background">
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'flex flex-col h-full bg-card border-r transition-all duration-300 ease-in-out',
          'absolute top-0 left-0 overflow-hidden z-50',
          isHovered ? 'w-64 shadow-2xl' : 'w-16 shadow-none'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b shrink-0 whitespace-nowrap overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0 shadow-sm">
             <Command className="h-4 w-4" />
          </div>
          <span 
            className={cn(
              "font-bold text-lg tracking-tight ml-3 transition-all duration-300",
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
          >
             {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
          </span>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsHovered(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-all relative overflow-hidden group/item',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <div className="shrink-0 flex items-center justify-center w-5">
                {item.icon}
              </div>
              <span 
                className={cn(
                  "font-medium text-sm whitespace-nowrap transition-all duration-300 delay-75",
                   isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t shrink-0 whitespace-nowrap overflow-hidden">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
             <LogOut className="h-5 w-5 shrink-0" />
             <span 
               className={cn(
                 "font-medium transition-all duration-300",
                 isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
               )}
             >Logout</span>
          </Button>
        </div>
      </aside>
    </div>
  );
}

export function MobileSidebar({ isOpen, setIsOpen, navItems }) {
  const { logout, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden font-sans">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-card border-r shadow-2xl animate-in slide-in-from-left flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
          <div className="flex items-center gap-2">
             <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
                 <Command className="h-4 w-4" />
             </div>
             <span className="font-semibold text-lg tracking-tight text-foreground">
               {user?.role === 'super_admin' ? 'Super Admin' : 'Invoice App'}
             </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="-mr-2 text-muted-foreground"
          >
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
                  'flex items-center gap-3 px-3 py-3 rounded-md transition-colors font-medium text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <div className="w-5">{item.icon}</div>
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
