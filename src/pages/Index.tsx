import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Wallet, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import FeaturedTaskCard from "@/components/dashboard/FeaturedTaskCard";
import ActivityPanel from "@/components/dashboard/ActivityPanel";
import GlassCard from "@/components/dashboard/GlassCard";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Task {
  id: string;
  title: string;
  payout: number;
  deadline: string | null;
  skill: string | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
}

const Index = () => {
  const { user } = useAuth();

  // Fetch featured tasks
  const { data: featuredTasks = [] } = useQuery({
    queryKey: ['featured-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .not('poster_id', 'is', null)
        .in('status', ['open', 'applications_received'])
        .order('payout', { ascending: false })
        .limit(6);
      return (data || []) as Task[];
    },
  });

  // Fetch user stats
  const { data: profile } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('balance, total_earned, tasks_completed, full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch recent transactions for activity
  const { data: transactions = [] } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getDifficulty = (skill: string | null): string => {
    if (skill === "beginner") return "Easy";
    if (skill === "intermediate") return "Medium";
    if (skill === "advanced") return "Hard";
    return "Medium";
  };

  const formatActivityTime = (timestamp: string | null) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const activities = transactions.map(t => ({
    id: t.id,
    type: t.type as 'earning' | 'completed' | 'pending',
    title: t.description || t.type,
    amount: t.amount,
    time: formatActivityTime(t.created_at),
  }));

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen">
          <DashboardLayout showSidebar={false}>
            <div className="max-w-5xl mx-auto pt-20 pb-24 px-4">
              {/* Hero Section - Premium, Investor-Ready */}
              <motion.div 
                className="text-center mb-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Brand Name - Hero Title */}
                <motion.h1 
                  className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  HUSTLEHUB
                </motion.h1>
                
                {/* Single Tagline */}
                <motion.p 
                  className="text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                >
                  The Micro-Task Marketplace for Students
                </motion.p>
                
                {/* Supporting Subtext */}
                <motion.p 
                  className="text-base text-muted-foreground/70 max-w-lg mx-auto mb-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 1.0 }}
                >
                  Post tasks. Gain experience. Earn money. Build your future.
                </motion.p>
                
                {/* Primary CTAs - Static, High-Intent */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <Link to="/post-task">
                    <Button 
                      size="lg" 
                      className="text-base font-semibold px-8 py-6 bg-primary hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Post a Task
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="text-base font-semibold px-8 py-6 border-2 border-border hover:bg-muted/50 transition-colors"
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      Earn by Completing Tasks
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* How It Works - Clean, Minimal */}
              <motion.div 
                className="grid md:grid-cols-3 gap-6 mb-20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.4 }}
              >
                {[
                  { step: "01", title: "Post Your Task", desc: "Describe what you need and set your budget" },
                  { step: "02", title: "Review Applicants", desc: "Choose the right student for the job" },
                  { step: "03", title: "Get It Done", desc: "Receive quality work and release payment" },
                ].map((item) => (
                  <div 
                    key={item.step} 
                    className="p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors text-center"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </motion.div>

              {/* Featured Tasks Preview */}
              {featuredTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.6 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Available Tasks</h2>
                    <Link to="/marketplace" className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors">
                      Browse all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredTasks.slice(0, 3).map((task, index) => (
                      <FeaturedTaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        payout={task.payout}
                        difficulty={getDifficulty(task.skill)}
                        deadline={task.deadline}
                        category={task.category || 'general'}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <footer className="border-t border-border/50 py-8">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    © 2025 HustleHub. All rights reserved.
                  </p>
                  <div className="flex gap-6">
                    <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Terms
                    </Link>
                    <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Privacy
                    </Link>
                    <Link to="/refund" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Refund
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </DashboardLayout>
        </div>
      </PageTransition>
    );
  }

  // Dashboard for authenticated users
  return (
    <PageTransition>
      <DashboardLayout>
        <div className="pt-8">
          {/* Welcome Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your tasks today.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Wallet Balance" 
              value={`₹${(profile?.balance || 0).toLocaleString('en-IN')}`}
              icon={Wallet}
              iconColor="text-primary"
              index={0}
            />
            <StatsCard 
              title="Total Earned" 
              value={`₹${(profile?.total_earned || 0).toLocaleString('en-IN')}`}
              icon={TrendingUp}
              iconColor="text-accent"
              trend={{ value: 12, positive: true }}
              index={1}
            />
            <StatsCard 
              title="Tasks Completed" 
              value={profile?.tasks_completed || 0}
              icon={CheckCircle2}
              iconColor="text-secondary"
              index={2}
            />
            <StatsCard 
              title="Active Tasks" 
              value={featuredTasks.length}
              icon={Briefcase}
              iconColor="text-primary"
              index={3}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Featured Tasks - 2 columns */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Featured Tasks</h2>
                <Link to="/marketplace" className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {featuredTasks.slice(0, 4).map((task, index) => (
                  <FeaturedTaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    payout={task.payout}
                    difficulty={getDifficulty(task.skill)}
                    deadline={task.deadline}
                    category={task.category || 'general'}
                    index={index}
                  />
                ))}
              </div>

              {featuredTasks.length === 0 && (
                <GlassCard className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No tasks available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Be the first to post a task and get work done!
                  </p>
                  <Link to="/post-task">
                    <Button className="bg-gradient-to-r from-primary to-secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Post a Task
                    </Button>
                  </Link>
                </GlassCard>
              )}

              {/* Quick Action */}
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <GlassCard className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5" glow>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Ready to earn?</h3>
                      <p className="text-sm text-muted-foreground">
                        Browse available tasks and start making money today.
                      </p>
                    </div>
                    <Link to="/marketplace">
                      <Button className="bg-gradient-to-r from-primary to-secondary shadow-glow-sm hover:shadow-glow">
                        Explore Tasks
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Activity Panel - 1 column */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.2 }}
              >
                <ActivityPanel activities={activities} />
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Index;