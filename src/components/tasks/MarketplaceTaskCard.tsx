import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Clock,
  IndianRupee,
  Loader2,
  CheckCircle,
  FileText,
  ExternalLink,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MarketplaceTaskCardProps {
  id: string;
  title: string;
  description?: string;
  payout: number;
  deadline?: string | null;
  category?: string;
  difficulty?: string;
  timeRequired?: string;
  status: string;
  posterId: string;
  assigneeId?: string | null;
  applicationCount?: number;
  attachmentUrl?: string | null;
  index?: number;
  onUpdate?: () => void;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  ppt: { label: 'PPT', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' },
  coding: { label: 'Coding', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  design: { label: 'Design', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300' },
  writing: { label: 'Writing', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
  video: { label: 'Video', color: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
  data_entry: { label: 'Data Entry', color: 'bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300' },
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  Easy: { label: 'Easy', color: 'text-emerald-600 dark:text-emerald-400' },
  Medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  Hard: { label: 'Hard', color: 'text-rose-600 dark:text-rose-400' },
};

export const MarketplaceTaskCard = ({
  id,
  title,
  description,
  payout,
  deadline,
  category = 'general',
  difficulty = 'Medium',
  timeRequired,
  status,
  posterId,
  assigneeId,
  applicationCount = 0,
  attachmentUrl,
  onUpdate,
}: MarketplaceTaskCardProps) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [coverNote, setCoverNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle tap to toggle on mobile
  const handleCardTap = (e: React.MouseEvent) => {
    // Don't toggle if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setIsExpanded((prev) => !prev);
  };

  const isOwner = user?.id === posterId;
  const isAssignee = user?.id === assigneeId;
  const categoryInfo = categoryConfig[category] || categoryConfig.general;
  const difficultyInfo = difficultyConfig[difficulty] || difficultyConfig.Medium;

  // Check deadline
  const isDeadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;
  const isTaskOpen = status === 'open' || status === 'applications_received';
  const canApply = !!user && !isOwner && !isAssignee && !assigneeId && isTaskOpen && !isDeadlinePassed;

  useEffect(() => {
    checkExistingApplication();
  }, [user, id]);

  const checkExistingApplication = async () => {
    if (!user) {
      setCheckingApplication(false);
      return;
    }

    const { data } = await supabase
      .from('task_applications')
      .select('id, status')
      .eq('task_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle();

    if (data) {
      setExistingApplication(data);
    }
    setCheckingApplication(false);
  };

  const formatDeadline = (dl: string | null | undefined) => {
    if (!dl) return null;
    const date = new Date(dl);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
    if (diffDays <= 3) return { text: `${diffDays} days left`, urgent: true };
    if (diffDays <= 7) return { text: `${diffDays} days left`, urgent: false };
    return { text: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), urgent: false };
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please log in to apply for tasks');
      return;
    }

    setLoading(true);

    try {
      // Ensure we have a valid session (prevents silent RLS failures when token expires)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Your session expired. Please log in again.');
        return;
      }

      const insertOnce = async () => {
        return supabase.from('task_applications').insert({
          task_id: id,
          applicant_id: user.id,
          cover_note: coverNote || null,
          status: 'pending',
        });
      };

      let { error } = await insertOnce();

      // If token expired mid-flight, refresh once and retry
      const msgLower = error?.message?.toLowerCase?.() || '';
      const status = (error as any)?.status;
      if (error && (status === 401 || msgLower.includes('jwt') || msgLower.includes('token'))) {
        await supabase.auth.refreshSession();
        const retry = await insertOnce();
        error = retry.error;
      }

      if (error) throw error;

      // Notify poster (best-effort)
      await supabase.rpc('create_notification', {
        p_user_id: posterId,
        p_title: 'New Application',
        p_message: `Someone applied for your task: ${title}`,
        p_type: 'task_application',
        p_task_id: id,
      });

      toast.success('Applied successfully! Waiting for approval.');
      setDialogOpen(false);
      setCoverNote('');
      setExistingApplication({ status: 'pending' });
      onUpdate?.();
    } catch (error: any) {
      console.error('Application error:', error);

      const code = error?.code;
      const msg = (error?.message || '').toString().toLowerCase();
      const httpStatus = error?.status;

      if (code === '23505' || msg.includes('duplicate')) {
        toast.error("You've already applied for this task");
        setExistingApplication({ status: 'pending' });
      } else if (httpStatus === 401 || msg.includes('jwt') || msg.includes('token')) {
        toast.error('Your session expired. Please log in again.');
      } else if (httpStatus === 403 || code === '42501' || msg.includes('row-level security') || msg.includes('policy')) {
        toast.error('You do not have permission to apply right now. Please log in again.');
      } else if (code === '23514' || msg.includes('constraint') || msg.includes('check')) {
        toast.error('This task is no longer accepting applications');
      } else if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout') || msg.includes('failed to fetch')) {
        toast.error('Connection issue. Please check your internet.');
      } else {
        const supportCode = code || httpStatus || 'unknown';
        toast.error(`Something went wrong. Please try again. (code: ${supportCode})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const deadlineInfo = formatDeadline(deadline);

  // Handle document link
  const handleViewDocument = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attachmentUrl) return;
    window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
  };

  // Render action button - clean, simple states
  const renderActionButton = () => {
    if (checkingApplication) {
      return (
        <Button disabled className="w-full h-10" variant="secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      );
    }

    if (!user) {
      return (
        <Link to="/auth" onClick={(e) => e.stopPropagation()} className="block">
          <Button className="w-full h-10" variant="default">
            Log in to apply
          </Button>
        </Link>
      );
    }

    if (isOwner) {
      return (
        <Button variant="outline" className="w-full h-10" disabled>
          Your task
        </Button>
      );
    }

    if (assigneeId && !isAssignee) {
      return (
        <Button variant="outline" className="w-full h-10" disabled>
          Already assigned
        </Button>
      );
    }

    if (isAssignee) {
      return (
        <Button className="w-full h-10" variant="secondary">
          <CheckCircle className="w-4 h-4 mr-2" />
          You're selected
        </Button>
      );
    }

    if (existingApplication) {
      return (
        <Button disabled className="w-full h-10" variant="secondary">
          <CheckCircle className="w-4 h-4 mr-2" />
          Applied
        </Button>
      );
    }

    if (!canApply) {
      return (
        <Button variant="outline" className="w-full h-10" disabled>
          Closed
        </Button>
      );
    }

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-10">
            Apply
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Apply for this task</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Cover note (optional)
              </label>
              <Textarea
                placeholder="Why are you a good fit for this task?"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
            </div>

            <Button
              onClick={handleApply}
              disabled={loading}
              className="w-full h-10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card 
      className="group relative bg-card border border-border hover:border-border/80 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={handleCardTap}
    >
      {/* Collapsed view - Basic info */}
      <div className={cn(
        "p-5 transition-all duration-300",
        isExpanded && "hidden"
      )}>
        {/* Header: Category and Difficulty */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="secondary"
            className={cn('text-xs font-normal', categoryInfo.color)}
          >
            {categoryInfo.label}
          </Badge>
          <span className={cn('text-xs font-medium', difficultyInfo.color)}>
            {difficultyInfo.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-medium text-foreground leading-relaxed line-clamp-2 mb-3">
          {title}
        </h3>

        {/* Payout and deadline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-foreground font-medium">
            <IndianRupee className="w-4 h-4" />
            <span>{payout.toLocaleString('en-IN')}</span>
          </div>
          {deadlineInfo && (
            <div className={cn(
              'flex items-center gap-1.5 text-muted-foreground',
              deadlineInfo.urgent && 'text-amber-600 dark:text-amber-400'
            )}>
              <Clock className="w-3.5 h-3.5" />
              <span>{deadlineInfo.text}</span>
            </div>
          )}
        </div>

        {/* Tap to expand hint */}
        <p className="text-xs text-muted-foreground/60 mt-3 text-center">
          Tap to view details
        </p>
      </div>

      {/* Expanded view - Full details */}
      <div className={cn(
        "p-5 transition-all duration-300",
        !isExpanded && "hidden"
      )}>
        {/* Header: Category and Difficulty */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="secondary"
            className={cn('text-xs font-normal', categoryInfo.color)}
          >
            {categoryInfo.label}
          </Badge>
          <span className={cn('text-xs font-medium', difficultyInfo.color)}>
            {difficultyInfo.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-medium text-foreground leading-relaxed mb-3">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Payout */}
        <div className="flex items-center gap-1 text-foreground font-medium mb-3">
          <IndianRupee className="w-4 h-4" />
          <span className="text-lg">{payout.toLocaleString('en-IN')}</span>
        </div>

        {/* Meta info */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          {deadlineInfo && (
            <div className={cn(
              'flex items-center gap-1.5',
              deadlineInfo.urgent && 'text-amber-600 dark:text-amber-400'
            )}>
              <Clock className="w-3.5 h-3.5" />
              <span>{deadlineInfo.text}</span>
            </div>
          )}
          {applicationCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{applicationCount} applied</span>
            </div>
          )}
        </div>

        {/* Document link */}
        {attachmentUrl && (
          <button
            onClick={handleViewDocument}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-4 w-fit"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View document</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Action Button */}
        <div className="mt-2">
          {renderActionButton()}
        </div>

        {/* Tap to collapse hint */}
        <p className="text-xs text-muted-foreground/60 mt-3 text-center">
          Tap to collapse
        </p>
      </div>
    </Card>
  );
};

export default MarketplaceTaskCard;
