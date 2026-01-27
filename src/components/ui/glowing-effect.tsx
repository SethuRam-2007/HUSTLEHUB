import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowingEffectProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  disabled?: boolean;
}

const intensityMap = {
  subtle: {
    blur: '20px',
    opacity: 0.15,
    scale: 1.02,
  },
  medium: {
    blur: '30px',
    opacity: 0.25,
    scale: 1.03,
  },
  strong: {
    blur: '40px',
    opacity: 0.35,
    scale: 1.04,
  },
};

export const GlowingEffect = ({
  children,
  className,
  glowColor = 'hsl(var(--primary))',
  intensity = 'subtle',
  disabled = false,
}: GlowingEffectProps) => {
  const config = intensityMap[intensity];

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover={{ scale: config.scale }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Glow effect layer */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{
          background: glowColor,
          filter: `blur(${config.blur})`,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: config.opacity }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.div>
  );
};

export default GlowingEffect;
