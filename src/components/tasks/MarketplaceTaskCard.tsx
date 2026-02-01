import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Clock, IndianRupee, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MarketplaceTaskCardProps {
  id: string;
  title: string;
  description?: string;
  payout: number;
  deadline?: string | null;
  category?: string;
  difficulty?: string;
  status: string;
  posterId: string;
  assigneeId?: string | null;
  applicationCount?: number;
  attachmentUrl?: string | null;
  onUpdate?: () => void;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
  coding: { label: 'Coding', color: 'bg-blue-50 text-blue-700' },
  ppt: { label: 'PPT', color: 'bg-orange-50 text-orange-700' },
  design: { label: 'Design', color: 'bg-pink-50 text-pink-700' },
  writing: { label: 'Writing', color: 'bg-purple-50 text-purple-700' },
  video: { label: 'Video', color: 'bg-red-50 text-red-700' },
  data_entry: { label: 'Data Entry', color: 'bg-slate-50 text-slate-700' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  Easy: { label: 'Easy', color: 'text-emerald-600' },
  Medium: { label: 'Medium', color: 'text-amber-600' },
  Hard: { label: 'Hard', color: 'text-rose-600' },
};

const MarketplaceTaskCard: React.FC<MarketplaceTaskCardProps> = ({
  id,
  title,
  description,
  payout,
  deadline,
  category = 'general',
  difficulty = 'Medium',
  status,
  posterId,
  assigneeId,
  applicationCount = 0,
  attachmentUrl,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  const isOwner = user?.id === posterId;
  const isAssignee = user?.id === assigneeId;
  const isDeadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;
  const canApply =
  !isOwner &&
  !isAssignee &&
  !existingApplication &&
  status === 'open' &&
  !isDeadlinePassed;


  const categoryInfo = categoryConfig[category] || categoryConfig.general;
  const difficultyInfo = difficultyConfig[difficulty] || difficultyConfig.Medium;

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('task_applications')
        .select('id,status')
        .eq('task_id', id)
        .eq('applicant_id', user.id)
        .maybeSingle();
      if (data) setExistingApplication(data);
    };
    checkExisting();
  }, [user, id]);

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return toast.error('Login to apply');
    setLoading(true);
    try {
      const { error } = await supabase.from('task_applications').insert({
        task_id: id,
        applicant_id: user.id,
        cover_note: coverNote || null,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Applied successfully!');
      setExistingApplication({ status: 'pending' });
      setDialogOpen(false);
      setCoverNote('');
      onUpdate?.();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  const deadlineText = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <Card
      className="cursor-pointer hover:border-border/80 border border-border transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Badge className={cn('text-xs font-normal', categoryInfo.color)}>{categoryInfo.label}</Badge>
        <span className={cn('text-xs font-medium', difficultyInfo.color)}>{difficultyInfo.label}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-medium mb-2">{title}</h3>

      {/* Description */}
      {isExpanded && description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}

      {/* Payout & Deadline */}
      <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1 font-medium text-foreground">
          <IndianRupee className="w-4 h-4" />
          <span>{payout.toLocaleString('en-IN')}</span>
        </div>
        {deadlineText && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{deadlineText}</span>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div onClick={(e) => e.stopPropagation()}>
        {isOwner ? (
          <Button className="w-full h-10" variant="outline" disabled>
            Your Task
          </Button>
        ) : isAssignee ? (
          <Button className="w-full h-10" variant="secondary">
            <CheckCircle className="w-4 h-4 mr-2" />
            You're Selected
          </Button>
        ) : existingApplication ? (
          <Button className="w-full h-10" variant="secondary" disabled>
            Applied
          </Button>
        ) : canApply ? (
  user ? (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-10">Apply</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Task</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Cover note (optional)"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          className="mb-3"
          rows={4}
        />
        <Button onClick={handleApply} className="w-full h-10" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Submit'}
        </Button>
      </DialogContent>
    </Dialog>
  ) : (
    <Button
      className="w-full h-10"
      variant="outline"
      onClick={() => toast.error("Please login to apply")}
    >
      Login to Apply
    </Button>
  )
) : (

          <Button className="w-full h-10" variant="outline" disabled>
            Closed
          </Button>
        )}
      </div>
    </Card>
  );
};

export default MarketplaceTaskCard;
