import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const GlassCard = ({ children, className, hover = true, glow = false, ...props }: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "rounded-2xl glass",
        hover && "hover:shadow-glass-lg transition-shadow duration-200",
        glow && "glow-effect-subtle",
        className
      )}
      whileHover={hover ? { y: -2, transition: { duration: 0.15 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;