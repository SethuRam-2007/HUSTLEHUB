import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, IndianRupee, ArrowUpRight } from 'lucide-react';
import GlassCard from './GlassCard';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'completed' | 'earning' | 'pending';
  title: string;
  amount?: number;
  time: string;
}

interface ActivityPanelProps {
  activities: Activity[];
}

const activityIcons = {
  completed: CheckCircle2,
  earning: IndianRupee,
  pending: Clock,
};

const activityColors = {
  completed: "bg-accent/10 text-accent",
  earning: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-500",
};

const ActivityPanel = ({ activities }: ActivityPanelProps) => {
  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <motion.button 
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15 }}
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            return (
              <motion.div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  activityColors[activity.type]
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                {activity.amount && (
                  <div className={cn(
                    "text-sm font-semibold",
                    activity.type === 'earning' ? "text-accent" : "text-foreground"
                  )}>
                    {activity.type === 'earning' ? '+' : ''}₹{activity.amount}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
};

export default ActivityPanel;