import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TaskApplicationButtonProps {
  taskId: string;
  taskTitle: string;
  posterId: string;
  taskStatus: string;
  assigneeId: string | null;
  deadline: string | null;
  onApplicationSubmitted?: () => void;
}

const TaskApplicationButton = ({
  taskId,
  taskTitle,
  posterId,
  taskStatus,
  assigneeId,
  deadline,
  onApplicationSubmitted,
}: TaskApplicationButtonProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [coverNote, setCoverNote] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkExistingApplication();
  }, [user, taskId]);

  const checkExistingApplication = async () => {
    if (!user) {
      setCheckingApplication(false);
      return;
    }

    const { data, error } = await supabase
      .from('task_applications')
      .select('*')
      .eq('task_id', taskId)
      .eq('applicant_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setExistingApplication(data);
    }
    setCheckingApplication(false);
  };

  // Map internal errors to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const errorCode = error?.code;
    const httpStatus = error?.status;
    const errorMessage = (error?.message || '').toString().toLowerCase();

    // Auth/session issues
    if (
      httpStatus === 401 ||
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('unauthorized')
    ) {
      return 'Your session expired. Please log in again.';
    }

    // Permission / RLS issues
    if (
      httpStatus === 403 ||
      errorCode === '42501' ||
      errorMessage.includes('row-level security') ||
      errorMessage.includes('policy') ||
      errorMessage.includes('permission denied')
    ) {
      return 'You do not have permission to apply for this task right now.';
    }

    // Duplicate application (unique constraint violation)
    if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
      return "You've already applied for this task";
    }

    // Check constraint violations
    if (errorCode === '23514' || errorMessage.includes('check') || errorMessage.includes('constraint')) {
      return 'This task is no longer accepting applications';
    }

    // Foreign key violations (task doesn't exist)
    if (errorCode === '23503' || errorMessage.includes('foreign key')) {
      return 'This task is no longer available';
    }

    // Network or connection errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('failed to fetch')
    ) {
      return 'Connection issue. Please check your internet and try again.';
    }

    // Default fallback (keep it generic, but include a support code for debugging)
    const supportCode = errorCode || httpStatus || 'unknown';
    return `Something went wrong. Please try again. (code: ${supportCode})`;
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please log in to apply for tasks');
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        toast.error('Your session expired. Please log in again.');
        return;
      }

      // If the access token is about to expire, refresh first to avoid flaky 401s.
      const expiresAtMs = (session.expires_at ?? 0) * 1000;
      if (expiresAtMs && expiresAtMs - Date.now() < 60_000) {
        await supabase.auth.refreshSession();
      }

      const insertOnce = async () => {
        return supabase.from('task_applications').insert({
          task_id: taskId,
          applicant_id: user.id,
          cover_note: coverNote || null,
          status: 'pending',
        });
      };

      let { error } = await insertOnce();

      const msgLower = error?.message?.toLowerCase?.() || '';
      const status = (error as any)?.status;
      if (error && (status === 401 || msgLower.includes('jwt') || msgLower.includes('token'))) {
        await supabase.auth.refreshSession();
        const retry = await insertOnce();
        error = retry.error;
      }

      if (error) throw error;

      // Notify task poster
      await supabase.rpc('create_notification', {
        p_user_id: posterId,
        p_title: 'New Application',
        p_message: `Someone applied for your task: ${taskTitle}`,
        p_type: 'task_application',
        p_task_id: taskId,
      });

      toast.success('Applied successfully. Waiting for approval.');
      setOpen(false);
      setCoverNote('');

      // Immediately update UI to show applied state
      setExistingApplication({ status: 'pending' });

      onApplicationSubmitted?.();
    } catch (error: any) {
      console.error('Application error:', error);
      
      const friendlyMessage = getErrorMessage(error);
      toast.error(friendlyMessage);

      if (error?.code === '23505') {
        setExistingApplication({ status: 'pending' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for task owner
  if (user?.id === posterId) {
    return null;
  }

  // Task is assigned to someone else
  if (assigneeId && assigneeId !== user?.id) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <XCircle className="w-4 h-4" />
        <span>Assigned to another worker</span>
      </div>
    );
  }

  // Current user is the assignee
  if (assigneeId === user?.id) {
    return (
      <div className="flex items-center gap-2 text-secondary text-sm py-2">
        <CheckCircle className="w-4 h-4" />
        <span>You've been selected for this task!</span>
      </div>
    );
  }

  // Check if deadline has passed (timezone-safe comparison)
  const isDeadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  if (isDeadlinePassed) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <XCircle className="w-4 h-4" />
        <span>Applications for this task have closed</span>
      </div>
    );
  }

  // Task is not open for applications
  if (taskStatus !== 'open' && taskStatus !== 'applications_received') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <XCircle className="w-4 h-4" />
        <span>This task is no longer accepting applications</span>
      </div>
    );
  }

  if (checkingApplication) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  // User has already applied - show disabled "Applied" state
  if (existingApplication) {
    const isPending = existingApplication.status === 'pending';
    const isRejected = existingApplication.status === 'rejected';
    
    return (
      <div className="space-y-2">
        <Button 
          disabled 
          className="w-full" 
          size="lg"
          variant={isPending ? "secondary" : "outline"}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isPending ? 'Waiting for Approval' : 'Applied'}
        </Button>
        {isPending && (
          <p className="text-xs text-muted-foreground text-center">
            The task poster will review your application
          </p>
        )}
        {isRejected && (
          <p className="text-xs text-muted-foreground text-center">
            This task is no longer available
          </p>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Send className="w-4 h-4 mr-2" />
          Apply for Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Task</DialogTitle>
          <DialogDescription>
            Submit your application for "{taskTitle}". The task poster will review your profile and select a worker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Cover Note (Optional)
            </label>
            <Textarea
              placeholder="Why are you a good fit for this task? Mention relevant experience or skills..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleApply} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskApplicationButton;
