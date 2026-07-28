import React from "react";
import { motion } from "framer-motion";

function Seat({
  id,
  selected,
  booked,
  placeholder = false,
  onClick,
  reduceMotion = false,
}) {
  const state = placeholder
    ? "placeholder"
    : booked
      ? "booked"
      : selected
        ? "selected"
        : "available";
  const styles = {
    placeholder:
      "cursor-wait border-gray-200 bg-gray-100 text-transparent animate-pulse",
    booked: "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400",
    selected:
      "border-[#5c6ac4] bg-[#5c6ac4] text-white shadow-md shadow-[#5c6ac4]/25",
    available:
      "border-gray-300 bg-white text-gray-700 hover:border-[#5c6ac4] hover:text-[#4d5ab5]",
  };

  return (
    <motion.button
      type="button"
      aria-label={`Seat ${id}${
        placeholder
          ? ", checking availability"
          : booked
            ? ", booked"
            : selected
              ? ", selected"
              : ""
      }`}
      aria-pressed={selected}
      data-seat-state={state}
      disabled={placeholder || booked}
      onClick={() => onClick(id)}
      animate={reduceMotion ? undefined : { scale: selected ? 1.08 : 1 }}
      whileHover={reduceMotion || placeholder || booked ? undefined : { y: -2 }}
      whileTap={reduceMotion || placeholder || booked ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`h-9 w-9 rounded-lg border text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:ring-offset-2 sm:h-10 sm:w-10 ${styles[state]}`}
      title={
        placeholder
          ? "Checking seat availability"
          : booked
            ? "This seat is already booked"
            : `Seat ${id}`
      }
    >
      {id}
    </motion.button>
  );
}

export default React.memo(Seat);
