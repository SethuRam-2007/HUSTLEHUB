import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Wallet, Home, Briefcase, LogOut, ClipboardList, Shield, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "./NotificationBell";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/');
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              HustleHub
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`flex items-center gap-2 font-medium transition-colors ${
                isActive("/") ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link 
              to="/marketplace" 
              className={`flex items-center gap-2 font-medium transition-colors ${
                isActive("/marketplace") ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Tasks
            </Link>
            <Link 
              to="/my-tasks" 
              className={`flex items-center gap-2 font-medium transition-colors ${
                isActive("/my-tasks") ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              My Tasks
            </Link>
            <Link 
              to="/wallet" 
              className={`flex items-center gap-2 font-medium transition-colors ${
                isActive("/wallet") ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              <Wallet className="w-4 h-4" />
              My Wallet
            </Link>
            <Link 
              to="/how-it-works" 
              className={`flex items-center gap-2 font-medium transition-colors ${
                isActive("/how-it-works") ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              How It Works
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`flex items-center gap-2 font-medium transition-colors ${
                  isActive("/admin") ? "text-primary" : "text-foreground/70 hover:text-primary"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="animate-pulse h-10 w-24 bg-muted rounded-md" />
            ) : user ? (
              <>
                <NotificationBell />
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  className="font-medium"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="font-medium">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
