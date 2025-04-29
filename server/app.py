from flask import Flask, request, jsonify, make_response
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from datetime import datetime, timedelta
from bson import ObjectId
from functools import wraps
import os
from dotenv import load_dotenv
import jwt
from flask_sock import Sock
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
sock = Sock(app)  # Initialize WebSocket

# Load allowed origins dynamically from .env
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(",")

# Enable CORS globally with dynamic origins
CORS(app, supports_credentials=True, origins=allowed_origins)

# Secret key for JWT
# app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', '2f9d0558e4064086850082bdb6440db0')


# Database configuration
bcrypt = Bcrypt(app)
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client[os.getenv('DB_NAME', 'chat_app')]
users_collection = db["users"]
messages_collection = db["messages"]
groups_collection = db["groups"]
active_connections = {}  # Track active WebSocket connections {email: {'ws': ws, 'groups': set()}}

# Middleware to handle CORS headers dynamically
@app.after_request
def apply_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Preflight response helper
@app.route("/api/<path:path>", methods=["OPTIONS"])
def options_preflight(path):
    response = make_response("", 204)  # No content for preflight
    origin = request.headers.get("Origin")
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

# Helper decorator for error handling
def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            app.logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    return wrapper

# JWT authentication middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        try:
            if token.startswith("Bearer "):
                token = token.split(" ")[1]
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            request.user_email = payload['email']  # Add user email to request object
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

# Login route
@app.route("/api/login", methods=["POST"])
@handle_errors
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user["password"], password):
        users_collection.update_one(
            {"email": email},
            {"$set": {"status": "online", "last_seen": datetime.utcnow()}}
        )
        
        token = jwt.encode({
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "message": "Login successful", 
            "token": token, 
            "user": {"email": user["email"], "status": "online"}
        }), 200
    return jsonify({"message": "Invalid email or password"}), 401

# Register route
@app.route("/api/register", methods=["POST"])
@handle_errors
def register():
    data = request.get_json()
    email = str(data.get("email"))
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    users_collection.insert_one({
        "email": email, 
        "password": hashed_password, 
        "status": "offline",
        "last_seen": datetime.utcnow(),
        "created_at": datetime.utcnow()
    })
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route("/api/contacts", methods=["GET"])
@token_required
@handle_errors
def get_contacts():
    contacts = list(users_collection.find(
        {"email": {"$ne": request.user_email}},
        {"password": 0}
    ).sort("status", -1))
    
    for contact in contacts:
        contact["_id"] = str(contact["_id"])
        for key, value in list(contact.items()):
            if isinstance(value, bytes):
                app.logger.info(f"Found bytes in field {key}: {value}")
                try:
                    contact[key] = value.decode('utf-8')
                except UnicodeDecodeError:
                    app.logger.warning(f"UTF-8 decode failed for {key}: {value}, using hex")
                    contact[key] = value.hex()
        
        last_seen = contact.get("last_seen", datetime.utcnow())
        time_diff = datetime.utcnow() - last_seen
        if time_diff < timedelta(minutes=1):
            contact["last_seen_text"] = "just now"
        elif time_diff < timedelta(hours=1):
            mins = int(time_diff.total_seconds() / 60)
            contact["last_seen_text"] = f"{mins} min ago"
        elif time_diff < timedelta(days=1):
            hours = int(time_diff.total_seconds() / 3600)
            contact["last_seen_text"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(time_diff.total_seconds() / 86400)
            contact["last_seen_text"] = f"{days} day{'s' if days > 1 else ''} ago"
    
    return jsonify(contacts), 200

# Get messages between users
@app.route("/api/messages/<contact_email>", methods=["GET"])
@token_required
@handle_errors
def get_messages(contact_email):
    if not users_collection.find_one({"email": contact_email}):
        return jsonify({"message": "Contact not found"}), 404
    
    messages = list(messages_collection.find({
        "$or": [
            {"sender": request.user_email, "receiver": contact_email},
            {"sender": contact_email, "receiver": request.user_email}
        ]
    }).sort("timestamp", 1))
    
    for message in messages:
        message["_id"] = str(message["_id"])
        message["timestamp"] = message["timestamp"].isoformat()
    
    return jsonify(messages), 200

# Send message
@app.route("/api/messages/send", methods=["POST"])
@token_required
@handle_errors
def send_message():
    data = request.get_json()
    receiver = data.get("receiver")
    content = data.get("content")
    
    if not receiver or not content:
        return jsonify({"message": "Receiver and content are required"}), 400
    
    if not users_collection.find_one({"email": receiver}):
        return jsonify({"message": "Receiver not found"}), 404
    
    message = {
        "sender": request.user_email,
        "receiver": receiver,
        "content": content,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    result = messages_collection.insert_one(message)
    message["_id"] = str(result.inserted_id)
    message["timestamp"] = message["timestamp"].isoformat()
    
    users_collection.update_one(
        {"email": request.user_email},
        {"$set": {"last_seen": datetime.utcnow()}}
    )
    
    if receiver in active_connections:
        try:
            active_connections[receiver]['ws'].send(json.dumps({
                "type": "message",
                "sender": request.user_email,
                "content": content,
                "timestamp": message["timestamp"]
            }))
            messages_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"read": True}}
            )
        except Exception as e:
            print(f"Failed to send WebSocket message: {e}")
    
    return jsonify(message), 201

