import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    // Clear success message when toggling between login and signup
    setSuccess("");
    setError("");
  }, [isLogin]);

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      navigate("/");
    }
  }, [navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login validation
        if (!email || !password) {
          throw new Error("Please fill in all fields");
        }

        // Send login request to backend
        const response = await fetch("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        // Store user data in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("token", data.token);

        setSuccess("Successfully logged in! Redirecting to home page...");

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // Sign up validation
        if (!name || !email || !password || !confirmPassword) {
          throw new Error("Please fill in all fields");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Send signup request to backend
        const response = await fetch(
          "http://localhost:3000/api/users/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        setSuccess("Successfully registered! Please log in.");

        // Switch to login form after registration
        setTimeout(() => {
          setIsLogin(true);
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple Navbar */}
      <nav className="bg-black text-white py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">
            <a href="/" className="flex items-center">
              <span>CineTix</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-gray-50 py-12 ">
        {/* Gradient background container */}
        <div
          className="absolute top-[150px] w-[400px] h-[400px] left-[1000px] rounded-full blur-3xl 
             animate-[spin_4s_linear_infinite] "
          style={{
            background:
              "linear-gradient(90deg, rgb(246, 235, 230) 0%, rgba(231, 236, 254, 1) 50%, rgba(221, 243, 248, 1) 100%)",
          }}
        ></div>

        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden flex-grow bg-gray-50 py-5 relative z-5">
            <div className="flex">
              <button
                className={`flex-1 py-4 text-center font-medium ${
                  isLogin
                    ? "bg-[#5c6ac4] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`flex-1 py-4 text-center font-medium ${
                  !isLogin
                    ? "bg-[#5c6ac4] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isLogin ? "Welcome Back!" : "Create Account"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent"
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-4 relative">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="mb-4 relative">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-transparent"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 text-[#5c6ac4] focus:ring-[#5c6ac4] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="remember"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 font-medium rounded-md transition-colors ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#5c6ac4] hover:bg-opacity-90"
                  } text-white`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : isLogin ? (
                    "Log In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className="py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                  <button className="py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 4H4C2.897 4 2 4.897 2 6V18C2 19.103 2.897 20 4 20H20C21.103 20 22 19.103 22 18V6C22 4.897 21.103 4 20 4ZM20 6L12 11L4 6H20ZM4 18V8L12 13L20 8V18H4Z" />
                    </svg>
                    Email
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      className="text-[#5c6ac4] font-medium hover:underline"
                      onClick={() => setIsLogin(false)}
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      className="text-[#5c6ac4] font-medium hover:underline"
                      onClick={() => setIsLogin(true)}
                    >
                      Log in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-black text-white py-6 px-6">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} CineTix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
