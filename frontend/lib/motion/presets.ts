export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: easeOut } },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
};
