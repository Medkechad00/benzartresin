"use client";

import { motion, useReducedMotion } from "motion/react";

export function AnimatedSeparator() {
  const reduceMotion = useReducedMotion();
  
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 bg-white flex justify-center">
      <motion.div 
        initial={reduceMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.5, ease: [0.77, 0, 0.175, 1] }}
        className="w-full h-[1px] bg-black/15 origin-left"
      />
    </div>
  );
}
