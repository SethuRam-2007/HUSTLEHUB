import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttentionBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  animate?: boolean;
}

const AttentionBadge = ({ 
  children, 
  className, 
  variant = 'default',
  animate = true 
}: AttentionBadgeProps) => {
  const [isAnimating, setIsAnimating] = useState(animate);
  const [bounceKey, setBounceKey] = useState(0);

  // Stop animation after user interaction
  useEffect(() => {
    if (!animate) return;

    const handleInteraction = () => {
      setIsAnimating(false);
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('scroll', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [animate]);

  // Trigger bounce every 10 seconds
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setBounceKey(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <motion.div
      key={bounceKey}
      animate={isAnimating ? {
        y: [0, -4, 0],
      } : {}}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
      className="inline-block"
    >
      <Badge 
        variant={variant} 
        className={cn(
          "shadow-sm",
          variant === 'default' && "bg-primary/90 hover:bg-primary",
          variant === 'secondary' && "bg-accent/90 hover:bg-accent text-accent-foreground",
          className
        )}
      >
        {children}
      </Badge>
    </motion.div>
  );
};

export default AttentionBadge;
