

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus } from 'react-icons/fi';
import api from '../api';

interface Group {
  _id: string;
  name: string;
  members: string[];
  created_at: string;
  last_message?: {
    content: string;
    timestamp: string;
  };
}

const GroupChatList: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/api/groups');
        setGroups(response.data);
      } catch (err) {
        setError('Failed to load groups');
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen max-w-md mx-auto">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div className="w-48 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen max-w-md mx-auto">
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-100 max-w-xs">
        <div className="text-red-500 font-medium">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Group Chats</h1>
        <motion.button 
          onClick={() => navigate('/new-group')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-xs hover:shadow-sm transition-all duration-200 border border-blue-100"
          aria-label="Create new group"
        >
          <FiPlus className="text-blue-600 w-5 h-5" />
        </motion.button>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto scroll-smooth pb-4">
        {groups.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full px-6 text-center"
          >
            <div className="bg-blue-50 p-5 rounded-full mb-4">
              <FiUsers className="text-blue-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No groups yet</h3>
            <p className="text-gray-500 mb-6 max-w-xs">
              Create your first group to start chatting with friends and colleagues
            </p>
            <motion.button
              onClick={() => navigate('/newgroup')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-xs hover:shadow-sm transition-all duration-200"
            >
              Create Group
            </motion.button>
          </motion.div>
        ) : (
          <motion.ul 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
            className="divide-y divide-gray-100/50"
          >
            {groups.map(group => (
              <motion.li
                key={group._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="px-4 py-3 bg-white/80 hover:bg-white transition-colors duration-150 cursor-pointer"
                onClick={() => navigate(`/groupchat/${group._id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-2.5 rounded-xl flex-shrink-0 shadow-inner">
                    <FiUsers className="text-blue-500 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{group.name}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {group.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {group.last_message 
                      ? new Date(group.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(group.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map((_, index) => (
                      <div 
                        key={index} 
                        className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-xs"
                      ></div>
                    ))}
                    {group.members.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 shadow-xs">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
};

export default GroupChatList;