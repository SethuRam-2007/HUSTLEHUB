import React, { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import TaskGrid from "@/components/tasks/TaskGrid";
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
  poster_id: string;
  assignee_id: string | null;
  category: string | null;
  application_count: number | null;
  status: string | null;
  attachment_url?: string | null;
  created_at: string | null;
}

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .in("status", ["open", "applications_received"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } else {
      setTasks(data ?? []);
    }

    setLoading(false);
  };

  const getDifficulty = (skill: string | null) => {
    if (skill === "beginner") return "Easy";
    if (skill === "intermediate") return "Medium";
    if (skill === "advanced") return "Hard";
    return "Medium";
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesDifficulty =
        filterDifficulty === "all" || getDifficulty(task.skill) === filterDifficulty;

      const matchesCategory =
        filterCategory === "all" || task.category === filterCategory;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [tasks, searchQuery, filterDifficulty, filterCategory]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "payout-high") return b.payout - a.payout;
      if (sortBy === "payout-low") return a.payout - b.payout;
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [filteredTasks, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterDifficulty("all");
    setFilterCategory("all");
  };

  const handleApply = async (taskId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to apply",
        variant: "destructive",
      });
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.assignee_id) {
      toast({
        title: "Cannot apply",
        description: "Task already assigned",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        assignee_id: user.id,
        status: "applications_received",
        application_count: (task.application_count ?? 0) + 1,
      })
      .eq("id", taskId)
      .single();

    if (error) {
      toast({ title: "Apply failed", variant: "destructive" });
    } else {
      toast({ title: "Applied successfully ✅" });
      fetchTasks();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Marketplace</h1>

        <TaskGrid
          tasks={sortedTasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description ?? undefined,
            payout: task.payout,
            deadline: task.deadline,
            category: task.category ?? undefined,
            difficulty: getDifficulty(task.skill),
            time_required: "Flexible",
            status: task.status ?? "open",
            posterId: task.poster_id,
            assigneeId: task.assignee_id,
            applicationCount: task.application_count ?? 0,
            attachmentUrl: task.attachment_url ?? undefined,
          }))}
          loading={loading}
          emptyMessage={loading ? "Loading tasks..." : "No tasks found"}
          onApply={handleApply}
          onUpdate={fetchTasks}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
};

export default Marketplace;
