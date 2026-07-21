import { motion } from "motion/react";
import bearHost from "../assets/images/bear-host.png";

export function BearHost({
  message,
  side = "left",
  compact = false,
  className = "",
}: {
  message: string;
  side?: "left" | "right";
  compact?: boolean;
  className?: string;
}) {
  return (
    <motion.aside
      initial={{ y: 35, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`pointer-events-none absolute z-30 flex items-end gap-2 ${side === "right" ? "right-2 flex-row-reverse sm:right-4" : "left-2 sm:left-4"} ${className}`}
      aria-label={`Bear host says: ${message}`}
    >
      <motion.img
        src={bearHost}
        alt="Benny the friendly bear host"
        animate={{ rotate: [0, -2, 2, 0], y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className={`${compact ? "w-20 sm:w-24" : "w-24 sm:w-32 lg:w-36"} h-auto shrink-0 drop-shadow-[0_5px_2px_rgba(26,47,51,0.28)]`}
      />
      <div className={`${compact ? "max-w-40 px-3 py-2 text-xs sm:text-sm" : "max-w-48 px-4 py-3 text-sm sm:max-w-56 sm:text-base"} mb-5 rounded-[1.4rem] border-[3px] border-[#1A2F33] bg-white/95 font-fredoka font-black leading-tight text-[#1A2F33] shadow-[0_4px_0_#1A2F33]`}>
        {message}
      </div>
    </motion.aside>
  );
}
