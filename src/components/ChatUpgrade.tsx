import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Unlock, IndianRupee, Loader2 } from 'lucide-react';

interface ChatUpgradeProps {
  taskId: string;
  messageCount: number;
  isUpgraded: boolean;
  onUpgrade: () => void;
}

const CHAT_UPGRADE_PRICE = 9;
const FREE_MESSAGE_LIMIT = 10;

const ChatUpgrade = ({ taskId, messageCount, isUpgraded, onUpgrade }: ChatUpgradeProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);

    // Get user's current balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      toast.error('Failed to fetch wallet balance');
      setLoading(false);
      return;
    }

    if (profile.balance < CHAT_UPGRADE_PRICE) {
      toast.error('Insufficient balance. Please add funds to your wallet.');
      setLoading(false);
      return;
    }

    // Deduct from wallet
    const { error: walletError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - CHAT_UPGRADE_PRICE })
      .eq('id', user.id);

    if (walletError) {
      toast.error('Failed to process payment');
      setLoading(false);
      return;
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'chat_upgrade',
      amount: -CHAT_UPGRADE_PRICE,
      description: 'Chat upgrade for unlimited messages',
      task_id: taskId,
    });

    // Upgrade the task chat
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        chat_upgraded: true,
        chat_upgrade_paid_by: user.id,
      })
      .eq('id', taskId);

    if (taskError) {
      toast.error('Failed to upgrade chat');
      setLoading(false);
      return;
    }

    toast.success('Chat upgraded! You can now send unlimited messages.');
    onUpgrade();
    setLoading(false);
  };

  const remainingMessages = FREE_MESSAGE_LIMIT - messageCount;
  const isLimitReached = messageCount >= FREE_MESSAGE_LIMIT && !isUpgraded;

  if (isUpgraded) {
    return (
      <div className="flex items-center gap-2 text-sm text-secondary">
        <Unlock className="h-4 w-4" />
        <span>Chat Unlocked - Unlimited messages</span>
      </div>
    );
  }

  return (
    <Card className="p-4 border-dashed">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isLimitReached
                ? 'Free message limit reached'
                : `Free messages left: ${remainingMessages} / ${FREE_MESSAGE_LIMIT}`}
            </span>
          </div>
          {isLimitReached && (
            <p className="text-xs text-muted-foreground">
              Upgrade chat for ₹{CHAT_UPGRADE_PRICE} to continue messaging
            </p>
          )}
        </div>
        {isLimitReached && (
          <Button
            variant="default"
            size="sm"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <IndianRupee className="h-4 w-4" />
                Upgrade for ₹{CHAT_UPGRADE_PRICE}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ChatUpgrade;
