import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MarketplaceTaskCard from "./MarketplaceTaskCard";

const TaskGrid: React.FC<TaskGridProps> = ({
  tasks,
  loading = false,
  emptyMessage = "No tasks found",
  onClearFilters,
  onUpdate,
  onApply, // <-- already exists
}) => {

  // Keep a local copy of tasks to update UI immediately
  const [localTasks, setLocalTasks] = React.useState(tasks);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleTaskApply = (taskId: string) => {
    // Update the specific task in localTasks to mark it as applied
    setLocalTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, assigneeId: 'applied_temp', applicationCount: (task.applicationCount || 0) + 1 }
          : task
      )
    );

    // Also call parent update if needed
    onUpdate?.();
    onApply?.(taskId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading tasks...</p>
      </div>
    );
  }
<button
  onClick={() => onApply(task.id)}
  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
>
  Apply
</button>


  if (localTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {localTasks.map((task, index) => (
        <MarketplaceTaskCard
          key={task.id}
          {...task}
          index={index}
          onUpdate={onUpdate}
          onApply={handleTaskApply} // <-- pass the handler here
        />
      ))}
    </div>
  );
};
export default TaskGrid;
