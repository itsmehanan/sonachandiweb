import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getInitial = () => {
    if (shouldReduceMotion || direction === 'none') {
      return { opacity: 0, y: 0, x: 0 };
    }
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 24, x: 0 };
      case 'down':
        return { opacity: 0, y: -24, x: 0 };
      case 'left':
        return { opacity: 0, x: 24, y: 0 };
      case 'right':
        return { opacity: 0, x: -24, y: 0 };
      default:
        return { opacity: 0, y: 0, x: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: [0.16, 1, 0.3, 1],
        delay: shouldReduceMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerGridProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}

export const StaggerGrid: React.FC<StaggerGridProps> = ({
  children,
  stagger = 0.08,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.4,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  title,
  subtitle,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14 ${className}`}>
      {kicker && (
        <span className="block text-xs uppercase tracking-[0.14em] font-semibold text-[#7A5A12]">
          {kicker}
        </span>
      )}
      <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.2] font-medium text-[#1A1410] [text-wrap:balance]">
        {title}
      </h2>

      {/* Centred gold ornament divider with hairline */}
      <div className="flex items-center justify-center gap-3 my-3">
        <motion.span
          initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-10 sm:w-14 h-[1px] bg-gradient-to-r from-transparent to-[#B8923A] origin-right"
        />
        <span className="w-1.5 h-1.5 rotate-45 bg-[#B8923A] shrink-0" aria-hidden="true" />
        <motion.span
          initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-10 sm:w-14 h-[1px] bg-gradient-to-l from-transparent to-[#B8923A] origin-left"
        />
      </div>

      {subtitle && (
        <p className="text-sm sm:text-base text-[#4A3F35] font-light leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

interface HeroHeadlineRevealProps {
  text: string;
  highlightText?: string;
  className?: string;
}

export const HeroHeadlineReveal: React.FC<HeroHeadlineRevealProps> = ({
  text,
  highlightText,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`font-serif text-[clamp(2.4rem,5vw,4rem)] text-[#1A1410] font-normal tracking-tight leading-[1.12] [text-wrap:balance] ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
      {highlightText && (
        <motion.span
          variants={wordVariants}
          className="block italic font-serif text-[#7A5A12] mt-1"
        >
          {highlightText}
        </motion.span>
      )}
    </motion.h1>
  );
};

export function useNumberCountUp(target: number, duration: number = 500): number {
  const [current, setCurrent] = useState(target);
  const startRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrent(target);
      startRef.current = target;
      return;
    }

    const start = startRef.current;
    const diff = target - start;
    if (diff === 0) return;

    let animId: number;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + diff * ease);
      setCurrent(val);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        startRef.current = target;
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, shouldReduceMotion]);

  return current;
}
