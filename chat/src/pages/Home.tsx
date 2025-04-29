


import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden">

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="py-20 px-6 sm:px-10 lg:px-16 max-w-[1920px] mx-auto"
      >
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight"
          >
            Welcome to RealTime Chat  
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-1 w-40 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-10 transform origin-center"
          />
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Connect, chat, and collaborate with people around the world in real-time.
          </motion.p>
        </div>

        {/* Dashboard Section */}
        <motion.div
          variants={containerVariants}
          className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 px-4 sm:px-0"
        >
          {/* Card 1 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 tracking-tight">Your Dashboard</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Access all your conversations, settings, and preferences in one place.
            </p>
            <Link to="/contacts">
              <button className="mt-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Get Started
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
            </Link>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 tracking-tight">Features</h2>
            <ul className="text-gray-600 space-y-3 font-medium">
              <li className="flex items-center transition-colors hover:text-indigo-600">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></span>
                Real-time messaging 
              </li>
              <li className="flex items-center transition-colors hover:text-purple-600">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                Group chats 
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={itemVariants}
          className="mt-20 text-center px-4"
        >
          <Link to="/contacts">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="inline-block px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Join the Community
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;