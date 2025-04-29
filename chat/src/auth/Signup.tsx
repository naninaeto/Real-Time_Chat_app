
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUserPlus, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import nani from "../assets/nani.png"

interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  // const fakeUsers = Array.from({ length: 10 }, () => generateFakeUser());

  const [credentials, setCredentials] = useState<SignupCredentials>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!credentials.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) newErrors.email = "Please enter a valid email";
    
    if (!credentials.password) newErrors.password = "Password is required";
    else if (credentials.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    else if (!/[A-Z]/.test(credentials.password)) newErrors.password = "Password must contain at least one uppercase letter";
    else if (!/[^a-zA-Z0-9\s]/.test(credentials.password)) newErrors.password = "Password must contain at least one special character";
    
    if (!credentials.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (credentials.password !== credentials.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");
    try {
      await axios.post(
        "http://192.168.137.1:5000/api/register",
        { email: credentials.email, password: credentials.password },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: unknown) {
      let errorMessage = "Signup failed. Please try again later.";
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;
        if (status === 400 && message) errorMessage = message;
        else if (message) errorMessage = message;
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden -z-10">
          {[...Array(8)].map((_, i) => (
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
              <FiUserPlus className="text-2xl text-blue-300" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-gray-400 mt-2 text-sm">Join us to get started</p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
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
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.email}</p>
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
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400 text-lg" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 border ${
                  errors.confirmPassword ? "border-red-500/50" : "border-gray-600/50"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                shadow-sm transition-all duration-200`}
                placeholder="••••••••"
                minLength={6}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

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
                Signing up...
              </>
            ) : (
              <>
                <FiArrowRight className="mr-2 text-lg" />
                Sign Up
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400 relative z-10">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline 
                      flex items-center justify-center transition-all duration-150"
          >
            Login here <FiArrowRight className="ml-1 text-lg" />
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
          boxShadow: '0 4px 6 dittop-1px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
};

export default Signup;