# WebSocket endpoint for real-time communication
@sock.route('/ws')
def websocket(ws):
    user_email = None
    joined_groups = set()  # Track groups this client has joined
    
    try:
        # Expect first message to be auth
        token_data = ws.receive()
        try:
            token_msg = json.loads(token_data)
            if token_msg.get('type') != 'auth' or not token_msg.get('token'):
                print("Invalid initial message: Auth required")
                ws.send(json.dumps({"type": "error", "message": "Authentication required"}))
                ws.close()
                return
            token = token_msg['token']
        except json.JSONDecodeError:
            print("Invalid JSON in initial message")
            ws.send(json.dumps({"type": "error", "message": "Invalid auth format"}))
            ws.close()
            return

        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_email = payload['email']
        
        user = users_collection.find_one({"email": user_email})
        if not user:
            print(f"User {user_email} not found")
            ws.send(json.dumps({"type": "error", "message": "User not found"}))
            ws.close()
            return
        
        # Authentication successful
        users_collection.update_one(
            {"email": user_email},
            {"$set": {"status": "online", "last_seen": datetime.utcnow()}}
        )
        active_connections[user_email] = {'ws': ws, 'groups': joined_groups}
        ws.send(json.dumps({"type": "authenticated", "message": "Connection established"}))

        notify_contacts(user_email, "online")
        
        while True:
            data = ws.receive()
            if not data:
                break
                
            try:
                message = json.loads(data)
                msg_type = message.get('type')
                
                if msg_type == 'typing':
                    receiver = message.get('receiver')
                    if receiver in active_connections:
                        active_connections[receiver]['ws'].send(json.dumps({
                            "type": "typing",
                            "sender": user_email,
                            "isTyping": message['isTyping']
                        }))
                elif msg_type == 'message':
                    receiver = message.get('receiver')
                    content = message.get('content')
                    if receiver and content:
                        msg = {
                            "sender": user_email,
                            "receiver": receiver,
                            "content": content,
                            "timestamp": datetime.utcnow(),
                            "read": False
                        }
                        result = messages_collection.insert_one(msg)
                        msg["_id"] = str(result.inserted_id)
                        msg["timestamp"] = msg["timestamp"].isoformat()
                        if receiver in active_connections:
                            active_connections[receiver]['ws'].send(json.dumps({
                                "type": "message",
                                "sender": user_email,
                                "content": content,
                                "timestamp": msg["timestamp"]
                            }))
                elif msg_type == 'status_request':
                    target = message.get('target')
                    if target:
                        target_user = users_collection.find_one({"email": target}, {"status": 1})
                        if target_user:
                            ws.send(json.dumps({
                                "type": "status",
                                "user": target,
                                "status": target_user.get("status", "offline")
                            }))
                elif msg_type == 'join_group':
                    group_id = message.get('group_id')
                    group = groups_collection.find_one({"_id": ObjectId(group_id), "members": user_email})
                    if group:
                        joined_groups.add(group_id)
                        print(f"{user_email} joined group {group_id}")
                        ws.send(json.dumps({"type": "group_joined", "group_id": group_id}))
                    else:
                        ws.send(json.dumps({"type": "error", "message": "Group not found or access denied"}))
                elif msg_type == 'group_message':
                    group_id = message.get('group_id')
                    content = message.get('content')
                    if group_id in joined_groups and content:
                        group = groups_collection.find_one({"_id": ObjectId(group_id), "members": user_email})
                        if group:
                            msg = {
                                "sender": user_email,
                                "group_id": group_id,
                                "content": content,
                                "timestamp": datetime.utcnow(),
                                "read_by": [user_email]
                            }
                            result = messages_collection.insert_one(msg)
                            msg["_id"] = str(result.inserted_id)
                            msg["timestamp"] = msg["timestamp"].isoformat()
                            for member in group["members"]:
                                if member in active_connections and member != user_email:
                                    active_connections[member]['ws'].send(json.dumps({
                                        "type": "group_message",
                                        "message": msg
                                    }))
                elif msg_type == 'ping':
                    ws.send(json.dumps({"type": "pong"}))
            except json.JSONDecodeError as e:
                print(f"WebSocket JSON error: {e}")
            except Exception as e:
                print(f"WebSocket message error: {e}")
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        if user_email:
            ws.send(json.dumps({"type": "error", "message": str(e)}))
    finally:
        if user_email and user_email in active_connections:
            del active_connections[user_email]
            users_collection.update_one(
                {"email": user_email},
                {"$set": {"status": "offline", "last_seen": datetime.utcnow()}}
            )
            notify_contacts(user_email, "offline")
        ws.close()

