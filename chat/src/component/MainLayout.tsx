

import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt, FaHome, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { HiUserGroup } from 'react-icons/hi';
import { MdContacts } from 'react-icons/md';
import { HiOutlineLogout } from 'react-icons/hi';

interface MainLayoutProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  } | null; // Allow null since user can be null initially
  onLogout: () => void;
}

const MainLayout = ({ user, onLogout }: MainLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: "/", label: "Home", icon: <FaHome className="mr-2" /> },
    { to: "/newgroup", label: "New Group", icon: <FaPlus className="mr-2" /> },
    { to: "/contacts", label: "Contacts", icon: <MdContacts className="mr-2" /> },
    { to: "/groupchatlist", label: "Groups", icon: <HiUserGroup className="mr-2" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white antialiased">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[rgba(176,224,230,0.85)] backdrop-blur-md border-b border-cyan-200/30 shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_4px_rgba(34,211,238,0.2)]">
                ChatApp
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <motion.div
                  key={item.to}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(164, 224, 255, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg"
                >
                  <Link
                    to={item.to}
                    className="flex items-center px-4 py-2 text-cyan-800 hover:text-cyan-900 transition-all duration-200 ease-in-out relative group"
                  >
                    <span className="mr-2 opacity-90 group-hover:opacity-100 text-cyan-700">{item.icon}</span>
                    <span className="text-sm font-medium text-cyan-900 group-hover:text-blue-900">{item.label}</span>
                    <span className="absolute inset-0 overflow-hidden rounded-lg">
                      <span className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-cyan-300/40 group-hover:scale-100 transition-all duration-500"></span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-3 cursor-pointer group"
                  onClick={() => navigate('/profile')}
                >
                  <div className="relative">
                    <img
                      src={user.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                      alt="User"
                      className="w-9 h-9 rounded-full border-2 border-cyan-500/70 object-cover shadow-sm group-hover:border-cyan-400 transition-colors duration-200"
                    />
                    <div className="absolute inset-0 rounded-full bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors duration-200"></div>
                  </div>
                  <span className="text-sm font-medium text-cyan-900 group-hover:text-blue-900 transition-colors duration-200">
                    {user.name}
                  </span>
                </motion.div>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="p-2 text-cyan-700 hover:text-white rounded-full hover:bg-cyan-600 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                title="Logout"
              >
                <FaSignOutAlt size={18} />
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-2 rounded-lg text-cyan-700 hover:text-cyan-900 hover:bg-cyan-300/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-[rgba(176,224,230,0.95)] backdrop-blur-sm shadow-lg"
            >
              <div className="px-3 pt-3 pb-4 space-y-2 sm:px-4">
                {navItems.map((item) => (
                  <motion.div key={item.to} whileHover={{ x: 5 }} whileTap={{ x: 10 }}>
                    <Link
                      to={item.to}
                      onClick={toggleMobileMenu}
                      className="flex items-center px-4 py-3 text-cyan-800 hover:text-cyan-900 hover:bg-cyan-300/30 rounded-lg text-base font-medium transition-all duration-200 ease-in-out"
                    >
                      <span className="mr-3 text-cyan-600">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
                {user && (
                  <div className="pt-5 pb-3 border-t border-cyan-300/30">
                    <div className="flex items-center px-5">
                      <div className="flex-shrink-0">
                        <img
                          src={user.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                          alt="User"
                          className="w-11 h-11 rounded-full border-2 border-cyan-500/70 object-cover shadow-md"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-semibold text-cyan-900 tracking-tight">{user.name}</div>
                        <div className="text-sm font-medium text-cyan-700">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-4 px-2 space-y-2">
                      <motion.button
                        whileHover={{ x: 5 }}
                        whileTap={{ x: 10 }}
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-base font-medium text-cyan-800 hover:text-white hover:bg-cyan-600 rounded-lg transition-all duration-200 ease-in-out"
                      >
                        <HiOutlineLogout className="mr-3" />
                        Sign out
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      <div className="flex-1 overflow-y-auto bg-cyan-50/30">
        <div className="p-6 md:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
      <footer className="bg-gradient-to-r from-cyan-700 to-blue-800 text-white py-5 shadow-inner">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-cyan-100">
          <p className="tracking-wide">ChatApp © {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;