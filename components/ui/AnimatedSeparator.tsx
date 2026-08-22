"use client";

import { motion } from "motion/react";

export function AnimatedSeparator() {
  
  return (
    /*
      Padding on the OUTER element, max-w-7xl on the INNER one — the same order
      as the Navbar. The previous version put both on one element
      (`max-w-7xl mx-auto px-6 md:px-12`), which caps the box at 1280px and then
      insets the padding out of it, leaving the rule 48px narrower per side than
      the section content it divides.
    */
    <div className="w-full px-6 md:px-12 bg-white flex justify-center">
      <div className="w-full max-w-7xl">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ duration: 1.5, ease: [0.77, 0, 0.175, 1] }}
          className="w-full h-[1px] bg-black/15 origin-left rtl:origin-right"
        />
      </div>
    </div>
  );
}
