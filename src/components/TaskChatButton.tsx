import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { MessageCircle, Lock, CheckCircle } from 'lucide-react';
import TaskMessages from './TaskMessages';

interface TaskChatButtonProps {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  isApproved: boolean;
  variant?: 'default' | 'prominent';
}

const TaskChatButton = ({
  taskId,
  taskTitle,
  taskStatus,
  isApproved,
  variant = 'default',
}: TaskChatButtonProps) => {
  const [open, setOpen] = useState(false);

  // Chat is only available after a worker has been selected (task is in_progress or beyond)
  const isChatEnabled = isApproved && ['in_progress', 'completed', 'approved'].includes(taskStatus);

  if (!isChatEnabled) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 px-3 bg-muted/50 rounded-lg">
        <Lock className="w-4 h-4" />
        <span>Chat available after worker selection</span>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={() => setOpen(true)}
          variant={variant === 'prominent' ? 'default' : 'outline'}
          size={variant === 'prominent' ? 'lg' : 'default'}
          className={variant === 'prominent' ? 'w-full bg-primary hover:bg-primary/90 gap-2' : 'gap-2'}
        >
          <MessageCircle className="w-4 h-4" />
          {variant === 'prominent' ? 'Start Chat' : 'Discuss Task'}
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Task Discussion
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span className="truncate">{taskTitle}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            <TaskMessages taskId={taskId} taskStatus={taskStatus} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskChatButton;
