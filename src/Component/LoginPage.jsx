import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { API_URL } from "../config/api";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 py-3 pl-11 pr-4 text-sm text-gray-950 outline-none transition-colors duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-[#5c6ac4] focus:bg-white focus:ring-4 focus:ring-[#5c6ac4]/10";

const LoginPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const redirectTimerRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setSuccess("");
    setError("");
  }, [isLogin]);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(
    () => () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  const scheduleRedirect = (callback) => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = window.setTimeout(callback, 1500);
  };

  const switchMode = (nextIsLogin) => {
    setIsLogin(nextIsLogin);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error("Please fill in all fields");
        }

        const response = await fetch(`${API_URL}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        window.dispatchEvent(new Event("user-login"));

        setSuccess("Successfully logged in! Redirecting to home page...");
        scheduleRedirect(() => navigate("/"));
      } else {
        if (!name || !email || !password || !confirmPassword) {
          throw new Error("Please fill in all fields");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const response = await fetch(`${API_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        setSuccess("Successfully registered! Please log in.");
        scheduleRedirect(() => {
          setIsLogin(true);
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const controlMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -1 },
        whileTap: { scale: 0.985 },
        transition: { duration: 0.2 },
      };

  return (
    <div
      data-testid="standalone-login-page"
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-gray-50"
    >
      <div className="relative z-20 mx-auto flex w-full max-w-7xl px-5 pt-6 sm:px-8 sm:pt-8">
        <Link
          to="/"
          aria-label="CineTix home"
          className="rounded-md text-xl font-bold tracking-[-0.03em] text-gray-950 outline-none transition-opacity duration-200 hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[#5c6ac4]"
        >
          Cine<span className="text-[#5c6ac4]">Tix</span>
        </Link>
      </div>

      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#5c6ac4]/[0.07] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl"
        />

        <motion.section
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          aria-labelledby="auth-heading"
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xl shadow-gray-900/[0.08]"
        >
          <div className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
            <div className="mb-7 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#5c6ac4]/10 text-[#5c6ac4]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h1
                id="auth-heading"
                className="mt-4 text-2xl font-bold tracking-tight text-gray-950 sm:text-[1.7rem]"
              >
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {isLogin
                  ? "Sign in to manage bookings and discover your next movie."
                  : "Join CineTix and book your next cinema experience."}
              </p>
            </div>

            <div
              className="mb-7 grid grid-cols-2 rounded-xl bg-gray-100 p-1"
              aria-label="Authentication mode"
            >
              <motion.button
                type="button"
                aria-pressed={isLogin}
                onClick={() => switchMode(true)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#5c6ac4] ${
                  isLogin
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                {...controlMotion}
              >
                Login
              </motion.button>
              <motion.button
                type="button"
                aria-pressed={!isLogin}
                onClick={() => switchMode(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#5c6ac4] ${
                  !isLogin
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                {...controlMotion}
              >
                Sign up
              </motion.button>
            </div>

            <div aria-live="polite">
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="full-name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      className={INPUT_CLASS}
                      placeholder="Your full name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email-address"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="email-address"
                    type="email"
                    autoComplete="email"
                    className={INPUT_CLASS}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className={`${INPUT_CLASS} pr-11`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c6ac4]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${INPUT_CLASS} pr-11`}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c6ac4]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-[#5c6ac4] px-4 text-sm font-bold text-white shadow-lg shadow-[#5c6ac4]/20 outline-none transition-colors duration-200 hover:bg-[#4f5db3] focus-visible:ring-2 focus-visible:ring-[#5c6ac4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                {...controlMotion}
              >
                {isLoading
                  ? isLogin
                    ? "Signing in…"
                    : "Creating account…"
                  : isLogin
                    ? "Log in"
                    : "Create account"}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? "New to CineTix?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="font-semibold text-[#5c6ac4] outline-none transition-colors duration-200 hover:text-[#4653a6] hover:underline focus-visible:ring-2 focus-visible:ring-[#5c6ac4]"
              >
                {isLogin ? "Create an account" : "Return to login"}
              </button>
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default LoginPage;
