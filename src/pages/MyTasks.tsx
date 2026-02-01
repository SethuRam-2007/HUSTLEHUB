import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProofSubmission from "@/components/ProofSubmission";

/* ================= TYPES ================= */

interface Task {
  id: string;
  title: string;
  description: string;
  payout: number;
  deadline: string | null;
  status: string;
  poster_id: string;
  assignee_id: string | null;
  proof_submitted_at: string | null;
  created_at: string;
}

interface Application {
  id: string;
  task_id: string;
  status: string;
  created_at: string;
  task: {
    id: string;
    title: string;
    payout: number;
    status: string;
  } | null;
}

/* ================= COMPONENT ================= */

const MyTasks = () => {
  const { user } = useAuth();

  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingTask, setApprovingTask] = useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const [postedRes, acceptedRes, applicationsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("poster_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select("*")
          .eq("assignee_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("task_applications")
          .select("id, task_id, status, created_at")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setPostedTasks(postedRes.data || []);
      setAcceptedTasks(acceptedRes.data || []);

      if (applicationsRes.data?.length) {
        const taskIds = applicationsRes.data.map((a) => a.task_id);

        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, payout, status")
          .in("id", taskIds);

        setMyApplications(
          applicationsRes.data.map((a) => ({
            ...a,
            task: tasks?.find((t) => t.id === a.task_id) || null,
          }))
        );
      } else {
        setMyApplications([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your tasks");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  /* ================= HELPERS ================= */

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "No deadline";
    const d = new Date(deadline);
    return isNaN(d.getTime()) ? "No deadline" : d.toLocaleDateString();
  };

  const approveTask = async (task: Task) => {
    if (!user || !task.assignee_id) return;

    setApprovingTask(task.id);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task.id)
        .eq("poster_id", user.id)
        .eq("status", "in_progress");

      if (error) throw error;

      toast.success("Task approved successfully");
      fetchTasks();
    } catch {
      toast.error("Failed to approve task");
    }

    setApprovingTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  const pendingApplications = myApplications.filter(
    (a) => a.status === "pending"
  );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

        <Tabs defaultValue="posted">
          <TabsList>
            <TabsTrigger value="posted">
              Tasks I Posted ({postedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              I'm Working On ({acceptedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="applications">
              My Applications ({pendingApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* POSTED */}
          <TabsContent value="posted" className="space-y-4">
            {postedTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>

                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {task.payout}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDeadline(task.deadline)}
                    </span>
                  </div>

                  {task.status === "in_progress" &&
                    task.proof_submitted_at && (
                      <Button
                        onClick={() => approveTask(task)}
                        disabled={approvingTask === task.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ACCEPTED */}
          <TabsContent value="accepted" className="space-y-4">
            {acceptedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="space-y-3">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm">
                    Deadline: {formatDeadline(task.deadline)}
                  </p>

                  {task.status === "in_progress" &&
                    !task.proof_submitted_at && (
                      <ProofSubmission
                        taskId={task.id}
                        onProofSubmitted={fetchTasks}
                      />
                    )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* APPLICATIONS */}
          <TabsContent value="applications" className="space-y-4">
            {pendingApplications.map((a) => (
              <Card key={a.id}>
                <CardContent>
                  <h3 className="font-medium">{a.task?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Applied on{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyTasks;
