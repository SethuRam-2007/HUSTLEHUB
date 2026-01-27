import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { TextScramble } from '@/components/ui/text-scramble';
import {
  Clock,
  IndianRupee,
  Send,
  MessageCircle,
  Loader2,
  ArrowRight,
  Briefcase,
  Check,
  X,
  Timer,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FlippingTaskCardProps {
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
  index?: number;
  onUpdate?: () => void;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  ppt: { label: 'PPT', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  coding: { label: 'Coding', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  design: { label: 'Design', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  writing: { label: 'Writing', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  video: { label: 'Video', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  data_entry: { label: 'Data Entry', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  general: { label: 'General', color: 'bg-muted text-muted-foreground border-border' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  hard: { label: 'Hard', color: 'text-rose-600 dark:text-rose-400' },
};

export const FlippingTaskCard = ({
  id,
  title,
  description,
  payout,
  deadline,
  category = 'general',
  difficulty = 'medium',
  timeRequired,
  status,
  posterId,
  assigneeId,
  applicationCount = 0,
  index = 0,
  onUpdate,
}: FlippingTaskCardProps) => {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [coverNote, setCoverNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animateCta, setAnimateCta] = useState(true);

  const isOwner = user?.id === posterId;
  const isAssignee = user?.id === assigneeId;
  const categoryInfo = categoryConfig[category] || categoryConfig.general;
  const difficultyInfo = difficultyConfig[difficulty?.toLowerCase()] || difficultyConfig.medium;

  // FIX: Proper deadline logic - check if deadline has ACTUALLY passed
  const now = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;
  const isDeadlinePassed = deadlineDate ? deadlineDate.getTime() < now.getTime() : false;
  
  // Task is open for applications only if:
  // 1. Status is 'open' or 'applications_received'
  // 2. Deadline has not passed (or no deadline set)
  // 3. Task is not assigned to anyone
  const isTaskOpen = (status === 'open' || status === 'applications_received') && !assigneeId;
  const canApply = !!user && !isOwner && !isAssignee && isTaskOpen && !isDeadlinePassed;

  useEffect(() => {
    checkExistingApplication();
  }, [user, id]);

  // Stop CTA animation after first render
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCta(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const checkExistingApplication = async () => {
    if (!user) {
      setCheckingApplication(false);
      return;
    }

    const { data } = await supabase
      .from('task_applications')
      .select('*')
      .eq('task_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle();

    if (data) {
      setExistingApplication(data);
    }
    setCheckingApplication(false);
  };

  const formatDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', urgent: true };
    if (diffDays === 0) return { text: 'Today', urgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', urgent: true };
    if (diffDays <= 3) return { text: `${diffDays}d left`, urgent: true };
    if (diffDays <= 7) return { text: `${diffDays}d left`, urgent: false };
    return { text: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), urgent: false };
  };

  const handleApply = async () => {
    if (!user) {
      toast.error('Please log in to apply for tasks');
      return;
    }

    setLoading(true);

    try {
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

      const msgLower = error?.message?.toLowerCase?.() || '';
      const status = (error as any)?.status;
      if (error && (status === 401 || msgLower.includes('jwt') || msgLower.includes('token'))) {
        await supabase.auth.refreshSession();
        const retry = await insertOnce();
        error = retry.error;
      }

      if (error) throw error;

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

  // Determine CTA text
  const getCtaText = () => {
    if (checkingApplication) return 'Loading...';
    if (isOwner) return 'Your Task';
    if (isAssignee) return 'Start Chat';
    if (existingApplication?.status === 'pending') return 'Applied';
    if (existingApplication?.status === 'rejected') return 'Not Selected';
    if (!canApply && isDeadlinePassed) return 'Deadline Passed';
    if (!canApply && !isTaskOpen) return 'Not Available';
    return 'Apply';
  };

  const ctaText = getCtaText();
  const isCtaDisabled = checkingApplication || isOwner || existingApplication || !canApply;
  const showChat = isAssignee;

  return (
    <GlowingEffect intensity="subtle" disabled={isOwner || isCtaDisabled}>
      <motion.div
        className="relative h-[220px] perspective-1000"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        onTouchStart={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT FACE - Minimal: Title + CTA only */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center text-center",
              "bg-card border border-border hover:border-primary/30 transition-colors duration-200"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Premium accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            {/* Title - centered, prominent */}
            <h3 className="text-lg font-semibold text-foreground line-clamp-3 leading-tight mb-6 px-2">
              {title}
            </h3>

            {/* Primary CTA */}
            {showChat ? (
              <Button size="lg" className="min-w-[140px]">
                <MessageCircle className="w-4 h-4 mr-2" />
                {animateCta ? (
                  <TextScramble text="Start Chat" duration={1000} />
                ) : (
                  'Start Chat'
                )}
              </Button>
            ) : !user ? (
              <Link to="/auth" className="block">
                <Button size="lg" className="min-w-[140px]">
                  Log in to apply
                </Button>
              </Link>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild disabled={isCtaDisabled}>
                  <Button
                    size="lg"
                    className="min-w-[140px]"
                    variant={existingApplication ? 'secondary' : 'default'}
                    disabled={isCtaDisabled}
                  >
                    {checkingApplication ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : existingApplication?.status === 'pending' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Applied
                      </>
                    ) : existingApplication?.status === 'rejected' ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Not Selected
                      </>
                    ) : !canApply ? (
                      <>
                        <Timer className="w-4 h-4 mr-2" />
                        {isDeadlinePassed ? 'Ended' : 'Closed'}
                      </>
                    ) : animateCta ? (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        <TextScramble text="Apply" duration={1000} />
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Apply
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply for Task</DialogTitle>
                    <DialogDescription>
                      Submit your application for "{title}". The poster will review and select a worker.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Cover Note (Optional)
                      </label>
                      <Textarea
                        placeholder="Why are you a good fit? Mention relevant experience..."
                        value={coverNote}
                        onChange={(e) => setCoverNote(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleApply}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
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
            )}

            {/* Hover hint */}
            <p className="absolute bottom-3 left-0 right-0 text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Hover for details
            </p>
          </Card>

          {/* BACK FACE - Full Details */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden p-5 flex flex-col",
              "bg-card border border-border"
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Header: Category + Difficulty */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <Badge 
                variant="outline" 
                className={cn('text-xs font-medium border', categoryInfo.color)}
              >
                {categoryInfo.label}
              </Badge>
              <span className={cn('text-xs font-medium', difficultyInfo.color)}>
                {difficultyInfo.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-shrink-0">
              {description || 'No description provided'}
            </p>

            {/* Budget - prominent */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
              <span className="text-xs text-muted-foreground">Budget</span>
              <div className="flex items-center text-lg font-bold text-foreground">
                <IndianRupee className="w-4 h-4" />
                <span>{payout.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Meta: Deadline + Time */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
              {deadlineInfo && (
                <div className={cn(
                  'flex items-center gap-1',
                  deadlineInfo.urgent && 'text-amber-600 dark:text-amber-400'
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs">{deadlineInfo.text}</span>
                </div>
              )}
              {timeRequired && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-xs">{timeRequired}</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </GlowingEffect>
  );
};

export default FlippingTaskCard;