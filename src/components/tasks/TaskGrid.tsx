import React from 'react';
import { motion } from 'framer-motion';
import { MarketplaceTaskCard } from './MarketplaceTaskCard';
import { Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  description?: string;
  payout: number;
  deadline?: string | null;
  category?: string;
  difficulty?: string;
  time_required?: string;
  status: string;
  poster_id: string;
  assignee_id?: string | null;
  application_count?: number;
  attachment_url?: string | null;
}

interface TaskGridProps {
  tasks: Task[];
  loading?: boolean;
  emptyMessage?: string;
  onClearFilters?: () => void;
  onUpdate?: () => void;
}

export const TaskGrid = ({
  tasks,
  loading = false,
  emptyMessage = 'No tasks found',
  onClearFilters,
  onUpdate,
}: TaskGridProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <SearchX className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-foreground">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {tasks.map((task, index) => (
        <MarketplaceTaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          payout={task.payout}
          deadline={task.deadline}
          category={task.category}
          difficulty={task.difficulty}
          timeRequired={task.time_required}
          status={task.status}
          posterId={task.poster_id}
          assigneeId={task.assignee_id}
          applicationCount={task.application_count}
          attachmentUrl={task.attachment_url}
          index={index}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default TaskGrid;
