import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LogIn, Menu, Ticket, X } from "lucide-react";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { label: "Home", to: "/", end: true },
  { label: "Movies", to: "/movies" },
  { label: "Theaters", to: "/theaters" },
  { label: "Offers", to: "/offers" },
];

function initialsFor(name, email) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return String(email || "U").trim().charAt(0).toUpperCase() || "U";
}

function DesktopNavItem({ label, to, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative rounded-md px-1 py-2 text-sm font-medium transition-colors duration-200 ${
          isActive ? "text-white" : "text-white/65 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-[#7c88df] transition-transform duration-200 ${
              isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ label, to, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

const Navbar = () => {
  const reduceMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const syncLoginState = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
      setUserName(localStorage.getItem("userName") || "");
      setUserEmail(localStorage.getItem("userEmail") || "");
      if (!loggedIn) setIsAccountOpen(false);
    };

    syncLoginState();
    window.addEventListener("storage", syncLoginState);
    window.addEventListener("user-login", syncLoginState);
    window.addEventListener("user-logout", syncLoginState);
    return () => {
      window.removeEventListener("storage", syncLoginState);
      window.removeEventListener("user-login", syncLoginState);
      window.removeEventListener("user-logout", syncLoginState);
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

  const initials = useMemo(
    () => initialsFor(userName, userEmail),
    [userEmail, userName]
  );

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  };

  const buttonMotion = reduceMotion
    ? {}
    : { whileHover: { y: -1 }, whileTap: { scale: 0.97 } };

  return (
    <nav
      aria-label="Primary navigation"
      className="sticky top-0 z-50 border-b border-white/10 bg-black/95 text-white shadow-sm shadow-black/20 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link
          to="/"
          onClick={closeMenus}
          className="rounded-md text-xl font-bold tracking-[-0.03em] text-white outline-none transition-opacity duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#7c88df]"
        >
          Cine<span className="text-[#8f9af0]">Tix</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex lg:gap-9">
          {NAV_ITEMS.map((item) => (
            <DesktopNavItem key={item.to} {...item} />
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isLoggedIn ? (
            <motion.div {...buttonMotion}>
              <Link
                to="/login"
                onClick={closeMenus}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#7c88df]/60 bg-[#5c6ac4]/15 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-[#8f9af0] hover:bg-[#5c6ac4]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8f9af0] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Link>
            </motion.div>
          ) : (
            <div ref={accountMenuRef} className="relative">
              <motion.button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAccountOpen((current) => !current);
                }}
                className="flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 pl-1 pr-2 text-white outline-none transition-colors duration-200 hover:border-[#7c88df]/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#8f9af0]"
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
                aria-label="Open account menu"
                {...buttonMotion}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5c6ac4] text-xs font-bold tracking-wide shadow-sm shadow-[#5c6ac4]/30">
                  {initials}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/60 transition-transform duration-200 ${
                    isAccountOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </motion.button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    role="menu"
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111214] p-2 shadow-2xl shadow-black/50"
                  >
                    <div className="border-b border-white/10 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5c6ac4] text-xs font-bold">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {userName || "CineTix member"}
                          </p>
                          <p className="truncate text-xs text-white/50">
                            {userEmail}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/ticket"
                      role="menuitem"
                      className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:bg-white/10"
                      onClick={closeMenus}
                    >
                      <Ticket className="h-4 w-4 text-[#8f9af0]" />
                      My Bookings
                    </Link>
                    <div className="mt-1">
                      <LogoutButton className="flex w-full justify-start border-transparent bg-transparent px-3 py-2.5 text-white/75 hover:bg-white/10 hover:text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.button
            type="button"
            onClick={() => {
              setIsAccountOpen(false);
              setIsMenuOpen((current) => !current);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            {...buttonMotion}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }
            }
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 bg-black md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {NAV_ITEMS.map((item) => (
                <MobileNavItem
                  key={item.to}
                  {...item}
                  onClick={closeMenus}
                />
              ))}
              <div className="my-2 h-px bg-white/10" />
              {!isLoggedIn ? (
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="rounded-xl bg-[#5c6ac4] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#4f5db3]"
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    to="/ticket"
                    onClick={closeMenus}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <Ticket className="h-4 w-4 text-[#8f9af0]" />
                    My Bookings
                  </Link>
                  <LogoutButton className="flex w-full justify-start border-transparent bg-transparent px-3 py-2.5 text-white/75 hover:bg-white/10 hover:text-white" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
