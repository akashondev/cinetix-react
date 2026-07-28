import React from "react";
import { useNavigate } from "react-router-dom";
import { revokeAndClearUserSession } from "../api/authSession";

const LogoutButton = ({ className = "", children = "Logout" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    void revokeAndClearUserSession();
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 rounded-md border border-white/20 text-left text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white/60 ${className}`}
    >
      {children}
    </button>
  );
};

export default LogoutButton;
