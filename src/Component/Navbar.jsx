import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Ticket, User, X } from "lucide-react";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const name = localStorage.getItem("userName") || "";
      const email = localStorage.getItem("userEmail") || "";

      setIsLoggedIn(loggedIn);
      setUserName(name);
      setUserEmail(email);

      if (!loggedIn) {
        setIsAccountOpen(false);
      }
    };

    checkLoginStatus();

    window.addEventListener("storage", checkLoginStatus);
    window.addEventListener("user-logout", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("user-logout", checkLoginStatus);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleSearch = () => {
    setIsAccountOpen(false);
    setIsSearchOpen((current) => !current);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  };

  const toggleAccountMenu = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setIsMenuOpen(false);
    setIsAccountOpen((current) => !current);
  };

  const toggleMobileMenu = () => {
    setIsAccountOpen(false);
    setIsMenuOpen((current) => !current);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-bold tracking-tight sm:text-xl">
          CineTix
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/movies"
            className="text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            Movies
          </Link>
          <Link
            to="/theaters"
            className="text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            Theaters
          </Link>
          <Link
            to="/offers"
            className="text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            Offers
          </Link>
          {/* <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-10 rounded-full border border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white placeholder:text-white/45 outline-none transition-all duration-300 ease-in-out focus:border-white/25 focus:bg-white/10 ${
                  isSearchOpen ? "w-60 lg:w-72" : "w-10 cursor-pointer"
                }`}
                placeholder={isSearchOpen ? "Search movies..." : ""}
                aria-label="Search movies"
                readOnly={!isSearchOpen}
              />
              <button
                type="button"
                onClick={toggleSearch}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label={isSearchOpen ? "Close search" : "Open search"}
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div> */}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={toggleAccountMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              aria-label={isLoggedIn ? "Open account menu" : "Sign in"}
            >
              <User className="h-5 w-5" />
            </button>

            {isLoggedIn && isAccountOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#111] p-2 shadow-2xl shadow-black/40"
              >
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p className="truncate text-xs text-white/55">{userEmail}</p>
                </div>
                <Link
                  to="/ticket"
                  role="menuitem"
                  className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={closeMenus}
                >
                  <Ticket className="h-4 w-4" />
                  Tickets
                </Link>
                <div className="mt-1">
                  <LogoutButton className="w-full justify-start border-transparent bg-transparent px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleSearch}
            className="text-white md:hidden"
            aria-label={isSearchOpen ? "Close search" : "Open search"}
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={toggleMobileMenu}
            className="text-white md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-t border-white/5 bg-black md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-4 pr-11 text-sm text-white placeholder:text-white/45 outline-none focus:border-white/25"
                placeholder="Search movies..."
                aria-label="Search movies"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label="Submit search"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="border-t border-white/5 bg-black md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="flex flex-col space-y-4 pt-2 pb-4">
              <Link
                to="/"
                className="block transition-colors hover:text-gray-300"
                onClick={closeMenus}
              >
                Home
              </Link>
              <Link
                to="/movies"
                className="block transition-colors hover:text-gray-300"
                onClick={closeMenus}
              >
                Movies
              </Link>
              <Link
                to="/theaters"
                className="block transition-colors hover:text-gray-300"
                onClick={closeMenus}
              >
                Theaters
              </Link>
              <Link
                to="/offers"
                className="block transition-colors hover:text-gray-300"
                onClick={closeMenus}
              >
                Offers
              </Link>
              {!isLoggedIn && (
                <div className="mt-2 flex space-x-2">
                  <Link
                    to="/login"
                    className="flex-1 rounded-full border border-white px-4 py-2 text-center transition-colors hover:bg-gray-800"
                    onClick={closeMenus}
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
