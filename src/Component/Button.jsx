import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, outline
  size = "medium", // small, medium, large
  fullWidth = false,
  disabled = false,
  className = "",
  icon = null,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-[#5c6ac4] text-white hover:bg-opacity-90 focus:ring-[#5c6ac4]",
    secondary: "bg-black text-white hover:bg-gray-800 focus:ring-black",
    outline:
      "bg-transparent border border-white text-white hover:bg-gray-800 focus:ring-white",
  };

  const sizes = {
    small: "text-xs px-3 py-1",
    medium: "text-sm px-4 py-2",
    large: "text-base px-6 py-3",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
