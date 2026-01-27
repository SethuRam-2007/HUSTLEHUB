import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Wallet, LogOut, Send, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import NotificationBell from '@/components/NotificationBell';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const DashboardTopBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const { data: profile } = useQuery({
    queryKey: ['profile-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('balance, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 h-20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="h-full mx-4 mt-4 rounded-2xl glass-strong">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              HustleHub
            </span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Wallet Balance Pill - Links to Wallet page */}
                <Link to="/wallet">
                  <motion.div 
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 cursor-pointer hover:bg-accent/15 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Wallet className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-accent">
                      ₹{(profile?.balance || 0).toLocaleString('en-IN')}
                    </span>
                  </motion.div>
                </Link>

                {/* Notifications */}
                <NotificationBell />

                {/* Role Badges - Clickable links to profile modes */}
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to={`/profile/${user.id}?mode=poster`}>
                    <Badge 
                      variant="outline" 
                      className="bg-primary/5 text-primary/80 border-primary/20 text-[10px] px-2 py-0.5 font-medium cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <Send className="w-2.5 h-2.5 mr-1" />
                      Poster
                    </Badge>
                  </Link>
                  <Link to={`/profile/${user.id}?mode=earner`}>
                    <Badge 
                      variant="outline" 
                      className="bg-accent/5 text-accent/80 border-accent/20 text-[10px] px-2 py-0.5 font-medium cursor-pointer hover:bg-accent/10 transition-colors"
                    >
                      <Target className="w-2.5 h-2.5 mr-1" />
                      Earner
                    </Badge>
                  </Link>
                </div>

                {/* User Avatar - Links to Profile mode */}
                <Link to={`/profile/${user.id}?mode=profile`} className="flex items-center gap-3 group">
                  <div className="status-online">
                    <Avatar className="w-10 h-10 border-2 border-primary/20 transition-transform group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-medium">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
                  
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="font-medium bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardTopBar;