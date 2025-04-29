


import React, { useState } from 'react';
import { FiEdit, FiMail, FiCamera, FiSave } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onAvatarUpdate?: (newAvatar: string) => void;
  onUsernameUpdate?: (newUsername: string) => void; // Added for username updates
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onAvatarUpdate, onUsernameUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar);
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState<string>(user.name); // State for editable username
  const [isEditingUsername, setIsEditingUsername] = useState(false); // Toggle edit mode

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG, or GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should not exceed 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setAvatarPreview(data.avatar);
        if (onAvatarUpdate) onAvatarUpdate(data.avatar);
        localStorage.setItem('user', JSON.stringify({ ...user, avatar: data.avatar })); // Update local storage
        alert('Avatar updated successfully!');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Failed to upload avatar: ${errorMessage}`);
      setAvatarPreview(user.avatar);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleUsernameSave = async () => {
    if (!username || username.length < 3) {
      alert('Username must be at least 3 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/username', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        if (onUsernameUpdate) onUsernameUpdate(username);
        localStorage.setItem('user', JSON.stringify({ ...user, name: username })); // Update local storage
        alert('Username updated successfully!');
        setIsEditingUsername(false);
      } else {
        throw new Error(data.message || 'Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Failed to update username: ${errorMessage}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <div className="relative">
            <img
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
              src={avatarPreview}
              alt="User Avatar"
            />
            <motion.label
              htmlFor="avatar-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered && !isUploading ? 1 : 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer"
            >
              {isUploading ? (
                <span className="text-white text-sm">Uploading...</span>
              ) : (
                <FiCamera className="text-white text-2xl" />
              )}
            </motion.label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </div>
        </motion.div>
      </div>
      <div className="pt-20 px-6 pb-6">
        <div className="text-center mb-6">
          {isEditingUsername ? (
            <div className="flex items-center justify-center space-x-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-2xl font-bold text-gray-800 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleUsernameSave}
                className="text-blue-600 hover:text-blue-800"
              >
                <FiSave size={20} />
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingUsername(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <FiEdit size={20} />
              </motion.button>
            </div>
          )}
          <p className="text-gray-600 flex items-center justify-center mt-2">
            <FiMail className="mr-2" /> {user.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
