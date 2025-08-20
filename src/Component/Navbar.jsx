import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, User, X, Menu } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const ticket = () => {
    navigate("/ticket");
  };

  useEffect(() => {
    // Check login status whenever component mounts or localStorage changes
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const name = localStorage.getItem("userName") || "";
      const email = localStorage.getItem("userEmail") || "";

      setIsLoggedIn(loggedIn);
      setUserName(name);
      setUserEmail(email);
    };

    // Initial check
    checkLoginStatus();

    // Setup event listener for storage changes (for multi-tab support)
    window.addEventListener("storage", checkLoginStatus);

    // Custom event for logout from other components
    window.addEventListener("user-logout", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("user-logout", checkLoginStatus);
    };
  }, []);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Handle search submission
    console.log("Searching for:", searchQuery);
    // Add your search logic here
  };

  return (
    <nav className="bg-black text-white py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl font-bold">
          <Link to="/" className="flex items-center">
            <span>CineTix</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="text-[18px] hover:text-gray-200 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/movies"
            className="text-[18px] hover:text-gray-200 transition-colors"
          >
            Movies
          </Link>
          <Link
            to="/theaters"
            className="text-[18px]  hover:text-gray-200 transition-colors"
          >
            Theaters
          </Link>
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-12 bg-black text-white placeholder-gray-300 rounded-full pl-5 pr-12 outline-none transition-all duration-500 ease-in-out ${
                  isSearchOpen ? "w-72" : "w-12"
                }`}
                placeholder={isSearchOpen ? "Search movies..." : ""}
              />
              <button
                type="button"
                onClick={toggleSearch}
                className="absolute right-0 top-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white mr-2">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
              <LogoutButton />

              <button
                onClick={ticket}
                className="px-4 py-1 rounded-[10px] border-2 border-white text-white hover:bg-white hover:text-black transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              >
                tickets
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 border-2 rounded-lg bg-transparent border-white hover:bg-gray-800 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-4">
          {/* Mobile Search Button */}
          <button onClick={toggleSearch} className="text-white">
            <Search className="h-5 w-5" />
          </button>

          {/* Mobile Profile Button */}
          <Link to={isLoggedIn ? "/profile" : "/login"} className="text-white">
            <User className="h-5 w-5" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden bg-black py-3 px-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full bg-gray-800 text-white placeholder-gray-300 rounded-full pl-5 pr-12 outline-none"
              placeholder="Search movies..."
            />
            <button
              type="submit"
              className="absolute right-0 top-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black py-2 px-6">
          <div className="flex flex-col space-y-4 pt-2 pb-4">
            <Link
              to="/"
              className="block hover:text-gray-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className="block hover:text-gray-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Movies
            </Link>
            <Link
              to="/theaters"
              className="block hover:text-gray-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Theaters
            </Link>
            <Link
              to="/offers"
              className="block hover:text-gray-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Offers
            </Link>
            {isLoggedIn ? (
              <div className="flex flex-col space-y-2 mt-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white mr-2">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{userName}</span>
                </div>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex space-x-2 mt-4">
                <Link
                  to="/signup"
                  className="flex-1 px-4 py-2 rounded-full bg-transparent border border-white hover:bg-gray-800 text-center transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
