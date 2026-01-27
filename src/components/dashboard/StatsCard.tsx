import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  iconColor?: string;
  index?: number;
}

const StatsCard = ({ title, value, icon: Icon, trend, iconColor = "text-primary", index = 0 }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.positive ? "text-accent" : "text-destructive"
              )}>
                {trend.positive ? '+' : ''}{trend.value}% this week
              </p>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconColor === "text-primary" && "bg-primary/10",
            iconColor === "text-secondary" && "bg-secondary/10",
            iconColor === "text-accent" && "bg-accent/10"
          )}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default StatsCard;