def notify_contacts(user_email, status):
    contacts = users_collection.find({"email": {"$ne": user_email}}, {"email": 1})
    for contact in contacts:
        if contact['email'] in active_connections:
            try:
                active_connections[contact['email']]['ws'].send(json.dumps({
                    "type": "status",
                    "user": user_email,
                    "status": status
                }))
            except Exception as e:
                print(f"Failed to notify {contact['email']}: {e}")

# Mark messages as read
@app.route("/api/messages/read", methods=["POST"])
@token_required
@handle_errors
def mark_as_read():
    data = request.get_json()
    sender = data.get("sender")
    
    if not sender:
        return jsonify({"message": "Sender is required"}), 400
    
    result = messages_collection.update_many(
        {"sender": sender, "receiver": request.user_email, "read": False},
        {"$set": {"read": True}}
    )
    
    return jsonify({"message": f"Marked {result.modified_count} messages as read"}), 200

# Create new group
@app.route("/api/groups/create", methods=["POST"])
@token_required
@handle_errors
def create_group():
    data = request.get_json()
    name = data.get("name")
    members = data.get("members", [])
    
    if not name:
        return jsonify({"message": "Group name is required"}), 400
    
    if request.user_email not in members:
        members.append(request.user_email)
    
    existing_members = list(users_collection.find({"email": {"$in": members}}, {"email": 1}))
    existing_emails = [m["email"] for m in existing_members]
    invalid_members = set(members) - set(existing_emails)
    
    if invalid_members:
        return jsonify({"message": f"Invalid members: {', '.join(invalid_members)}"}), 400
    
    group = {
        "name": name,
        "members": members,
        "created_by": request.user_email,
        "created_at": datetime.utcnow(),
        "admins": [request.user_email]
    }
    result = groups_collection.insert_one(group)
    group["_id"] = str(result.inserted_id)
    
    for member in members:
        if member in active_connections and member != request.user_email:
            try:
                active_connections[member]['ws'].send(json.dumps({
                    "type": "group_created",
                    "group": group
                }))
            except Exception as e:
                print(f"Failed to notify {member}: {e}")
    
    return jsonify(group), 201

# Get user's groups
@app.route("/api/groups", methods=["GET"])
@token_required
@handle_errors
def get_user_groups():
    groups = list(groups_collection.find(
        {"members": request.user_email},
        {"messages": 0}
    ).sort("created_at", -1))
    
    for group in groups:
        group["_id"] = str(group["_id"])
        group["created_at"] = group["created_at"].isoformat()
        last_message = messages_collection.find_one(
            {"group_id": group["_id"]},
            sort=[("timestamp", -1)]
        )
        if last_message:
            last_message["_id"] = str(last_message["_id"])
            last_message["timestamp"] = last_message["timestamp"].isoformat()
            group["last_message"] = last_message
    
    return jsonify(groups), 200

# Get group info
@app.route("/api/groups/<group_id>", methods=["GET"])
@token_required
@handle_errors
def get_group(group_id):
    group = groups_collection.find_one({"_id": ObjectId(group_id)})
    if not group:
        return jsonify({"message": "Group not found"}), 404
    
    group["_id"] = str(group["_id"])
    group["created_at"] = group["created_at"].isoformat()
    return jsonify(group), 200

# Get group messages
@app.route("/api/groups/<group_id>/messages", methods=["GET"])
@token_required
@handle_errors
def get_group_messages(group_id):
    group = groups_collection.find_one({"_id": ObjectId(group_id), "members": request.user_email})
    if not group:
        return jsonify({"message": "Group not found or access denied"}), 404
    
    messages = list(messages_collection.find(
        {"group_id": group_id},
        sort=[("timestamp", -1)],
        limit=50
    ))
    
    for message in messages:
        message["_id"] = str(message["_id"])
        message["timestamp"] = message["timestamp"].isoformat()
    
    return jsonify(messages), 200

# Send group message
@app.route("/api/groups/<group_id>/messages", methods=["POST"])
@token_required
@handle_errors
def send_group_message(group_id):
    data = request.get_json()
    content = data.get("content")
    
    if not content:
        return jsonify({"message": "Content is required"}), 400
    
    group = groups_collection.find_one({"_id": ObjectId(group_id), "members": request.user_email})
    if not group:
        return jsonify({"message": "Group not found or access denied"}), 404
    
    message = {
        "sender": request.user_email,
        "group_id": group_id,
        "content": content,
        "timestamp": datetime.utcnow(),
        "read_by": [request.user_email]
    }
    result = messages_collection.insert_one(message)
    message["_id"] = str(result.inserted_id)
    message["timestamp"] = message["timestamp"].isoformat()
    
    for member in group["members"]:
        if member in active_connections and member != request.user_email:
            try:
                active_connections[member]['ws'].send(json.dumps({
                    "type": "group_message",
                    "message": message
                }))
            except Exception as e:
                print(f"Failed to notify {member}: {e}")

    return jsonify(message), 201

if __name__ == "__main__":
    app.run(host=os.getenv('HOST', '0.0.0.0'), 
            port=int(os.getenv('PORT', 5000)),
            debug=os.getenv('DEBUG', 'False') == 'True')

