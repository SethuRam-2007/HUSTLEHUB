import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlowingCTAButtonProps extends ButtonProps {
  children: React.ReactNode;
  stopOnInteraction?: boolean;
}

const GlowingCTAButton = React.forwardRef<HTMLButtonElement, GlowingCTAButtonProps>(
  ({ children, className, stopOnInteraction = true, onClick, ...props }, ref) => {
    const [isAnimating, setIsAnimating] = useState(true);
    const [pulseKey, setPulseKey] = useState(0);

    // Stop animation after user interaction
    useEffect(() => {
      if (!stopOnInteraction) return;

      const handleInteraction = () => {
        setIsAnimating(false);
      };

      window.addEventListener('scroll', handleInteraction, { once: true });
      
      return () => {
        window.removeEventListener('scroll', handleInteraction);
      };
    }, [stopOnInteraction]);

    // Trigger pulse every 6-8 seconds
    useEffect(() => {
      if (!isAnimating) return;

      const interval = setInterval(() => {
        setPulseKey(prev => prev + 1);
      }, 6000 + Math.random() * 2000);

      return () => clearInterval(interval);
    }, [isAnimating]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsAnimating(false);
      onClick?.(e);
    };

    return (
      <motion.div
        className="relative inline-block"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      >
        {/* Glow background layer */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              key={pulseKey}
              className="absolute inset-0 rounded-xl bg-primary/20"
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0, 0.12, 0],
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 15px hsl(var(--glow-primary) / 0.08)',
                  '0 0 30px hsl(var(--glow-primary) / 0.12)',
                  '0 0 15px hsl(var(--glow-primary) / 0.08)'
                ]
              }}
              transition={{ 
                duration: 1.2, 
                ease: "easeInOut",
              }}
              style={{ borderRadius: 'inherit' }}
            />
          )}
        </AnimatePresence>
        
        <Button 
          ref={ref} 
          onClick={handleClick}
          className={cn(
            "relative z-10 shadow-lg hover:shadow-xl transition-shadow duration-200",
            "bg-primary hover:bg-primary/90",
            className
          )} 
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

GlowingCTAButton.displayName = 'GlowingCTAButton';

export default GlowingCTAButton;
