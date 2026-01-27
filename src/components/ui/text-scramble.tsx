import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextScrambleProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

export const TextScramble = ({
  text,
  className,
  duration = 1500,
  delay = 300,
  onComplete,
}: TextScrambleProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasRun.current) return;
    hasRun.current = true;

    const targetText = text.toUpperCase();
    const textLength = targetText.length;
    const frameRate = 50; // ms per frame
    const totalFrames = Math.floor(duration / frameRate);
    
    let currentFrame = 0;
    
    // Initial delay before starting
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        currentFrame++;
        const progress = currentFrame / totalFrames;
        
        // Calculate how many characters should be revealed
        const revealedCount = Math.floor(progress * textLength);
        
        let result = '';
        for (let i = 0; i < textLength; i++) {
          if (i < revealedCount) {
            // Character is revealed
            result += targetText[i];
          } else if (targetText[i] === ' ') {
            // Preserve spaces
            result += ' ';
          } else {
            // Scramble remaining characters
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        
        setDisplayText(result);
        
        if (currentFrame >= totalFrames) {
          clearInterval(interval);
          setDisplayText(targetText);
          setIsComplete(true);
          onComplete?.();
        }
      }, frameRate);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, duration, delay, onComplete]);

  return (
    <motion.span
      className={cn(
        'inline-block font-mono tracking-wider',
        isComplete && 'font-sans',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayText || text.split('').map(() => ' ').join('')}
    </motion.span>
  );
};

export default TextScramble;
