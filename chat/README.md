Chat Application
A real-time chat application built with a modern tech stack, featuring one-to-one and group chat functionalities, powered by WebSocket for seamless communication. The app supports emoji and GIF sending, smart replies, user authentication, random username/profile image generation, and group creation.
Table of Contents


Features

One-to-One Chat: Real-time private messaging between users using WebSocket.
Group Chat: Create and participate in group conversations with multiple users.
Smart Reply: Suggested responses for quick replies (if implemented in frontend).
Emoji and GIF Support: Send emojis and search/send GIFs via GIPHY integration.
Text Messaging: Send and receive text messages with timestamp and read status.
Login/Signup: User authentication with email and password, secured with JWT.
Random Username and Profile Image: Generate random usernames and profile avatars for users.
Group Creation: Create groups, add members, and manage group chats.
Real-Time Updates: Online/offline status, typing indicators, and message deletion notifications.

Tech Stack

Frontend: React with TypeScript, React Router, Axios, Framer Motion, Emoji Picker React, Tailwind CSS
Backend: Python with Flask, Flask-Sock (WebSocket), Flask-Bcrypt, PyMongo, Flask-CORS, JWT
Database: MongoDB
External Services: GIPHY API for GIF integration
Other Tools: Lodash (debouncing), WebSocket for real-time communication

Installation
Prerequisites

Node.js (v16 or higher)
Python (v3.8 or higher)
MongoDB (local or MongoDB Atlas)
Git

Clone the Repository
git clone https://github.com/your-username/chat-app.git
cd chat-app

Frontend Setup

Navigate to the frontend directory:cd frontend


Install dependencies:npm install


Create a .env file in the frontend directory (see Environment Variables).

Backend Setup

Navigate to the backend directory:cd backend


Create a virtual environment and activate it:python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate


Install dependencies:pip install -r requirements.txt


Create a .env file in the backend directory (see Environment Variables).

MongoDB Setup

Install MongoDB locally or use MongoDB Atlas.
Ensure MongoDB is running on mongodb://localhost:27017/ or update the MONGO_URI in the backend .env file.

Environment Variables
Frontend (frontend/.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000/ws
REACT_APP_GIPHY_API_KEY=your-giphy-api-key

Backend (backend/.env)
SECRET_KEY=your-secret-key
MONGO_URI=mongodb://localhost:27017/
DB_NAME=chat_app
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
HOST=0.0.0.0
PORT=5000
DEBUG=True


SECRET_KEY: A secure key for JWT encoding/decoding.
MONGO_URI: MongoDB connection string (local or Atlas).
ALLOWED_ORIGINS: Comma-separated list of frontend URLs for CORS.
REACT_APP_GIPHY_API_KEY: Obtain from GIPHY Developers.

Running the Application

Start MongoDB:

Local: Ensure MongoDB is running (mongod).
Atlas: Verify the connection string in MONGO_URI.


Start the Backend:
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py

The backend will run on http://localhost:5000.

Start the Frontend:
cd frontend
npm start

The frontend will run on http://localhost:3000 (or 5173 if using Vite).

Open http://localhost:3000 in your browser to access the app.


API Endpoints
Authentication

POST /api/register: Register a new user (email, password).
POST /api/login: Log in and receive a JWT token (email, password).

Contacts

GET /api/contacts: Retrieve all users (contacts) with their online/offline status.

Messages

GET /api/messages/: Get messages between the authenticated user and a contact.
POST /api/messages/send: Send a message (receiver, content).
DELETE /api/messages/: Delete a message (sender only).
POST /api/messages/read: Mark messages as read (sender).

Groups

POST /api/groups/create: Create a group (name, members).
GET /api/groups: Get all groups the user is a member of.
GET /api/groups/: Get group details.
GET /api/groups//messages: Get group messages.
POST /api/groups//messages: Send a group message (content).

WebSocket Events
The WebSocket endpoint (/ws) handles real-time communication. Key events:

auth: Authenticate with a JWT token.
message: Send a one-to-one message (receiver, content).
group_message: Send a group message (group_id, content).
typing: Notify typing status (receiver, isTyping).
delete_message: Delete a message (messageId).
status_request: Request a user’s online/offline status (target).
join_group: Join a group chat (group_id).
ping/pong: Keep the connection alive.

Database Schema
Users Collection
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  status: String ("online" | "offline"),
  last_seen: Date,
  created_at: Date
}

Messages Collection
{
  _id: ObjectId,
  sender: String (email),
  receiver: String (email, for one-to-one),
  group_id: String (for group messages),
  content: String,
  timestamp: Date,
  read: Boolean (for one-to-one),
  read_by: Array<String> (for group messages)
}

Groups Collection
{
  _id: ObjectId,
  name: String,
  members: Array<String> (emails),
  created_by: String (email),
  created_at: Date,
  admins: Array<String> (emails)
}

