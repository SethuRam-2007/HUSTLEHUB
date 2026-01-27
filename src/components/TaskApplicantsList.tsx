import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Star, 
  CheckCircle, 
  Loader2, 
  User, 
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Applicant {
  id: string;
  applicant_id: string;
  created_at: string;
  status: string;
  cover_note: string | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    average_rating: number | null;
    tasks_completed: number | null;
    skills: string[] | null;
  } | null;
}

interface TaskApplicantsListProps {
  taskId: string;
  taskTitle: string;
  taskPayout: number;
  taskStatus: string;
  onWorkerSelected?: () => void;
}

const TaskApplicantsList = ({
  taskId,
  taskTitle,
  taskPayout,
  taskStatus,
  onWorkerSelected,
}: TaskApplicantsListProps) => {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicants();
  }, [taskId]);

  const fetchApplicants = async () => {
    const { data, error } = await supabase
      .from('task_applications')
      .select(`
        id,
        applicant_id,
        created_at,
        status,
        cover_note
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching applicants:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for applicants
    if (data && data.length > 0) {
      const applicantIds = data.map(a => a.applicant_id);
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, average_rating, tasks_completed, skills')
        .in('id', applicantIds);

      const applicantsWithProfiles = data.map(app => ({
        ...app,
        profile: profiles?.find(p => p.id === app.applicant_id) || null,
      }));

      setApplicants(applicantsWithProfiles);
    } else {
      setApplicants([]);
    }

    setLoading(false);
  };

  const handleSelectWorker = async (applicantId: string, applicantName: string) => {
    if (!user) return;

    setSelectingId(applicantId);

    try {
      // Update task with selected worker (atomic update prevents race conditions)
      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .update({
          assignee_id: applicantId,
          status: 'in_progress',
        })
        .eq('id', taskId)
        .eq('poster_id', user.id)
        .in('status', ['open', 'applications_received'])
        .is('assignee_id', null)
        .select('id')
        .maybeSingle();

      if (taskError) throw taskError;

      if (!updatedTask) {
        toast.error('This task was already assigned or is no longer available');
        return;
      }

      // Update application status
      await supabase
        .from('task_applications')
        .update({ status: 'selected' })
        .eq('task_id', taskId)
        .eq('applicant_id', applicantId);

      // Mark other applications as not selected
      await supabase
        .from('task_applications')
        .update({ status: 'not_selected' })
        .eq('task_id', taskId)
        .neq('applicant_id', applicantId);

      // Notify selected worker
      await supabase.rpc('create_notification', {
        p_user_id: applicantId,
        p_title: 'You\'ve been selected!',
        p_message: `You were selected to work on: ${taskTitle}. Start working now!`,
        p_type: 'task_selected',
        p_task_id: taskId,
      });

      toast.success(`${applicantName} has been selected for this task!`);
      onWorkerSelected?.();
    } catch (error: any) {
      console.error('Error selecting worker:', error);
      toast.error(error.message || 'Failed to select worker');
    }

    setSelectingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No applications yet</p>
        <p className="text-sm">Workers will appear here once they apply</p>
      </div>
    );
  }

  const canSelectWorker = taskStatus === 'open' || taskStatus === 'applications_received';

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Briefcase className="w-4 h-4" />
        Applicants ({applicants.length})
      </h4>
      
      {applicants.map((applicant) => (
        <Card key={applicant.id} className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={applicant.profile?.avatar_url || ''} />
              <AvatarFallback>
                {applicant.profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/profile/${applicant.applicant_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {applicant.profile?.full_name || 'Unknown User'}
                </Link>
                {applicant.status === 'selected' && (
                  <Badge className="bg-secondary">Selected</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {(applicant.profile?.average_rating || 0).toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {applicant.profile?.tasks_completed || 0} completed
                </span>
              </div>

              {applicant.profile?.skills && applicant.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {applicant.profile.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {applicant.cover_note && (
                <div className="bg-muted p-2 rounded text-sm mt-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {applicant.cover_note}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Applied {new Date(applicant.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex-shrink-0">
              {canSelectWorker && applicant.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleSelectWorker(
                    applicant.applicant_id,
                    applicant.profile?.full_name || 'this worker'
                  )}
                  disabled={selectingId !== null}
                >
                  {selectingId === applicant.applicant_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Select Worker
                    </>
                  )}
                </Button>
              )}
              {applicant.status === 'selected' && (
                <Badge className="bg-secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Working
                </Badge>
              )}
              {applicant.status === 'not_selected' && (
                <span className="text-sm text-muted-foreground">
                  Not selected
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TaskApplicantsList;
