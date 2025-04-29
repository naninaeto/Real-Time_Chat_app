

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { FaPaperPlane, FaArrowLeft, FaSmile, FaImage } from 'react-icons/fa';
import { motion } from 'framer-motion';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import axios from 'axios';

interface Message {
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
}

const generateSmartReplies = (message: string): string[] => {
  const lowerMsg = message.toLowerCase();
  
  // Greetings
  if (/^(hi|hello|hey|greetings|sup|what's up)/.test(lowerMsg)) {
    return ["Hi there!", "Hello!", "Hey!", "How are you?"];
  }

  // Questions
  if (/\?$/.test(lowerMsg)) {
    if (/how are you|how's it going/.test(lowerMsg)) {
      return ["I'm good, thanks!", "Doing well!", "Great, how about you?"];
    }
    if (/when|what time|what day/.test(lowerMsg)) {
      return ["Let me check...", "I'm not sure", "Can we schedule that?"];
    }
    if (/where/.test(lowerMsg)) {
      return ["Not sure about the location", "I'll find out", "Can you share the location?"];
    }
    return ["Good question", "I'm not sure", "Let me think about that"];
  }

  // Statements
  if (/good|great|awesome|nice|perfect|excellent/.test(lowerMsg)) {
    return ["That's great!", "Awesome!", "Glad to hear that!"];
  }
  if (/bad|terrible|sucks|awful|not good/.test(lowerMsg)) {
    return ["Sorry to hear that", "That's tough", "Can I help with anything?"];
  }

  // Default replies
  return [
    "Thanks for sharing!",
    "Interesting point!",
    "I'll get back to you on that",
    "Let me think about it",
    "Can we discuss this later?"
  ];
};

const OneToOneChat: React.FC = () => {
  const { contactEmail } = useParams<{ contactEmail: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [contactStatus, setContactStatus] = useState<'online' | 'offline'>('offline');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [lastMessageContent, setLastMessageContent] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const navigate = useNavigate();

  const WS_CONFIG = {
    BASE_URL: 'ws://localhost:5000/ws',
    RECONNECT_DELAY: 2000,
    MAX_DELAY: 30000,
    HEARTBEAT_INTERVAL: 30000,
    MAX_RETRIES: 5,
  };

  const TENOR_API_KEY = 'AIzaSyAkdQJgIJXrPVZqNXhUh3X2F5rZo-miKhU';

  const fetchMessages = useCallback(async () => {
    try {
      const [msgRes, contactRes] = await Promise.all([
        api.get(`/api/messages/${contactEmail}`),
        api.get('/api/contacts'),
      ]);
      setMessages(msgRes.data);
      if (msgRes.data.length > 0) {
        setLastMessageContent(msgRes.data[msgRes.data.length - 1].content);
      }

      interface Contact {
        email: string;
        status: 'online' | 'offline';
      }

      const contact = (contactRes.data as Contact[]).find((c) => c.email === contactEmail);
      if (contact) setContactStatus(contact.status);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [contactEmail]);

  const handleWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    ws.current = new WebSocket(`${WS_CONFIG.BASE_URL}?token=${token}`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data || !data.type) return;

        switch (data.type) {
          case 'authenticated':
            setWsStatus('connected');
            reconnectAttempts.current = 0;
            ws.current?.send(JSON.stringify({ type: 'status_request', target: contactEmail }));
            break;
          case 'message':
            if (data.sender === contactEmail) {
              setMessages((prev) => {
                const newMessages = [...prev, {
                  _id: Date.now().toString(),
                  sender: data.sender,
                  content: data.content,
                  timestamp: data.timestamp,
                }];
                setLastMessageContent(data.content);
                return newMessages;
              });
            }
            break;
          case 'typing':
            if (data.sender === contactEmail) setIsTyping(data.isTyping);
            break;
          case 'status':
            if (data.user === contactEmail) setContactStatus(data.status);
            break;
          case 'refresh':
            fetchMessages();
            break;
          case 'pong':
            break;
          default:
            console.warn('Unhandled message type:', data.type);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setWsStatus('disconnected');
    };

    ws.current.onclose = () => {
      setWsStatus('disconnected');
      if (reconnectAttempts.current < WS_CONFIG.MAX_RETRIES) {
        const delay = Math.min(WS_CONFIG.RECONNECT_DELAY * 2 ** reconnectAttempts.current, WS_CONFIG.MAX_DELAY);
        setTimeout(() => {
          reconnectAttempts.current++;
          handleWebSocket();
        }, delay);
      }
    };
  }, [contactEmail, fetchMessages]);

  const sendTyping = useCallback((typing: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || wsStatus !== 'connected') return;
    ws.current.send(JSON.stringify({
      type: 'typing',
      receiver: contactEmail,
      isTyping: typing,
    }));
  }, [contactEmail, wsStatus]);

  const sendMessage = async (content?: string) => {
    const messageToSend = content || newMessage.trim();
    if (!messageToSend) return;

    const msg = {
      _id: Date.now().toString(),
      sender: currentUser.email,
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    setLastMessageContent(messageToSend);
    sendTyping(false);

    try {
      if (ws.current?.readyState === WebSocket.OPEN && wsStatus === 'connected') {
        ws.current.send(JSON.stringify({
          type: 'message',
          receiver: contactEmail,
          content: messageToSend,
        }));
      } else {
        await api.post('/api/messages/send', {
          receiver: contactEmail,
          content: messageToSend,
        });
      }
      if (!content) setNewMessage('');
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowSmartReplies(false);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const fetchGifs = async (query: string) => {
    try {
      const response = await axios.get(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${query}&limit=10`
      );
      interface GifMedia {
        media_formats: {
          gif: {
            url: string;
          };
        };
      }
      const gifUrls = response.data.results.map((gif: GifMedia) => gif.media_formats.gif.url);
      setGifs(gifUrls);
    } catch (err) {
      console.error('Failed to fetch Tenor GIFs:', err);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    sendMessage(gifUrl);
  };

  const handleSmartReply = (reply: string) => {
    sendMessage(reply);
  };

  useEffect(() => {
    fetchMessages();
    handleWebSocket();

    const interval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN && wsStatus === 'connected') {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);

    return () => {
      ws.current?.close();
      clearInterval(interval);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [contactEmail, fetchMessages, handleWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Show smart replies when a new message is received from the contact
    if (messages.length > 0 && 
        messages[messages.length - 1].sender === contactEmail &&
        !messages[messages.length - 1].content.startsWith('http')) {
      const lastMsg = messages[messages.length - 1].content;
      setSmartReplies(generateSmartReplies(lastMsg));
      setShowSmartReplies(true);
    }
  }, [messages]);

  useEffect(() => {
    if (newMessage.length > 0) {
      sendTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    } else {
      sendTyping(false);
    }
  }, [newMessage]);

  if (loading) return <div className="text-center py-8">Loading chat...</div>;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <button onClick={() => navigate(-1)} className="mr-3 hover:scale-105 transition">
          <FaArrowLeft className="text-lg" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm shadow">
            {contactEmail?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{contactEmail}</h2>
            <p className="text-xs">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  contactStatus === 'online' ? 'bg-green-300' : 'bg-gray-300'
                }`}
              ></span>
              {contactStatus} {isTyping && '• typing...'} {wsStatus !== 'connected' && '• reconnecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <motion.div
            key={msg._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === currentUser.email ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow ${
                msg.sender === currentUser.email
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.content.startsWith('http') && msg.content.includes('tenor.com') ? (
                <img src={msg.content} alt="GIF" className="max-w-full rounded" />
              ) : (
                <p>{msg.content}</p>
              )}
              <span className="absolute text-[10px] bottom-[-18px] text-gray-400 right-2">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}
        
        {/* Typing Indicator in Chat Area */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none shadow-md max-w-[70%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{contactEmail} is typing...</p>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {showSmartReplies && (
        <div className="px-4 py-2 bg-gray-50 border-t flex overflow-x-auto space-x-2">
          {smartReplies
            .filter(reply => reply.toLowerCase() !== lastMessageContent.toLowerCase())
            .slice(0, 4)
            .map((reply, index) => (
              <button
                key={index}
                onClick={() => handleSmartReply(reply)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm whitespace-nowrap hover:bg-gray-100"
              >
                {reply}
              </button>
            ))}
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-4 bg-white relative">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-gray-600 hover:text-blue-500 transition"
          >
            <FaSmile size={20} />
          </button>
          <button
            onClick={() => {
              setShowGifPicker((prev) => !prev);
              if (!gifQuery) fetchGifs('funny');
            }}
            className="text-gray-600 hover:text-blue-500 transition"
          >
            <FaImage size={20} />
          </button>
          <input
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              sendTyping(true);
              if (typingTimeout.current) clearTimeout(typingTimeout.current);
              typingTimeout.current = setTimeout(() => sendTyping(false), 2000);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {/* GIF Picker (Tenor) */}
        {showGifPicker && (
          <div className="absolute bottom-16 left-4 w-80 bg-white shadow-lg rounded-lg p-4 z-10 max-h-64 overflow-y-auto">
            <input
              type="text"
              value={gifQuery}
              onChange={(e) => {
                setGifQuery(e.target.value);
                if (e.target.value) fetchGifs(e.target.value);
              }}
              placeholder="Search Tenor GIFs..."
              className="w-full border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif, index) => (
                <img
                  key={index}
                  src={gif}
                  alt="GIF"
                  className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => handleGifSelect(gif)}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Powered by Tenor</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneToOneChat;