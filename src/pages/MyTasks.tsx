import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, Clock, User, AlertTriangle, CheckCircle, Users, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import ProofSubmission from "@/components/ProofSubmission";
import TaskRating from "@/components/TaskRating";
import DisputeDialog from "@/components/DisputeDialog";
import TaskApplicantsList from "@/components/TaskApplicantsList";
import TaskChatButton from "@/components/TaskChatButton";
import TaskEditDialog from "@/components/TaskEditDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Task {
  id: string;
  title: string;
  description: string;
  payout: number;
  deadline: string;
  status: string;
  poster_id: string;
  assignee_id: string | null;
  proof_text: string | null;
  proof_file_url: string | null;
  proof_submitted_at: string | null;
  is_rated: boolean;
  created_at: string;
  dispute_status: string | null;
  application_count: number | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
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
    poster_id: string;
  } | null;
}

const MyTasks = () => {
  const { user } = useAuth();
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [expandedApplicants, setExpandedApplicants] = useState<string | null>(null);
  const [approvingTask, setApprovingTask] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) return;

    const [postedRes, acceptedRes, applicationsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("poster_id", user.id).order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").eq("assignee_id", user.id).order("created_at", { ascending: false }),
      supabase.from("task_applications").select(`
        id,
        task_id,
        status,
        created_at
      `).eq("applicant_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (postedRes.data) setPostedTasks(postedRes.data);
    if (acceptedRes.data) setAcceptedTasks(acceptedRes.data);
    
    // Fetch task details for applications
    if (applicationsRes.data && applicationsRes.data.length > 0) {
      const taskIds = applicationsRes.data.map(a => a.task_id);
      const { data: taskData } = await supabase
        .from("tasks")
        .select("id, title, payout, status, poster_id")
        .in("id", taskIds);
      
      const applicationsWithTasks = applicationsRes.data.map(app => ({
        ...app,
        task: taskData?.find(t => t.id === app.task_id) || null,
      }));
      setMyApplications(applicationsWithTasks);
    } else {
      setMyApplications([]);
    }

    // Fetch profiles for workers and posters
    const userIds = new Set<string>();
    postedRes.data?.forEach((t) => t.assignee_id && userIds.add(t.assignee_id));
    acceptedRes.data?.forEach((t) => userIds.add(t.poster_id));

    if (userIds.size > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));

      if (profilesData) {
        const profileMap: Record<string, Profile> = {};
        profilesData.forEach((p) => (profileMap[p.id] = p));
        setProfiles(profileMap);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const getStatusBadge = (status: string, disputeStatus?: string | null) => {
    if (disputeStatus === 'open') {
      return <Badge variant="destructive">Disputed</Badge>;
    }
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "outline",
      applications_received: "secondary",
      in_progress: "secondary",
      completed: "default",
      expired: "destructive",
    };
    const labels: Record<string, string> = {
      open: "Open",
      applications_received: "Reviewing Applications",
      in_progress: "In Progress",
      completed: "Completed",
      expired: "Expired",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const handleProofSubmitted = () => {
    fetchTasks();
    toast.success("Proof submitted successfully!");
  };

  const handleRatingSubmitted = () => {
    fetchTasks();
    toast.success("Rating submitted!");
  };

  const handleDisputeRaised = () => {
    fetchTasks();
  };

  const handleWorkerSelected = () => {
    fetchTasks();
  };

  const handleApproveTask = async (task: Task) => {
    if (!user || !task.assignee_id) return;

    setApprovingTask(task.id);

    try {
      // Update task status to completed (atomic update prevents double-approval)
      const { data: updatedTask, error: taskError } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task.id)
        .eq("poster_id", user.id)
        .eq("status", "in_progress")
        .not("proof_submitted_at", "is", null)
        .select("id")
        .maybeSingle();

      if (taskError) throw taskError;

      if (!updatedTask) {
        toast.error("Task status changed or proof was not submitted yet.");
        return;
      }

      // Get worker's current profile
      const { data: workerProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("balance, total_earned, tasks_completed")
        .eq("id", task.assignee_id)
        .single();

      if (profileFetchError) throw profileFetchError;

      // Update worker's balance
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          balance: Number(workerProfile.balance || 0) + task.payout,
          total_earned: Number(workerProfile.total_earned || 0) + task.payout,
          tasks_completed: Number(workerProfile.tasks_completed || 0) + 1,
        })
        .eq("id", task.assignee_id);

      if (profileError) throw profileError;

      // Create transaction for worker
      await supabase.from("transactions").insert({
        user_id: task.assignee_id,
        task_id: task.id,
        type: "earning",
        amount: task.payout,
        description: `Completed: ${task.title}`,
        status: "completed",
      });

      // Notify worker
      await supabase.rpc('create_notification', {
        p_user_id: task.assignee_id,
        p_title: 'Task Approved!',
        p_message: `Your work on "${task.title}" has been approved. ₹${task.payout} added to your wallet.`,
        p_type: 'payment_released',
        p_task_id: task.id
      });

      toast.success("Task approved! Payment released to worker.");
      fetchTasks();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    }

    setApprovingTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter applications that haven't been selected yet (pending status)
  const pendingApplications = myApplications.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

        <Tabs defaultValue="posted" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posted">Tasks I Posted ({postedTasks.length})</TabsTrigger>
            <TabsTrigger value="accepted">Tasks I'm Working On ({acceptedTasks.length})</TabsTrigger>
            <TabsTrigger value="applications">
              My Applications ({pendingApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posted" className="space-y-4">
            {postedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  You haven't posted any tasks yet.
                </CardContent>
              </Card>
            ) : (
              postedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <div className="flex gap-2">
                        {getStatusBadge(task.status, task.dispute_status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {task.payout}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(task.deadline).toLocaleDateString()}
                        {new Date(task.deadline).getTime() < Date.now() && (
                          <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                        )}
                      </span>
                      {(task.status === 'open' || task.status === 'applications_received') && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {task.application_count || 0} applicants
                        </span>
                      )}
                    </div>

                    {/* Edit button for open tasks */}
                    {(task.status === 'open' || task.status === 'applications_received') && (
                      <TaskEditDialog
                        task={{
                          id: task.id,
                          title: task.title,
                          description: task.description,
                          payout: task.payout,
                          deadline: task.deadline,
                        }}
                        onTaskUpdated={fetchTasks}
                      />
                    )}

                    {/* Show applicants for tasks awaiting selection */}
                    {(task.status === 'open' || task.status === 'applications_received') && (
                      <Collapsible
                        open={expandedApplicants === task.id}
                        onOpenChange={(open) => setExpandedApplicants(open ? task.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Users className="h-4 w-4 mr-2" />
                            {expandedApplicants === task.id ? 'Hide Applicants' : 'View Applicants'}
                            {(task.application_count || 0) > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {task.application_count}
                              </Badge>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <TaskApplicantsList
                            taskId={task.id}
                            taskTitle={task.title}
                            taskPayout={task.payout}
                            taskStatus={task.status}
                            onWorkerSelected={handleWorkerSelected}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {task.assignee_id && profiles[task.assignee_id] && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <User className="h-4 w-4" />
                        <span>Worker: </span>
                        <Link
                          to={`/profile/${task.assignee_id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {profiles[task.assignee_id].full_name || profiles[task.assignee_id].email}
                        </Link>
                      </div>
                    )}

                    {task.proof_submitted_at && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Submitted Proof:</p>
                        {task.proof_text && <p className="text-sm">{task.proof_text}</p>}
                        {task.proof_file_url && (
                          <a
                            href={task.proof_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View attached file
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(task.proof_submitted_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Approve button for tasks with proof submitted but not yet completed */}
                    {task.status === "in_progress" && task.proof_submitted_at && !task.dispute_status && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveTask(task)}
                          disabled={approvingTask === task.id}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {approvingTask === task.id ? "Approving..." : "Approve & Release Payment"}
                        </Button>
                        <DisputeDialog
                          taskId={task.id}
                          taskTitle={task.title}
                          onDisputeRaised={handleDisputeRaised}
                        />
                      </div>
                    )}

                    {task.status === "completed" && !task.is_rated && task.assignee_id && (
                      <TaskRating
                        taskId={task.id}
                        workerId={task.assignee_id}
                        onRatingSubmitted={handleRatingSubmitted}
                      />
                    )}

                    {task.is_rated && (
                      <Badge variant="secondary">Worker rated</Badge>
                    )}

                    {task.dispute_status === 'open' && (
                      <div className="p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          This task is under dispute. Our team is reviewing it.
                        </span>
                      </div>
                    )}

                    {/* Chat Button - Prominent CTA after worker selection */}
                    <div className="pt-2 border-t">
                      <TaskChatButton
                        taskId={task.id}
                        taskTitle={task.title}
                        taskStatus={task.status}
                        isApproved={!!task.assignee_id}
                        variant="prominent"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  You're not working on any tasks yet.
                </CardContent>
              </Card>
            ) : (
              acceptedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <div className="flex gap-2">
                        {getStatusBadge(task.status, task.dispute_status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <IndianRupee className="h-4 w-4" />
                        {task.payout} {task.status === 'completed' ? 'earned' : 'potential'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <User className="h-4 w-4" />
                      <span>Posted by: </span>
                      <Link
                        to={`/profile/${task.poster_id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {profiles[task.poster_id]?.full_name || profiles[task.poster_id]?.email || "Unknown"}
                      </Link>
                    </div>

                    {task.status === "in_progress" && !task.proof_submitted_at && (
                      <ProofSubmission taskId={task.id} onProofSubmitted={handleProofSubmitted} />
                    )}

                    {task.proof_submitted_at && task.status !== 'completed' && (
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <p className="text-sm text-accent-foreground">
                          ⏳ Proof submitted on {new Date(task.proof_submitted_at).toLocaleString()}. Waiting for approval.
                        </p>
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✅ Task completed! ₹{task.payout} earned.
                        </p>
                      </div>
                    )}

                    {task.dispute_status === 'open' && (
                      <div className="p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          This task is under dispute.
                        </span>
                      </div>
                    )}

                    {/* Allow worker to raise dispute if payment not released */}
                    {task.status === "in_progress" && task.proof_submitted_at && !task.dispute_status && (
                      <div className="flex justify-end">
                        <DisputeDialog
                          taskId={task.id}
                          taskTitle={task.title}
                          onDisputeRaised={handleDisputeRaised}
                        />
                      </div>
                    )}

                    {/* Chat Button - Prominent CTA for approved workers */}
                    <div className="pt-2 border-t">
                      <TaskChatButton
                        taskId={task.id}
                        taskTitle={task.title}
                        taskStatus={task.status}
                        isApproved={true}
                        variant="prominent"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  You don't have any pending applications.
                  <p className="text-sm mt-2">
                    Browse the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link> to find tasks to apply for.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingApplications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{application.task?.title || 'Task'}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 font-medium text-primary">
                          <IndianRupee className="h-4 w-4" />
                          {application.task?.payout || 0}
                        </span>
                        <Badge variant="outline">Pending Selection</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyTasks;
