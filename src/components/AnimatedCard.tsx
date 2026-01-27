import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants } from '@/lib/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const AnimatedCard = ({ children, className, index = 0 }: AnimatedCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={className}
      custom={index}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;