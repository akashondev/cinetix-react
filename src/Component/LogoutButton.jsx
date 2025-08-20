import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");

    // Dispatch custom event to notify other components (like Navbar)
    window.dispatchEvent(new Event("user-logout"));

    // Optional: Redirect to the home page
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-1 rounded-[10px] border-2 border-white text-white hover:bg-white hover:text-black transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
    >
      Logout
    </button>
    
  );
};

export default LogoutButton;
