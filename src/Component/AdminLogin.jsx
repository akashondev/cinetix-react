import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

const AdminLogin = ({ setIsAdminAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Demo credentials (replace with real authentication in production)
  const ADMIN_CREDENTIALS = {
    email: "admin@example.com",
    password: "admin123",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network request with slight delay
    setTimeout(() => {
      if (
        email === ADMIN_CREDENTIALS.email &&
        password === ADMIN_CREDENTIALS.password
      ) {
        // Create simple authentication token
        const authToken = `demo-token-${Date.now()}`;
        localStorage.setItem("adminToken", authToken);
        setIsAdminAuthenticated(true);
        navigate("/AdminPage");
      } else {
        setError("Invalid credentials. Please try again.");
        localStorage.removeItem("adminToken");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-[#5c6ac4] hover:text-blue-700 transition-all duration-300 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-xl transform transition-all duration-300 hover:shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-[#5c6ac4] flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in with your admin credentials
          </p>
        </div>

        {error && (
          <div className="text-center animate-bounce p-3 bg-red-50 rounded-lg text-red-600 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-[#5c6ac4] transition-all duration-300 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5c6ac4] focus:border-[#5c6ac4] transition-all duration-300 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#5c6ac4] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5c6ac4] transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock
                  className={`h-5 w-5 text-blue-300 group-hover:text-blue-200 ${
                    isLoading
                      ? "animate-spin"
                      : "group-hover:scale-110 transition-transform duration-300"
                  }`}
                />
              </span>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 hover:text-[#5c6ac4] transition-colors duration-300">
            Demo credentials: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
