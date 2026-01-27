import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  CheckCircle2, 
  IndianRupee, 
  Briefcase,
  Award,
  Clock,
  ArrowLeft,
  Loader2,
  Edit2,
  Send,
  Target,
  FileText,
  Settings,
  Plus,
  Search,
  User,
  TrendingUp
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlassCard from "@/components/dashboard/GlassCard";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";

type ViewMode = 'profile' | 'poster' | 'earner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  tasks_completed: number | null;
  total_earned: number | null;
  average_rating: number | null;
  total_ratings: number | null;
  is_verified: boolean | null;
  created_at: string | null;
}

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  task_id: string;
}

interface Task {
  id: string;
  title: string;
  payout: number;
  status: string | null;
  created_at: string | null;
  category: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;
  
  // Get initial mode from URL query param, default to 'profile'
  const initialMode = (searchParams.get('mode') as ViewMode) || 'profile';
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  // Update mode when URL changes
  useEffect(() => {
    const urlMode = searchParams.get('mode') as ViewMode;
    if (urlMode && ['profile', 'poster', 'earner'].includes(urlMode)) {
      setViewMode(urlMode);
    }
  }, [searchParams]);

  // Update URL when mode changes manually
  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchParams({ mode });
  };

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!userId,
  });

  // Fetch ratings received as earner
  const { data: ratings = [] } = useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("task_ratings")
        .select("*")
        .eq("worker_id", userId)
        .order("created_at", { ascending: false });
      return (data || []) as Rating[];
    },
    enabled: !!userId,
  });

  // Fetch tasks completed as earner
  const { data: completedTasks = [] } = useQuery({
    queryKey: ['user-completed-tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, payout, status, created_at, category")
        .eq("assignee_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []) as Task[];
    },
    enabled: !!userId,
  });

  // Fetch tasks posted
  const { data: postedTasks = [] } = useQuery({
    queryKey: ['user-posted-tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, payout, status, created_at, category")
        .eq("poster_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as Task[];
    },
    enabled: !!userId,
  });

  // Calculate poster stats
  const posterStats = {
    tasksPosted: postedTasks.length,
    activeTasks: postedTasks.filter(t => t.status === 'open' || t.status === 'assigned').length,
    avgBudget: postedTasks.length > 0 
      ? Math.round(postedTasks.reduce((sum, t) => sum + t.payout, 0) / postedTasks.length) 
      : 0,
  };

  // Calculate earner stats
  const earnerStats = {
    tasksCompleted: profile?.tasks_completed || 0,
    totalEarned: profile?.total_earned || 0,
    completionRate: completedTasks.length > 0 ? 100 : 0,
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-accent/10 text-accent border-accent/20';
      case 'assigned': return 'bg-primary/10 text-primary border-primary/20';
      case 'open': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (profileLoading) {
    return (
      <PageTransition>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <DashboardLayout>
          <div className="pt-8">
            <GlassCard className="p-12 text-center max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-foreground mb-2">User not found</h2>
              <p className="text-muted-foreground mb-6">
                The profile you're looking for doesn't exist.
              </p>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </GlassCard>
          </div>
        </DashboardLayout>
      </PageTransition>
    );
  }

  const displayName = profile.full_name || profile.email?.split('@')[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = formatDate(profile.created_at);
  const avgRating = profile.average_rating || 0;

  const modeConfig = {
    profile: { icon: User, label: 'Profile', color: 'primary' },
    poster: { icon: Send, label: 'Poster', color: 'primary' },
    earner: { icon: Target, label: 'Earner', color: 'accent' },
  };

  return (
    <PageTransition>
      <DashboardLayout>
        <div className="pt-6 max-w-5xl mx-auto space-y-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link to={isOwnProfile ? "/" : "/marketplace"}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </motion.div>

          {/* Compact Header with Mode Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GlassCard className="p-4" glow>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* User Info - Compact */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-glow-sm">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {profile.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                      {profile.is_verified && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] py-0">
                          <Award className="w-2.5 h-2.5 mr-0.5" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {(profile.total_ratings || 0) > 0 ? (
                        <>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-foreground/80">{avgRating.toFixed(1)}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{profile.total_ratings} reviews</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/70">New on HustleHub</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl">
                  {(Object.keys(modeConfig) as ViewMode[]).map((mode) => {
                    const config = modeConfig[mode];
                    const Icon = config.icon;
                    const isActive = viewMode === mode;
                    
                    return (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`
                          relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive && mode === 'earner' ? 'text-accent' : isActive ? 'text-primary' : ''}`} />
                        <span>{config.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeMode"
                            className="absolute inset-0 bg-background rounded-lg shadow-sm -z-10"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Content Area - Mode Based */}
          <AnimatePresence mode="wait">
            {/* Profile Mode */}
            {viewMode === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Bio & Skills Card */}
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">About</h3>
                    {isOwnProfile && (
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {profile.bio ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic mb-4">
                      No bio added yet
                    </p>
                  )}

                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-muted/50 text-muted-foreground text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">No skills added</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/70">
                      Member since {memberSince}
                    </p>
                  </div>
                </GlassCard>

                {/* Reviews Section */}
                <GlassCard className="p-5">
                  <h3 className="font-semibold text-foreground mb-4">Reviews</h3>
                  
                  {ratings.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">No reviews yet</p>
                      <p className="text-xs text-muted-foreground/70">
                        Reviews will appear here after completing tasks
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ratings.slice(0, 5).map((rating, index) => (
                        <motion.div
                          key={rating.id}
                          className="p-3 rounded-xl bg-muted/30"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            {renderStars(rating.rating)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(rating.created_at)}
                            </span>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              "{rating.review}"
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* Settings Section */}
                {isOwnProfile && (
                  <GlassCard className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Account Settings</h3>
                          <p className="text-xs text-muted-foreground">Manage your profile and preferences</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Settings
                      </Button>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {/* Poster Mode */}
            {viewMode === 'poster' && (
              <motion.div
                key="poster"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Poster Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <GlassCard className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{posterStats.tasksPosted}</p>
                    <p className="text-xs text-muted-foreground">Tasks Posted</p>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                      <Briefcase className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{posterStats.activeTasks}</p>
                    <p className="text-xs text-muted-foreground">Active Tasks</p>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                      <IndianRupee className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{posterStats.avgBudget}</p>
                    <p className="text-xs text-muted-foreground">Avg Budget</p>
                  </GlassCard>
                </div>

                {/* Posted Tasks List */}
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Your Posted Tasks</h3>
                    {isOwnProfile && (
                      <Link to="/post-task">
                        <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                          <Plus className="w-4 h-4 mr-1" />
                          Post Task
                        </Button>
                      </Link>
                    )}
                  </div>

                  {postedTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Send className="w-7 h-7 text-muted-foreground/40" />
                      </div>
                      <h4 className="font-medium text-foreground text-sm mb-1">No tasks posted yet</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Create your first task and get work done
                      </p>
                      {isOwnProfile && (
                        <Link to="/post-task">
                          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
                            <Plus className="w-4 h-4 mr-2" />
                            Post Your First Task
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {postedTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{task.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(task.created_at)}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] py-0 px-1.5 capitalize ${getStatusColor(task.status)}`}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-foreground flex-shrink-0">
                            <IndianRupee className="w-4 h-4" />
                            <span>{task.payout.toLocaleString('en-IN')}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Earner Mode */}
            {viewMode === 'earner' && (
              <motion.div
                key="earner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {earnerStats.tasksCompleted > 0 ? (
                  <>
                    {/* Earner Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{earnerStats.tasksCompleted}</p>
                        <p className="text-xs text-muted-foreground">Tasks Completed</p>
                      </GlassCard>
                      <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                          <IndianRupee className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-accent">₹{earnerStats.totalEarned.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                      </GlassCard>
                      <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{earnerStats.completionRate}%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </GlassCard>
                    </div>

                    {/* Completed Tasks List */}
                    <GlassCard className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Completed Tasks</h3>
                        {isOwnProfile && (
                          <Link to="/marketplace">
                            <Button variant="outline" size="sm">
                              <Search className="w-4 h-4 mr-1" />
                              Find More
                            </Button>
                          </Link>
                        )}
                      </div>

                      <div className="space-y-3">
                        {completedTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-muted/30"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(task.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-accent flex-shrink-0">
                              <span>+</span>
                              <IndianRupee className="w-4 h-4" />
                              <span>{task.payout.toLocaleString('en-IN')}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </GlassCard>
                  </>
                ) : (
                  /* Empty State for Earner */
                  <GlassCard className="p-8">
                    <div className="text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-accent/60" />
                      </div>
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        Start Your Earning Journey
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        You haven't completed any tasks yet. Browse available tasks and start earning on HustleHub.
                      </p>
                      {isOwnProfile && (
                        <Link to="/marketplace">
                          <Button size="lg" className="bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 transition-opacity">
                            <Search className="w-4 h-4 mr-2" />
                            Explore Available Tasks
                          </Button>
                        </Link>
                      )}
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default UserProfile;
