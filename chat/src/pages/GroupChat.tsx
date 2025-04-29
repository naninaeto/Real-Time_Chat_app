

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

const getColor = (email: string) => {
  const colors = ['bg-red-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'];
  const index = email.charCodeAt(0) % colors.length;
  return colors[index];
};

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

  // Suggestions
  if (/let's|we should|how about|what about/.test(lowerMsg)) {
    return ["Sounds good!", "Great idea!", "I'm in!"];
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

const GroupChat: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [groupName, setGroupName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [typingMembers, setTypingMembers] = useState<Set<string>>(new Set());
  const [lastMessageContent, setLastMessageContent] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectAttempts = useRef(0);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const WS_CONFIG = {
    BASE_URL: 'ws://localhost:5000/ws',
    RECONNECT_DELAY: 2000,
    MAX_DELAY: 30000,
    HEARTBEAT_INTERVAL: 30000,
    MAX_RETRIES: 5,
  };

  const GIPHY_API_KEY = '3nYxQhkBi5KRbsU4IPIKR0plvMWFjvCa';

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get(`/api/groups/${groupId}/messages`);
      setMessages(response.data);
      if (response.data.length > 0) {
        setLastMessageContent(response.data[response.data.length - 1].content);
      }
    } catch (err) {
      console.error('Failed to fetch group messages:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchGroupDetails = useCallback(async () => {
    try {
      const response = await api.get(`/api/groups/${groupId}`);
      setGroupName(response.data.name);
      setMemberCount(response.data.members.length);
    } catch (err) {
      console.error('Failed to fetch group details:', err);
    }
  }, [groupId]);

  const fetchGifs = async (query: string) => {
    try {
      const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: query,
          limit: 10,
          rating: 'g',
          lang: 'en',
        },
      });
      interface GifData {
        images: {
          fixed_height: {
            url: string;
          };
        };
      }
      const gifUrls = res.data.data.map((gif: GifData) => gif.images.fixed_height.url);
      setGifs(gifUrls);
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
    }
  };

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
            ws.current?.send(JSON.stringify({ type: 'join_group', group_id: groupId }));
            break;
          case 'group_message':
            if (data.message.group_id === groupId) {
              setMessages((prev) => {
                const newMessages = [...prev, {
                  _id: data.message._id,
                  sender: data.message.sender,
                  content: data.message.content,
                  timestamp: data.message.timestamp,
                }];
                setLastMessageContent(data.message.content);
                return newMessages;
              });
            }
            break;
          case 'typing':
            if (data.group_id === groupId) {
              setTypingMembers(prev => {
                const newSet = new Set(prev);
                if (data.isTyping) {
                  newSet.add(data.sender);
                } else {
                  newSet.delete(data.sender);
                }
                return newSet;
              });
            }
            break;
          case 'pong':
            break;
          case 'error':
            console.error('WebSocket error from server:', data.message);
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
  }, [groupId]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'typing',
        group_id: groupId,
        isTyping: isTyping
      }));
    }
  }, [groupId]);

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
    sendTypingStatus(false);

    try {
      if (ws.current?.readyState === WebSocket.OPEN && wsStatus === 'connected') {
        ws.current.send(JSON.stringify({
          type: 'group_message',
          group_id: groupId,
          content: messageToSend,
        }));
      } else {
        await api.post(`/api/groups/${groupId}/messages`, { content: messageToSend });
      }
      if (!content) setNewMessage('');
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowSmartReplies(false);
    } catch (err) {
      console.error('Send failed:', err);
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
    fetchGroupDetails();
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
  }, [fetchMessages, fetchGroupDetails, handleWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Show smart replies when a new message is received that's not from the current user
    if (messages.length > 0 && 
        messages[messages.length - 1].sender !== currentUser.email &&
        !messages[messages.length - 1].content.startsWith('http')) {
      const lastMsg = messages[messages.length - 1].content;
      setSmartReplies(generateSmartReplies(lastMsg));
      setShowSmartReplies(true);
    }
  }, [messages]);

  useEffect(() => {
    if (newMessage.length > 0) {
      sendTypingStatus(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else {
      sendTypingStatus(false);
    }
  }, [newMessage]);

  const typingIndicatorText = () => {
    const typingArray = Array.from(typingMembers).filter(member => member !== currentUser.email);
    
    if (typingArray.length === 0) return null;
    if (typingArray.length === 1) return `${typingArray[0]} is typing...`;
    if (typingArray.length === 2) return `${typingArray[0]} and ${typingArray[1]} are typing...`;
    return `${typingArray[0]}, ${typingArray[1]} and others are typing...`;
  };

  if (loading) return <div className="text-center py-8">Loading group chat...</div>;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="font-bold text-lg">{groupName || `Group Chat: ${groupId}`}</h2>
            <p className="text-sm text-gray-500">
              {memberCount} member{memberCount !== 1 && 's'} {wsStatus !== 'connected' && '• reconnecting...'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isSelf = msg.sender === currentUser.email;
          return (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
            >
              {!isSelf && (
                <div className="text-xs font-semibold text-gray-600 mb-1 ml-1 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getColor(msg.sender)}`} />
                  {msg.sender}
                </div>
              )}
              <div
                className={`rounded-xl px-4 py-2 max-w-[75%] shadow-md ${
                  isSelf ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content.startsWith('http') && msg.content.includes('giphy.com') ? (
                  <img src={msg.content} alt="GIF" className="max-w-full rounded" />
                ) : (
                  <p className="break-words">{msg.content}</p>
                )}
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          );
        })}
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

      {/* Typing Indicator */}
      {typingIndicatorText() && (
        <div className="px-4 py-1 bg-gray-50 border-t text-sm text-gray-500">
          {typingIndicatorText()}
        </div>
      )}

      <div className="border-t p-4 relative">
        <div className="flex gap-2">
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
            className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition"
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

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="absolute bottom-16 left-4 w-80 bg-white shadow-lg rounded-lg p-4 z-10 max-h-64 overflow-y-auto">
            <input
              type="text"
              value={gifQuery}
              onChange={(e) => {
                setGifQuery(e.target.value);
                if (e.target.value) fetchGifs(e.target.value);
              }}
              placeholder="Search GIPHY GIFs..."
              className="w-full border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif, idx) => (
                <img
                  key={idx}
                  src={gif}
                  alt="GIF"
                  className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => handleGifSelect(gif)}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Powered by GIPHY</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;


// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../api';
// import { FaPaperPlane, FaArrowLeft, FaSmile, FaImage, FaLaugh } from 'react-icons/fa';
// import { motion } from 'framer-motion';
// import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
// import axios from 'axios';

// interface Message {
//   _id: string;
//   sender: string;
//   content: string;
//   timestamp: string;
//   type?: string; // Added to support meme messages
//   image_url?: string; // Added for meme image URL
// }

// const getColor = (email: string) => {
//   const colors = ['bg-red-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'];
//   const index = email.charCodeAt(0) % colors.length;
//   return colors[index];
// };

// const generateSmartReplies = (message: string): string[] => {
//   const lowerMsg = message.toLowerCase();
  
//   if (/^(hi|hello|hey|greetings|sup|what's up)/.test(lowerMsg)) {
//     return ["Hi there!", "Hello!", "Hey!", "How are you?"];
//   }

//   if (/\?$/.test(lowerMsg)) {
//     if (/how are you|how's it going/.test(lowerMsg)) {
//       return ["I'm good, thanks!", "Doing well!", "Great, how about you?"];
//     }
//     if (/when|what time|what day/.test(lowerMsg)) {
//       return ["Let me check...", "I'm not sure", "Can we schedule that?"];
//     }
//     if (/where/.test(lowerMsg)) {
//       return ["Not sure about the location", "I'll find out", "Can you share the location?"];
//     }
//     return ["Good question", "I'm not sure", "Let me think about that"];
//   }

//   if (/good|great|awesome|nice|perfect|excellent/.test(lowerMsg)) {
//     return ["That's great!", "Awesome!", "Glad to hear that!"];
//   }
//   if (/bad|terrible|sucks|awful|not good/.test(lowerMsg)) {
//     return ["Sorry to hear that", "That's tough", "Can I help with anything?"];
//   }

//   if (/let's|we should|how about|what about/.test(lowerMsg)) {
//     return ["Sounds good!", "Great idea!", "I'm in!"];
//   }

//   return [
//     "Thanks for sharing!",
//     "Interesting point!",
//     "I'll get back to you on that",
//     "Let me think about it",
//     "Can we discuss this later?"
//   ];
// };

// const GroupChat: React.FC = () => {
//   const { groupId } = useParams<{ groupId: string }>();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
//   const [groupName, setGroupName] = useState('');
//   const [memberCount, setMemberCount] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showGifPicker, setShowGifPicker] = useState(false);
//   const [gifQuery, setGifQuery] = useState('');
//   const [gifs, setGifs] = useState<string[]>([]);
//   const [showSmartReplies, setShowSmartReplies] = useState(false);
//   const [smartReplies, setSmartReplies] = useState<string[]>([]);
//   const [typingMembers, setTypingMembers] = useState<Set<string>>(new Set());
//   const [lastMessageContent, setLastMessageContent] = useState('');
//   const [showMemePicker, setShowMemePicker] = useState(false); // Added for meme picker
//   const [memePrompt, setMemePrompt] = useState(''); // Added for meme prompt input

//   const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
//   const ws = useRef<WebSocket | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const reconnectAttempts = useRef(0);
//   const typingTimeout = useRef<NodeJS.Timeout | null>(null);
//   const navigate = useNavigate();

//   const WS_CONFIG = {
//     BASE_URL: 'ws://localhost:5000/ws',
//     RECONNECT_DELAY: 2000,
//     MAX_DELAY: 30000,
//     HEARTBEAT_INTERVAL: 30000,
//     MAX_RETRIES: 5,
//   };

//   const GIPHY_API_KEY = '3nYxQhkBi5KRbsU4IPIKR0plvMWFjvCa';

//   const fetchMessages = useCallback(async () => {
//     try {
//       const response = await api.get(`/api/groups/${groupId}/messages`);
//       setMessages(response.data);
//       if (response.data.length > 0) {
//         setLastMessageContent(response.data[response.data.length - 1].content);
//       }
//     } catch (err) {
//       console.error('Failed to fetch group messages:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [groupId]);

//   const fetchGroupDetails = useCallback(async () => {
//     try {
//       const response = await api.get(`/api/groups/${groupId}`);
//       setGroupName(response.data.name);
//       setMemberCount(response.data.members.length);
//     } catch (err) {
//       console.error('Failed to fetch group details:', err);
//     }
//   }, [groupId]);

//   const fetchGifs = async (query: string) => {
//     try {
//       const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
//         params: {
//           api_key: GIPHY_API_KEY,
//           q: query,
//           limit: 10,
//           rating: 'g',
//           lang: 'en',
//         },
//       });
//       interface GifData {
//         images: {
//           fixed_height: {
//             url: string;
//           };
//         };
//       }
//       const gifUrls = res.data.data.map((gif: GifData) => gif.images.fixed_height.url);
//       setGifs(gifUrls);
//     } catch (err) {
//       console.error('Failed to fetch GIFs:', err);
//     }
//   };

//   const handleWebSocket = useCallback(() => {
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     ws.current = new WebSocket(`${WS_CONFIG.BASE_URL}?token=${token}`);

//     ws.current.onopen = () => {
//       ws.current?.send(JSON.stringify({ type: 'auth', token }));
//     };

//     ws.current.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (!data || !data.type) return;

//         switch (data.type) {
//           case 'authenticated':
//             setWsStatus('connected');
//             reconnectAttempts.current = 0;
//             ws.current?.send(JSON.stringify({ type: 'join_group', group_id: groupId }));
//             break;
//           case 'group_message':
//             if (data.message.group_id === groupId) {
//               setMessages((prev) => {
//                 const newMessages = [...prev, {
//                   _id: data.message._id,
//                   sender: data.message.sender,
//                   content: data.message.content,
//                   timestamp: data.message.timestamp,
//                 }];
//                 setLastMessageContent(data.message.content);
//                 return newMessages;
//               });
//             }
//             break;
//           case 'meme_message': // Added to handle meme messages
//             if (data.message.group_id === groupId) {
//               setMessages((prev) => [...prev, {
//                 _id: data.message._id,
//                 sender: data.message.sender,
//                 content: data.message.content,
//                 image_url: data.message.image_url,
//                 type: data.message.type,
//                 timestamp: data.message.timestamp,
//               }]);
//             }
//             break;
//           case 'typing':
//             if (data.group_id === groupId) {
//               setTypingMembers(prev => {
//                 const newSet = new Set(prev);
//                 if (data.isTyping) {
//                   newSet.add(data.sender);
//                 } else {
//                   newSet.delete(data.sender);
//                 }
//                 return newSet;
//               });
//             }
//             break;
//           case 'pong':
//             break;
//           case 'error':
//             console.error('WebSocket error from server:', data.message);
//             break;
//           default:
//             console.warn('Unhandled message type:', data.type);
//         }
//       } catch (err) {
//         console.error('WS parse error:', err);
//       }
//     };

//     ws.current.onerror = (err) => {
//       console.error('WebSocket error:', err);
//       setWsStatus('disconnected');
//     };

//     ws.current.onclose = () => {
//       setWsStatus('disconnected');
//       if (reconnectAttempts.current < WS_CONFIG.MAX_RETRIES) {
//         const delay = Math.min(WS_CONFIG.RECONNECT_DELAY * 2 ** reconnectAttempts.current, WS_CONFIG.MAX_DELAY);
//         setTimeout(() => {
//           reconnectAttempts.current++;
//           handleWebSocket();
//         }, delay);
//       }
//     };
//   }, [groupId]);

//   const sendTypingStatus = useCallback((isTyping: boolean) => {
//     if (ws.current?.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify({
//         type: 'typing',
//         group_id: groupId,
//         isTyping: isTyping
//       }));
//     }
//   }, [groupId]);

//   const sendMessage = async (content?: string) => {
//     const messageToSend = content || newMessage.trim();
//     if (!messageToSend) return;

//     const msg = {
//       _id: Date.now().toString(),
//       sender: currentUser.email,
//       content: messageToSend,
//       timestamp: new Date().toISOString(),
//     };

//     setMessages((prev) => [...prev, msg]);
//     setLastMessageContent(messageToSend);
//     sendTypingStatus(false);

//     try {
//       if (ws.current?.readyState === WebSocket.OPEN && wsStatus === 'connected') {
//         ws.current.send(JSON.stringify({
//           type: 'group_message',
//           group_id: groupId,
//           content: messageToSend,
//         }));
//       } else {
//         await api.post(`/api/groups/${groupId}/messages`, { content: messageToSend });
//       }
//       if (!content) setNewMessage('');
//       setShowEmojiPicker(false);
//       setShowGifPicker(false);
//       setShowSmartReplies(false);
//     } catch (err) {
//       console.error('Send failed:', err);
//     }
//   };

//   const sendMeme = async () => { // Added function to send memes
//     if (!memePrompt.trim()) return;

//     try {
//       const response = await api.post(`/api/memes/generate`, {
//         prompt: memePrompt,
//         group_id: groupId,
//       });
//       const memeMessage = response.data;
//       setMessages((prev) => [...prev, memeMessage]);
//       setMemePrompt('');
//       setShowMemePicker(false);
//     } catch (err) {
//       console.error('Failed to generate meme:', err);
//     }
//   };

//   const handleEmojiClick = (emojiData: EmojiClickData) => {
//     setNewMessage((prev) => prev + emojiData.emoji);
//     setShowEmojiPicker(false);
//   };

//   const handleGifSelect = (gifUrl: string) => {
//     sendMessage(gifUrl);
//   };

//   const handleSmartReply = (reply: string) => {
//     sendMessage(reply);
//   };

//   useEffect(() => {
//     fetchMessages();
//     fetchGroupDetails();
//     handleWebSocket();

//     const interval = setInterval(() => {
//       if (ws.current?.readyState === WebSocket.OPEN && wsStatus === 'connected') {
//         ws.current.send(JSON.stringify({ type: 'ping' }));
//       }
//     }, WS_CONFIG.HEARTBEAT_INTERVAL);

//     return () => {
//       ws.current?.close();
//       clearInterval(interval);
//       if (typingTimeout.current) clearTimeout(typingTimeout.current);
//     };
//   }, [fetchMessages, fetchGroupDetails, handleWebSocket]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
//     if (messages.length > 0 && 
//         messages[messages.length - 1].sender !== currentUser.email &&
//         !messages[messages.length - 1].content.startsWith('http')) {
//       const lastMsg = messages[messages.length - 1].content;
//       setSmartReplies(generateSmartReplies(lastMsg));
//       setShowSmartReplies(true);
//     }
//   }, [messages]);

//   useEffect(() => {
//     if (newMessage.length > 0) {
//       sendTypingStatus(true);
//       if (typingTimeout.current) clearTimeout(typingTimeout.current);
//       typingTimeout.current = setTimeout(() => {
//         sendTypingStatus(false);
//       }, 2000);
//     } else {
//       sendTypingStatus(false);
//     }
//   }, [newMessage]);

//   const typingIndicatorText = () => {
//     const typingArray = Array.from(typingMembers).filter(member => member !== currentUser.email);
    
//     if (typingArray.length === 0) return null;
//     if (typingArray.length === 1) return `${typingArray[0]} is typing...`;
//     if (typingArray.length === 2) return `${typingArray[0]} and ${typingArray[1]} are typing...`;
//     return `${typingArray[0]}, ${typingArray[1]} and others are typing...`;
//   };

//   if (loading) return <div className="text-center py-8">Loading group chat...</div>;

//   return (
//     <div className="flex flex-col h-screen max-w-md mx-auto">
//       <div className="p-4 border-b flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <button onClick={() => navigate(-1)}>
//             <FaArrowLeft />
//           </button>
//           <div>
//             <h2 className="font-bold text-lg">{groupName || `Group Chat: ${groupId}`}</h2>
//             <p className="text-sm text-gray-500">
//               {memberCount} member{memberCount !== 1 && 's'} {wsStatus !== 'connected' && '• reconnecting...'}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 p-4 overflow-y-auto space-y-3">
//         {messages.map((msg) => {
//           const isSelf = msg.sender === currentUser.email;
//           return (
//             <motion.div
//               key={msg._id}
//               initial={{ opacity: 0, y: 8 }}
//               animate={{ opacity: 1, y: 0 }}
//               className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
//             >
//               {!isSelf && (
//                 <div className="text-xs font-semibold text-gray-600 mb-1 ml-1 flex items-center gap-1">
//                   <div className={`w-2 h-2 rounded-full ${getColor(msg.sender)}`} />
//                   {msg.sender}
//                 </div>
//               )}
//               <div
//                 className={`rounded-xl px-4 py-2 max-w-[75%] shadow-md ${
//                   isSelf ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
//                 }`}
//               >
//                 {msg.type === 'meme' ? ( // Added handling for meme messages
//                   <div>
//                     <p className="text-sm italic mb-1">{msg.content}</p>
//                     <img src={msg.image_url} alt="Meme" className="max-w-full rounded" />
//                   </div>
//                 ) : msg.content.startsWith('http') && msg.content.includes('giphy.com') ? (
//                   <img src={msg.content} alt="GIF" className="max-w-full rounded" />
//                 ) : (
//                   <p className="break-words">{msg.content}</p>
//                 )}
//                 <p className="text-[10px] text-gray-400 text-right mt-1">
//                   {new Date(msg.timestamp).toLocaleTimeString()}
//                 </p>
//               </div>
//             </motion.div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {showSmartReplies && (
//         <div className="px-4 py-2 bg-gray-50 border-t flex overflow-x-auto space-x-2">
//           {smartReplies
//             .filter(reply => reply.toLowerCase() !== lastMessageContent.toLowerCase())
//             .slice(0, 4)
//             .map((reply, index) => (
//               <button
//                 key={index}
//                 onClick={() => handleSmartReply(reply)}
//                 className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm whitespace-nowrap hover:bg-gray-100"
//               >
//                 {reply}
//               </button>
//             ))}
//         </div>
//       )}

//       {typingIndicatorText() && (
//         <div className="px-4 py-1 bg-gray-50 border-t text-sm text-gray-500">
//           {typingIndicatorText()}
//         </div>
//       )}

//       <div className="border-t p-4 relative">
//         <div className="flex gap-2">
//           <button
//             onClick={() => setShowEmojiPicker((prev) => !prev)}
//             className="text-gray-600 hover:text-blue-500 transition"
//           >
//             <FaSmile size={20} />
//           </button>
//           <button
//             onClick={() => {
//               setShowGifPicker((prev) => !prev);
//               if (!gifQuery) fetchGifs('funny');
//             }}
//             className="text-gray-600 hover:text-blue-500 transition"
//           >
//             <FaImage size={20} />
//           </button>
//           <button // Added meme button
//             onClick={() => setShowMemePicker((prev) => !prev)}
//             className="text-gray-600 hover:text-blue-500 transition"
//           >
//             <FaLaugh size={20} />
//           </button>
//           <input
//             className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Type a message..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') {
//                 e.preventDefault();
//                 sendMessage();
//               }
//             }}
//           />
//           <button
//             onClick={() => sendMessage()}
//             disabled={!newMessage.trim()}
//             className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition"
//           >
//             <FaPaperPlane />
//           </button>
//         </div>

//         {showEmojiPicker && (
//           <div className="absolute bottom-16 left-4 z-10">
//             <EmojiPicker onEmojiClick={handleEmojiClick} />
//           </div>
//         )}

//         {showGifPicker && (
//           <div className="absolute bottom-16 left-4 w-80 bg-white shadow-lg rounded-lg p-4 z-10 max-h-64 overflow-y-auto">
//             <input
//               type="text"
//               value={gifQuery}
//               onChange={(e) => {
//                 setGifQuery(e.target.value);
//                 if (e.target.value) fetchGifs(e.target.value);
//               }}
//               placeholder="Search GIPHY GIFs..."
//               className="w-full border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <div className="grid grid-cols-2 gap-2">
//               {gifs.map((gif, idx) => (
//                 <img
//                   key={idx}
//                   src={gif}
//                   alt="GIF"
//                   className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
//                   onClick={() => handleGifSelect(gif)}
//                 />
//               ))}
//             </div>
//             <p className="text-xs text-gray-500 mt-2 text-center">Powered by GIPHY</p>
//           </div>
//         )}

//         {showMemePicker && ( // Added meme picker UI
//           <div className="absolute bottom-16 left-4 w-80 bg-white shadow-lg rounded-lg p-4 z-10">
//             <input
//               type="text"
//               value={memePrompt}
//               onChange={(e) => setMemePrompt(e.target.value)}
//               placeholder="Describe your meme (e.g., 'Funny cat fails')..."
//               className="w-full border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <button
//               onClick={sendMeme}
//               disabled={!memePrompt.trim()}
//               className="w-full bg-blue-500 text-white py-1 rounded disabled:opacity-50 hover:bg-blue-600 transition"
//             >
//               Generate Meme
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GroupChat;
