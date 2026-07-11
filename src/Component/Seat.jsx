import React from "react";

function Seat({ id, selected, booked, onClick }) {
  return (
    <button
      type="button"
      aria-label={`Seat ${id}${booked ? ", booked" : selected ? ", selected" : ""}`}
      aria-pressed={selected}
      disabled={booked}
      onClick={() => onClick(id)}
      className={`h-9 w-9 rounded border text-xs font-semibold transition-colors ${
        booked ? "cursor-not-allowed border-red-300 bg-red-500 text-white" :
        selected ? "border-green-500 bg-green-500 text-white" :
        "border-gray-300 bg-white text-gray-700 hover:border-[#5c6ac4]"
      }`}
      title={booked ? "This seat is already booked" : `Seat ${id}`}
    >
      {id}
    </button>
  );
}

export default React.memo(Seat);
