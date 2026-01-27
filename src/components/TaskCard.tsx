import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, IndianRupee, Users } from "lucide-react";
import TaskApplicationButton from './TaskApplicationButton';
import { cardVariants, ANIMATION_CONFIG } from '@/lib/animations';

interface TaskCardProps {
  id: string;
  title: string;
  payout: number;
  difficulty: "Easy" | "Medium" | "Hard";
  timeRequired: string;
  description?: string;
  deadline?: string | null;
  status?: "open" | "in_progress" | "completed" | "applications_received" | "expired";
  category?: string;
  posterId: string;
  assigneeId?: string | null;
  applicationCount?: number;
  isOwner?: boolean;
  onApplicationSubmitted?: () => void;
  index?: number;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  ppt: { label: "PPT", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  coding: { label: "Coding", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  design: { label: "Design", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  writing: { label: "Writing", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  video: { label: "Video", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  data_entry: { label: "Data Entry", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400" },
  general: { label: "General", color: "bg-muted text-muted-foreground" },
};

const TaskCard = ({ 
  id,
  title, 
  payout, 
  difficulty, 
  timeRequired, 
  description, 
  deadline,
  status = "open",
  category,
  posterId,
  assigneeId,
  applicationCount = 0,
  isOwner = false,
  onApplicationSubmitted,
  index = 0,
}: TaskCardProps) => {
  const categoryInfo = category ? categoryConfig[category] || categoryConfig.general : null;
  
  const formatDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const deadlineText = formatDeadline(deadline);
  const isAssigned = status === 'in_progress' || (assigneeId && status !== 'open');
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ 
        y: -4,
        boxShadow: "0 10px 25px -5px hsl(220 13% 10% / 0.1), 0 8px 10px -6px hsl(220 13% 10% / 0.08)",
        transition: { duration: 0.12, ease: "easeOut" }
      }}
      custom={index}
    >
      <Card className="p-5 bg-card border border-border hover:border-primary/20 transition-all duration-120 h-full shadow-sm hover:shadow-lg">
        <div className="space-y-3">
          {/* Category Pill */}
          {categoryInfo && (
            <Badge variant="secondary" className={`${categoryInfo.color} text-xs font-medium px-2 py-0.5`}>
              {categoryInfo.label}
            </Badge>
          )}
          
          {/* Title */}
          <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>
          
          {/* Payout & Deadline - Bold and prominent */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground font-bold text-xl">
              <IndianRupee className="w-5 h-5" />
              <span>{payout.toLocaleString('en-IN')}</span>
            </div>
            
            {deadlineText && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{deadlineText}</span>
              </div>
            )}
          </div>
          
          {/* Time & Applicants */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{timeRequired}</span>
            {applicationCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{applicationCount}</span>
              </div>
            )}
          </div>
          
          {/* Status indicator for assigned tasks */}
          {isAssigned && !isOwner && (
            <p className="text-sm text-muted-foreground">
              Assigned to another worker
            </p>
          )}
          
          {/* Application button for non-owners */}
          {!isOwner && !isAssigned && status !== 'completed' && status !== 'expired' && (
            <TaskApplicationButton
              taskId={id}
              taskTitle={title}
              posterId={posterId}
              taskStatus={status}
              assigneeId={assigneeId || null}
              deadline={deadline || null}
              onApplicationSubmitted={onApplicationSubmitted}
            />
          )}

          {/* Owner view */}
          {isOwner && (status === "open" || status === "applications_received") && (
            <p className="text-sm text-muted-foreground">
              {applicationCount > 0 
                ? `${applicationCount} applicant${applicationCount !== 1 ? 's' : ''}`
                : 'Waiting for applicants'}
            </p>
          )}

          {isOwner && status === "in_progress" && (
            <p className="text-sm text-secondary font-medium">
              In progress
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default TaskCard;
