import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { TaskGrid } from "@/components/tasks/TaskGrid";
import CategoryFilter from "@/components/CategoryFilter";
import PageTransition from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  description: string | null;
  payout: number;
  deadline: string | null;
  skill: string | null;
  difficulty: string | null;
  time_required: string | null;
  status: string | null;
  created_at: string | null;
  poster_id: string;
  assignee_id: string | null;
  category: string | null;
  application_count: number | null;
}

const Marketplace = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    // Only fetch tasks from real users (poster_id is a valid UUID and not null)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .not("poster_id", "is", null)
      .in("status", ["open", "applications_received"])
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } else {
      // Filter out any demo/sample tasks - only show real user-posted tasks
      const realTasks = (data || []).filter(task => {
        // Exclude tasks with demo-like poster IDs or sample titles
        const isDemoTask = task.poster_id === "demo" || 
                           task.poster_id?.startsWith("sample-") ||
                           task.title?.toLowerCase().includes("[demo]") ||
                           task.title?.toLowerCase().includes("[sample]");
        return !isDemoTask;
      });
      setTasks(realTasks);
    }
    setLoading(false);
  };

  const getDifficulty = (skill: string | null): "Easy" | "Medium" | "Hard" => {
    if (skill === "beginner") return "Easy";
    if (skill === "intermediate") return "Medium";
    if (skill === "advanced") return "Hard";
    return "Medium";
  };
  
  const filteredTasks = tasks.filter(task => {
    // Filter out expired tasks (deadline has passed)
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      if (deadlineDate.getTime() < Date.now()) {
        return false; // Exclude expired tasks
      }
    }
    
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const difficulty = getDifficulty(task.skill);
    const matchesDifficulty = filterDifficulty === "all" || difficulty === filterDifficulty;
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "payout-high") return b.payout - a.payout;
    if (sortBy === "payout-low") return a.payout - b.payout;
    if (sortBy === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  
  const clearFilters = () => {
    setSearchQuery("");
    setFilterDifficulty("all");
    setFilterCategory("all");
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Student Marketplace</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Find Your Next <span className="text-primary">Hustle</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse micro-tasks posted by fellow students. Apply, deliver quality work, and earn real money.
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.05 }}
          >
            <CategoryFilter
              selectedCategory={filterCategory}
              onCategoryChange={setFilterCategory}
            />
          </motion.div>
          
          {/* Search & Filters */}
          <motion.div 
            className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.08 }}
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 bg-background"
                />
              </div>
              
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="h-11 w-full md:w-36 bg-background">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 w-full md:w-40 bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Most Recent</SelectItem>
                  <SelectItem value="payout-high">Highest Payout</SelectItem>
                  <SelectItem value="payout-low">Lowest Payout</SelectItem>
                  <SelectItem value="deadline">Deadline Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{sortedTasks.length}</span> task{sortedTasks.length !== 1 ? 's' : ''} available
              </p>
              {(searchQuery || filterDifficulty !== "all" || filterCategory !== "all") && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
          
          {/* Task Grid */}
          <TaskGrid
            tasks={sortedTasks.map(task => ({
              ...task,
              description: task.description || undefined,
              deadline: task.deadline,
              category: task.category || undefined,
              difficulty: getDifficulty(task.skill),
              time_required: task.time_required || "Flexible",
              status: task.status || "open",
              application_count: task.application_count || 0,
              attachment_url: (task as any).attachment_url || null,
            }))}
            loading={loading}
            emptyMessage="No tasks match your criteria"
            onClearFilters={clearFilters}
            onUpdate={fetchTasks}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default Marketplace;
