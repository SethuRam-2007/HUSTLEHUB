import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  PlusCircle, 
  Briefcase, 
  Wallet, 
  MessageSquare,
  HelpCircle,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Search, label: 'Explore Tasks', path: '/marketplace' },
  { icon: PlusCircle, label: 'Post Task', path: '/post-task' },
  { icon: Briefcase, label: 'My Work', path: '/my-tasks' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: HelpCircle, label: 'How It Works', path: '/how-it-works' },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <motion.aside 
      className="fixed left-4 top-28 bottom-4 w-56 z-40 hidden lg:block"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
    >
      <div className="h-full rounded-2xl glass p-4 flex flex-col">
        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    active 
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-glow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", active && "drop-shadow-lg")} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
          
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.35 }}
            >
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive('/admin')
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-glow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            </motion.div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-border/50 mt-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>© 2025 HustleHub</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
