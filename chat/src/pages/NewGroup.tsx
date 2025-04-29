


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUsers, FaPlus, FaArrowLeft, FaCheck, FaSearch } from 'react-icons/fa';
import api from '../api';
import { User } from '../User';

const NewGroup: React.FC = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/contacts');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const filtered = response.data.filter((user: User) => user.email !== currentUser.email);
        setContacts(filtered);
        setFilteredContacts(filtered);
      } catch (err) {
        setError('Failed to load contacts');
        console.error('Error fetching contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev =>
      prev.some(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
    setError('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length < 1) {
      setError('Please select at least one member');
      return;
    }
    try {
      setCreating(true);
      setError('');
      const response = await api.post('/api/groups/create', {
        name: groupName,
        members: selectedUsers.map(user => user.email)
      });
      setSuccess('Group created successfully!');
      setTimeout(() => {
        navigate(`/groupchat/${response.data._id}`);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error && (err as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        if (err instanceof Error && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message) {
          if (err && typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response) {
            setError((err.response as { data: { message: string } }).data.message);
          } else {
            setError('Failed to create group');
          }
        } else {
          setError('Failed to create group');
        }
      } else {
        setError('Failed to create group');
      }
      console.error('Error creating group:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen max-w-md mx-auto bg-gray-100 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
        >
          <FaArrowLeft className="text-gray-700 text-lg" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">New Group</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        {/* Group Name Input */}
        <div className="mb-6">
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setError('');
            }}
            placeholder="Enter group name"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      shadow-sm transition-all duration-200"
            maxLength={50}
          />
          <div className="text-xs text-gray-500 text-right mt-1">
            {groupName.length}/50
          </div>
        </div>

        {/* Selected Members Preview */}
        {selectedUsers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <FaUsers className="mr-2 text-gray-600" />
              <span>Selected Members ({selectedUsers.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <motion.div
                  key={user._id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full 
                            text-sm shadow-sm border border-blue-200"
                >
                  {user.name || user.email.split('@')[0]}
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="ml-2 text-blue-500 hover:text-blue-700 transition-colors duration-150"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Search Contacts */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 text-lg" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      shadow-sm transition-all duration-200"
          />
        </div>

        {/* Select Members */}
        <div>
          <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <FaUsers className="mr-2 text-gray-600" />
            <span>Contacts</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-6 font-medium">{error}</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 font-medium">
              {searchTerm ? 'No matching contacts found' : 'No contacts available'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((user) => (
                <motion.div
                  key={user._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 
                            shadow-sm border ${
                              selectedUsers.some(u => u._id === user._id)
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <div className="flex items-center flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center 
                                     overflow-hidden shadow-inner">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name || user.email} 
                               className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-600 text-lg font-medium">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white 
                                  shadow-sm ${
                                    user.status === 'online' 
                                      ? 'bg-green-500 drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]' 
                                      : 'bg-gray-400'
                                  }`}
                      ></div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.name || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user.status === 'online' ? (
                          <span className="text-green-600 font-medium">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedUsers.some(u => u._id === user._id) && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center 
                                  shadow-md">
                      <FaCheck className="text-white text-sm" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Create Button */}
      <div className="p-6 border-t bg-white sticky bottom-0 shadow-lg">
        {error && !success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mb-3 font-medium text-center"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-500 text-sm mb-3 font-medium text-center"
          >
            {success}
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: selectedUsers.length > 0 && groupName.trim() ? 1.03 : 1 }}
          whileTap={{ scale: selectedUsers.length > 0 && groupName.trim() ? 0.97 : 1 }}
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
          className={`w-full py-3.5 rounded-xl flex items-center justify-center text-white font-semibold 
                    shadow-md transition-all duration-200 ${
                      !groupName.trim() || selectedUsers.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
        >
          {creating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                   xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <FaPlus className="mr-2 text-lg" />
              Create Group
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default NewGroup;