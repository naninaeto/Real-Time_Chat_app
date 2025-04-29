

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiCircle } from 'react-icons/fi';
import api from '../api';

interface Contact {
  _id: string;
  email: string;
  name?: string; // Added to match updated backend
  avatar?: string; // Added to match updated backend
  status: 'online' | 'offline';
  last_seen: string;
  last_seen_text?: string; // Added for human-readable last seen
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view contacts');
          navigate('/login');
          return;
        }

        const response = await api.get('/api/contacts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setContacts(response.data);
        setError(null); // Clear any previous errors on success
      } catch (err: unknown) {
        console.error('Error fetching contacts:', err);
        if (err instanceof Error && (err as import('axios').AxiosError).response) {
          const response = (err as import('axios').AxiosError).response;
          const status = response?.status;
          if (status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            navigate('/login');
          } else if (status === 500) {
            setError('Server error. Please try again later.');
          } else {
            const errorMessage = (response?.data as { message?: string })?.message || 'Unknown error';
            setError(`Error: ${errorMessage}`);
          }
        } else {
          setError('Network error. Check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-600 text-lg animate-pulse">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl mt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Contacts</h1>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl mt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Contacts</h1>
        <div className="text-gray-600 text-center">No contacts found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl mt-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Contacts</h1>
      <div className="space-y-4">
        {contacts.map(contact => (
          <Link
            key={contact._id}
            to={`/OneToOneChat/${contact.email}`}
            className="flex items-center p-4 border border-gray-200 rounded-xl 
                      bg-white hover:bg-gray-50 hover:shadow-md 
                      active:bg-gray-100 transition-all duration-200 ease-in-out 
                      group"
          >
            <div className="relative mr-4">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={`${contact.name || contact.email}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-3xl text-gray-700 group-hover:text-gray-900 
                                 transition-colors duration-200" />
              )}
              <FiCircle
                className={`absolute -bottom-0.5 -right-0.5 text-sm 
                          ${contact.status === 'online' 
                            ? 'text-green-500 drop-shadow-[0_0_4px_rgba(34,197,94,0.7)]' 
                            : 'text-gray-400'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate 
                           group-hover:text-gray-900 transition-colors duration-200">
                {contact.name || contact.email}
              </h3>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {contact.status === 'online' ? (
                  <span className="text-green-600 font-medium">Online</span>
                ) : (
                  contact.last_seen_text || `Last seen ${new Date(contact.last_seen).toLocaleString()}`
                )}
              </p>
            </div>
            <FiCircle className="text-gray-300 ml-3 shrink-0 
                               group-hover:text-gray-400 transition-colors duration-200" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Contacts;