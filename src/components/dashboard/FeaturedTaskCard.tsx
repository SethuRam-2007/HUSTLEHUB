import React from 'react';
import { motion } from 'framer-motion';
import { Clock, IndianRupee, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';
import { Link } from 'react-router-dom';

interface FeaturedTaskCardProps {
  id: string;
  title: string;
  payout: number;
  difficulty: string;
  deadline: string | null;
  category?: string;
  rating?: number;
  index?: number;
}

const categoryColors: Record<string, string> = {
  ppt: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  coding: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  design: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  writing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  video: "bg-red-500/10 text-red-600 border-red-500/20",
  data_entry: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  general: "bg-muted text-muted-foreground border-border",
};

const difficultyColors: Record<string, string> = {
  Easy: "text-accent",
  Medium: "text-amber-500",
  Hard: "text-rose-500",
};

const FeaturedTaskCard = ({
  id,
  title,
  payout,
  difficulty,
  deadline,
  category = "general",
  rating = 4.5,
  index = 0,
}: FeaturedTaskCardProps) => {
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "Flexible";
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays}d left`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <GlassCard className="p-5 h-full" glow>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <Badge 
              variant="outline" 
              className={`${categoryColors[category] || categoryColors.general} border capitalize`}
            >
              {category.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-4 flex-1">
            {title}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{formatDeadline(deadline)}</span>
            </div>
            <span className={`font-medium ${difficultyColors[difficulty] || ''}`}>
              {difficulty}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center text-2xl font-bold gradient-text">
              <IndianRupee className="w-5 h-5" />
              <span>{payout.toLocaleString('en-IN')}</span>
            </div>
            
            <Link to="/marketplace">
              <Button 
                size="sm" 
                className="gap-1.5 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-glow-sm hover:shadow-glow"
              >
                Apply
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default FeaturedTaskCard;