
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiLogIn, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import nani from "../assets/nani.png";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginProps {
  onLogin: (userData: { id: string; name?: string; email: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!credentials.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) newErrors.email = "Please enter a valid email";
    if (!credentials.password) newErrors.password = "Password is required";
    else if (credentials.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");
    try {
      // const response = await axios.post("http://localhost:5000/api/login", credentials, {
        const response = await axios.post("http://192.168.137.1:5000/api/login", credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
      toast.success("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Login failed. Please try again later.";
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message || err.response?.data?.error;
        if (status === 400) errorMessage = message || "Invalid request data";
        else if (status === 401) errorMessage = message || "Invalid email or password";
        else if (status === 500) errorMessage = "Server error. Please try again later.";
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.6)), url(${nani})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/50 to-transparent"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "backOut" }}
        className="bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden -z-10">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-500/10"
              initial={{
                x: Math.random() * 100,
                y: Math.random() * 100,
                width: Math.random() * 60 + 20,
                height: Math.random() * 60 + 20,
                opacity: 0.1
              }}
              animate={{
                y: [0, Math.random() * 30 - 15],
                x: [0, Math.random() * 30 - 15],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="text-center mb-8 relative z-10">
          <motion.div
            initial={{ rotate: -15, scale: 1.1 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
          >
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/30 shadow-lg">
              <FiLogIn className="text-2xl text-blue-300" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Sign in to continue your journey</p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm text-red-200 rounded-xl text-sm flex items-center shadow-sm border border-red-500/30"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {apiError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400 text-lg" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 border ${
                  errors.email ? "border-red-500/50" : "border-gray-600/50"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                shadow-sm transition-all duration-200`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400 font-medium"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400 text-lg" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 border ${
                  errors.password ? "border-red-500/50" : "border-gray-600/50"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                shadow-sm transition-all duration-200`}
                placeholder="••••••••"
                minLength={6}
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm text-red-400 font-medium"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
          </div>

          {/* <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-500 focus:ring-blue-500/50 border-gray-600/50 rounded shadow-sm bg-gray-700/50 transition-all duration-200"
              />
              <label htmlFor="remember-me" className="ml-2 text-gray-400">
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-all duration-150"
            >
              Forgot password?
            </Link>
          </div> */}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 
                      hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 
                      focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-all duration-200 border border-blue-700/50"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <FiArrowRight className="ml-2 text-lg" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400 relative z-10">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline 
                      flex items-center justify-center transition-all duration-150"
          >
            Sign up here
            <FiArrowRight className="ml-1 text-lg" />
          </Link>
        </div>
      </motion.div>

      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
};

export default Login;

