// Animation constants following startup-grade timing specifications
// GLOBAL RULE: Nothing should exceed 300ms

export const ANIMATION_CONFIG = {
  // Page transitions: 220ms fade + slide
  page: {
    duration: 0.22,
    ease: [0, 0, 0.2, 1] as const, // ease-out
    slideDistance: 10, // 8-12px range
  },
  
  // Task cards: 180ms with 40ms stagger
  card: {
    duration: 0.18,
    stagger: 0.04,
    ease: [0, 0, 0.2, 1] as const,
    slideDistance: 12,
  },
  
  // Buttons: hover 120ms, tap 80ms
  button: {
    hover: {
      scale: 1.02,
      duration: 0.12,
    },
    tap: {
      scale: 0.98,
      duration: 0.08,
    },
  },
  
  // Status changes: 200ms
  status: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as const, // ease-in-out
  },
  
  // Chat messages: 160ms slide-fade
  chat: {
    duration: 0.16,
    slideDistance: 6,
    ease: [0, 0, 0.2, 1] as const,
  },
  
  // Modals: open 200ms, close 150ms
  modal: {
    open: {
      duration: 0.2,
      scale: { from: 0.98, to: 1 },
    },
    close: {
      duration: 0.15,
    },
    ease: [0, 0, 0.2, 1] as const,
  },
} as const;

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: ANIMATION_CONFIG.page.slideDistance,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.page.duration,
      ease: ANIMATION_CONFIG.page.ease,
    },
  },
  exit: {
    opacity: 0,
    y: -ANIMATION_CONFIG.page.slideDistance,
    transition: {
      duration: ANIMATION_CONFIG.page.duration,
      ease: ANIMATION_CONFIG.page.ease,
    },
  },
};

// Card variants with stagger
export const cardContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.card.stagger,
    },
  },
};

export const cardVariants = {
  initial: {
    opacity: 0,
    y: ANIMATION_CONFIG.card.slideDistance,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.card.duration,
      ease: ANIMATION_CONFIG.card.ease,
    },
  },
};

// Button interaction variants
export const buttonVariants = {
  hover: {
    scale: ANIMATION_CONFIG.button.hover.scale,
    transition: {
      duration: ANIMATION_CONFIG.button.hover.duration,
      ease: "easeOut" as const,
    },
  },
  tap: {
    scale: ANIMATION_CONFIG.button.tap.scale,
    transition: {
      duration: ANIMATION_CONFIG.button.tap.duration,
      ease: "easeOut" as const,
    },
  },
};

// Chat message variants
export const chatMessageVariants = {
  initial: {
    opacity: 0,
    y: ANIMATION_CONFIG.chat.slideDistance,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.chat.duration,
      ease: ANIMATION_CONFIG.chat.ease,
    },
  },
};

// Modal variants
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: ANIMATION_CONFIG.modal.open.scale.from,
  },
  animate: {
    opacity: 1,
    scale: ANIMATION_CONFIG.modal.open.scale.to,
    transition: {
      duration: ANIMATION_CONFIG.modal.open.duration,
      ease: ANIMATION_CONFIG.modal.ease,
    },
  },
  exit: {
    opacity: 0,
    scale: ANIMATION_CONFIG.modal.open.scale.from,
    transition: {
      duration: ANIMATION_CONFIG.modal.close.duration,
      ease: ANIMATION_CONFIG.modal.ease,
    },
  },
};

// Overlay variants
export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: ANIMATION_CONFIG.modal.open.duration },
  },
  exit: { 
    opacity: 0,
    transition: { duration: ANIMATION_CONFIG.modal.close.duration },
  },
};

// Status badge color transitions
export const statusTransition = {
  transition: {
    duration: ANIMATION_CONFIG.status.duration,
    ease: ANIMATION_CONFIG.status.ease,
  },
};

// Fade in up animation for sections
export const fadeInUpVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.page.duration,
      ease: ANIMATION_CONFIG.page.ease,
    },
  },
};

// Stagger container for lists
export const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: ANIMATION_CONFIG.card.stagger,
      delayChildren: 0.05,
    },
  },
};
