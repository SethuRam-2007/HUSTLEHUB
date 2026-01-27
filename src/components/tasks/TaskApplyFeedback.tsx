import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackStatus = 'applied' | 'pending' | 'approved' | 'rejected' | 'closed';

interface TaskApplyFeedbackProps {
  status: FeedbackStatus;
  className?: string;
}

const feedbackConfig: Record<FeedbackStatus, {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
}> = {
  applied: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: 'Applied Successfully',
    description: 'Please wait for poster approval.',
    colorClass: 'text-secondary',
    bgClass: 'bg-secondary/10 border-secondary/20',
  },
  pending: {
    icon: <Clock className="w-5 h-5" />,
    title: 'Awaiting Review',
    description: 'The task poster will review your application.',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  approved: {
    icon: <MessageCircle className="w-5 h-5" />,
    title: 'You\'re Selected!',
    description: 'Start chatting with the poster to discuss details.',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10 border-primary/20',
  },
  rejected: {
    icon: <XCircle className="w-5 h-5" />,
    title: 'Not Selected',
    description: 'This task has been assigned to another worker.',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
  },
  closed: {
    icon: <XCircle className="w-5 h-5" />,
    title: 'Applications Closed',
    description: 'This task is no longer accepting applications.',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
  },
};

export const TaskApplyFeedback = ({ status, className }: TaskApplyFeedbackProps) => {
  const config = feedbackConfig[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border',
          config.bgClass,
          className
        )}
      >
        <div className={cn('flex-shrink-0 mt-0.5', config.colorClass)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', config.colorClass)}>
            {config.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.description}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskApplyFeedback;
