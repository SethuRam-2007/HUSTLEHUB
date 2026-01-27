import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DisputeDialogProps {
  taskId: string;
  taskTitle: string;
  onDisputeRaised: () => void;
}

const DisputeDialog = ({ taskId, taskTitle, onDisputeRaised }: DisputeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason.trim()) return;

    setLoading(true);

    // Create dispute record
    const { error: disputeError } = await supabase.from('disputes').insert({
      task_id: taskId,
      raised_by: user.id,
      reason: reason.trim(),
    });

    if (disputeError) {
      toast.error('Failed to raise dispute');
      setLoading(false);
      return;
    }

    // Update task status
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        dispute_status: 'open',
        dispute_reason: reason.trim(),
        dispute_raised_by: user.id,
        dispute_raised_at: new Date().toISOString(),
        status: 'disputed',
      })
      .eq('id', taskId);

    if (taskError) {
      toast.error('Failed to update task status');
      setLoading(false);
      return;
    }

    toast.success('Dispute raised successfully. Our team will review it.');
    setOpen(false);
    setReason('');
    onDisputeRaised();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Raise Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a Dispute</DialogTitle>
          <DialogDescription>
            Report an issue with the task "{taskTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe the issue
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the problem in detail. Include any relevant information that would help us resolve this issue."
              rows={4}
            />
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Task will be marked as "Disputed"</li>
              <li>Payment will be held until resolution</li>
              <li>Admin will review and take action</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Submit Dispute'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDialog;
