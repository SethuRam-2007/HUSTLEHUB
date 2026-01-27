import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const HomepageMascot = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showWave, setShowWave] = useState(true);

  // Stop all animations after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Wave animation only on initial load
  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setShowWave(false);
    }, 800);

    return () => clearTimeout(waveTimer);
  }, []);

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
    >
      {/* Mascot Container */}
      <div className="relative w-20 h-20 md:w-24 md:h-24">
        {/* Body */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-lg"
          animate={isAnimating ? {
            scale: [1, 1.01, 1],
          } : {}}
          transition={{
            duration: 3,
            repeat: isAnimating ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {/* Face */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Eyes container */}
            <div className="flex gap-3 md:gap-4 mt-[-4px]">
              {/* Left Eye */}
              <motion.div
                className="w-2.5 h-3 md:w-3 md:h-3.5 bg-white rounded-full relative overflow-hidden"
                animate={isAnimating ? {
                  scaleY: [1, 1, 0.1, 1, 1],
                } : {}}
                transition={{
                  duration: 5,
                  repeat: isAnimating ? Infinity : 0,
                  times: [0, 0.9, 0.95, 1, 1],
                  ease: "easeInOut"
                }}
              >
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-foreground rounded-full" />
              </motion.div>
              
              {/* Right Eye */}
              <motion.div
                className="w-2.5 h-3 md:w-3 md:h-3.5 bg-white rounded-full relative overflow-hidden"
                animate={isAnimating ? {
                  scaleY: [1, 1, 0.1, 1, 1],
                } : {}}
                transition={{
                  duration: 5,
                  repeat: isAnimating ? Infinity : 0,
                  times: [0, 0.9, 0.95, 1, 1],
                  ease: "easeInOut"
                }}
              >
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-foreground rounded-full" />
              </motion.div>
            </div>
          </div>
          
          {/* Smile */}
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-4 h-2 md:w-5 md:h-2.5 border-b-2 border-white rounded-b-full" />
        </motion.div>
        
        {/* Waving Hand */}
        <motion.div
          className="absolute -right-2 top-1/2 -translate-y-1/2 origin-bottom-left"
          initial={{ rotate: 0 }}
          animate={showWave ? {
            rotate: [0, 15, -10, 15, 0],
          } : {}}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
        >
          <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-md flex items-center justify-center">
            <span className="text-[8px] md:text-[10px]">👋</span>
          </div>
        </motion.div>
        
        {/* Subtle glow behind mascot */}
        <motion.div
          className="absolute inset-[-20%] bg-primary/10 rounded-full blur-xl -z-10"
          animate={isAnimating ? {
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          } : { opacity: 0.3, scale: 1 }}
          transition={{
            duration: 3,
            repeat: isAnimating ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
};

export default HomepageMascot;
