from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)
chat_bp = Blueprint("chat", __name__)

def get_models():
    """Get models from current app context"""
    return current_app.User, current_app.Channel, current_app.Message, current_app.Reaction

def get_db():
    """Get db from current app context"""
    return current_app.db

@auth_bp.route("/register", methods=["POST"])
def register():
    User, Channel, Message, Reaction = get_models()
    db = get_db()
    
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format. Please try again."}), 400
    
    if "username" not in data or "password" not in data:
        return jsonify({"error": "Please provide both username and password."}), 400
    
    # Validate username
    username = data["username"].strip()
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long."}), 400
    if len(username) > 20:
        return jsonify({"error": "Username must be 20 characters or less."}), 400
    if not username.replace("_", "").isalnum():
        return jsonify({"error": "Username can only contain letters, numbers, and underscores."}), 400
    
    # Validate password
    password = data["password"]
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters of any combination."}), 400
    
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "This username is already taken. Please choose a different one."}), 400

    try:
        hashed_pw = generate_password_hash(password)
        new_user = User(username=username, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Account created successfully! You can now log in."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create account. Please try again."}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    User, Channel, Message, Reaction = get_models()
    
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format. Please try again."}), 400
    
    if "username" not in data or "password" not in data:
        return jsonify({"error": "Please provide both username and password."}), 400
    
    username = data["username"].strip()
    password = data["password"]
    
    if not username:
        return jsonify({"error": "Please enter your username."}), 400
    if not password:
        return jsonify({"error": "Please enter your password."}), 400
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "Invalid username or password. Please check your credentials and try again."}), 401
    
    if not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password. Please check your credentials and try again."}), 401

    try:
        token = create_access_token(identity=str(user.id))
        return jsonify({
            "token": token,
            "message": "Login successful! Welcome back."
        })
    except Exception as e:
        return jsonify({"error": "Failed to create login session. Please try again."}), 500

# Create channel
@chat_bp.route("/channels", methods=["POST"])
@jwt_required()
def create_channel():
    User, Channel, Message, Reaction = get_models()
    db = get_db()
    
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format. Please try again."}), 400
    
    if "name" not in data:
        return jsonify({"error": "Please provide a channel name."}), 400
    
    channel_name = data["name"].strip()
    
    if not channel_name:
        return jsonify({"error": "Channel name cannot be empty."}), 400
    
    if len(channel_name) < 3:
        return jsonify({"error": "Channel name must be at least 3 characters long."}), 400
    
    if len(channel_name) > 50:
        return jsonify({"error": "Channel name must be 50 characters or less."}), 400
    
    # Check for invalid characters
    if not channel_name.replace(" ", "").replace("-", "").replace("_", "").isalnum():
        return jsonify({"error": "Channel name can only contain letters, numbers, spaces, hyphens, and underscores."}), 400
    
    existing_channel = Channel.query.filter_by(name=channel_name).first()
    if existing_channel:
        return jsonify({"error": "A channel with this name already exists. Please choose a different name."}), 400

    try:
        new_channel = Channel(name=channel_name)
        db.session.add(new_channel)
        db.session.commit()
        return jsonify({
            "message": f"Channel '{channel_name}' created successfully!",
            "channel": {
                "id": new_channel.id,
                "name": new_channel.name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create channel. Please try again."}), 500

# Get channels
@chat_bp.route("/channels", methods=["GET"])
@jwt_required()
def get_channels():
    User, Channel, Message, Reaction = get_models()
    channels = Channel.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in channels])

# Delete channel
@chat_bp.route("/channels/<int:channel_id>", methods=["DELETE"])
@jwt_required()
def delete_channel(channel_id):
    try:
        User, Channel, Message, Reaction = get_models()
        db = get_db()
        user_id = int(get_jwt_identity())
        
        # Check if channel exists
        channel = Channel.query.get(channel_id)
        if not channel:
            return jsonify({"error": "Channel not found"}), 404
        
        # For now, allow any authenticated user to delete any channel
        # In a production app, you might want to add ownership checks
        
        # Get all messages in the channel first
        messages_in_channel = Message.query.filter_by(channel_id=channel_id).all()
        
        # Delete all messages in the channel (cascade will handle reactions)
        for message in messages_in_channel:
            db.session.delete(message)
        
        # Delete the channel
        db.session.delete(channel)
        db.session.commit()
        
        return jsonify({"message": "Channel deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get user profile
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        User, Channel, Message, Reaction = get_models()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name or user.username,
            "avatar_url": user.avatar_url,
            "status_message": user.status_message,
            "is_online": user.is_online,
            "last_seen": user.last_seen.isoformat() if user.last_seen else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update user profile
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        User, Channel, Message, Reaction = get_models()
        db = get_db()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Update allowed fields
        if "display_name" in data:
            user.display_name = data["display_name"]
        if "status_message" in data:
            user.status_message = data["status_message"]
        if "avatar_url" in data:
            user.avatar_url = data["avatar_url"]
        
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name or user.username,
            "avatar_url": user.avatar_url,
            "status_message": user.status_message,
            "is_online": user.is_online,
            "last_seen": user.last_seen.isoformat() if user.last_seen else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all users (for mentions)
@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    try:
        User, Channel, Message, Reaction = get_models()
        users = User.query.all()
        
        return jsonify([{
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name or user.username,
            "avatar_url": user.avatar_url,
            "is_online": user.is_online,
            "last_seen": user.last_seen.isoformat() if user.last_seen else None
        } for user in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update online status
@auth_bp.route("/online", methods=["POST"])
@jwt_required()
def update_online_status():
    try:
        User, Channel, Message, Reaction = get_models()
        db = get_db()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json()
        if data and "is_online" in data:
            user.is_online = data["is_online"]
            if not data["is_online"]:
                from datetime import datetime
                user.last_seen = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({"message": "Status updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add error handler for JWT errors
@chat_bp.errorhandler(422)
def handle_jwt_error(e):
    return jsonify({"error": "JWT validation failed"}), 422

# Post message
@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def post_message():
    User, Channel, Message, Reaction = get_models()
    db = get_db()
    user_id = int(get_jwt_identity())
    
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format. Please try again."}), 400
    
    if "content" not in data or "channel_id" not in data:
        return jsonify({"error": "Please provide both message content and channel ID."}), 400
    
    content = data["content"].strip()
    channel_id = data["channel_id"]
    
    if not content:
        return jsonify({"error": "Message cannot be empty."}), 400
    
    if len(content) > 1000:
        return jsonify({"error": "Message is too long. Please keep it under 1000 characters."}), 400
    
    # Check if channel exists
    channel = Channel.query.get(channel_id)
    if not channel:
        return jsonify({"error": "Channel not found. It may have been deleted."}), 404
    
    try:
        new_msg = Message(content=content, user_id=user_id, channel_id=channel_id)
        db.session.add(new_msg)
        db.session.commit()
        return jsonify({
            "message": "Message sent successfully!",
            "message_id": new_msg.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to send message. Please try again."}), 500

# Get messages for a channel
@chat_bp.route("/channels/<int:channel_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(channel_id):
    User, Channel, Message, Reaction = get_models()
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    messages = Message.query.filter_by(channel_id=channel_id).order_by(Message.timestamp).all()
    
    # Format messages with reactions
    formatted_messages = []
    for m in messages:
        # Group reactions by emoji
        reactions = {}
        for reaction in m.reactions:
            # Skip reactions with empty emojis
            if not reaction.emoji or reaction.emoji.strip() == "":
                continue
                
            if reaction.emoji not in reactions:
                reactions[reaction.emoji] = []
            # Replace current user's username with "You" for frontend display
            username = "You" if reaction.user_id == current_user_id else reaction.user.username
            reactions[reaction.emoji].append(username)
        
        formatted_messages.append({
            "id": m.id,
            "content": m.content,
            "user": m.user.username,
            "time": m.timestamp.isoformat(),
            "reactions": reactions
        })
    
    return jsonify(formatted_messages)

# Add reaction to message
@chat_bp.route("/messages/<int:message_id>/reactions", methods=["POST"])
@jwt_required()
def add_reaction(message_id):
    try:
        User, Channel, Message, Reaction = get_models()
        db = get_db()
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate request data
        if not data or "emoji" not in data:
            return jsonify({"error": "Please select an emoji to react with."}), 400
        
        emoji = data["emoji"].strip()
        if not emoji or len(emoji) == 0:
            return jsonify({"error": "Please select a valid emoji."}), 400
        
        if len(emoji) > 10:
            return jsonify({"error": "Invalid emoji selected."}), 400
        
        # Check if message exists
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found. It may have been deleted."}), 404
        
        # Check if user already reacted with this emoji
        existing_reaction = Reaction.query.filter_by(
            user_id=user_id, 
            message_id=message_id, 
            emoji=emoji
        ).first()
        
        if existing_reaction:
            return jsonify({"error": "You've already reacted with this emoji. Click it again to remove your reaction."}), 400
        
        # Add new reaction
        new_reaction = Reaction(
            emoji=emoji,
            user_id=user_id,
            message_id=message_id
        )
        db.session.add(new_reaction)
        db.session.commit()
        
        return jsonify({"message": f"Reaction {emoji} added successfully!"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Remove reaction from message
@chat_bp.route("/messages/<int:message_id>/reactions", methods=["DELETE"])
@jwt_required()
def remove_reaction(message_id):
    try:
        User, Channel, Message, Reaction = get_models()
        db = get_db()
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate request data
        if not data or "emoji" not in data:
            return jsonify({"error": "Missing emoji in request"}), 400
        
        emoji = data["emoji"]
        if not emoji or len(emoji) == 0:
            return jsonify({"error": "Emoji cannot be empty"}), 400
        
        # Find and remove the reaction
        reaction = Reaction.query.filter_by(
            user_id=user_id,
            message_id=message_id,
            emoji=emoji
        ).first()
        
        if not reaction:
            return jsonify({"error": "Reaction not found"}), 404
        
        db.session.delete(reaction)
        db.session.commit()
        
        return jsonify({"message": "Reaction removed"}), 200
        
    except Exception as e:
        print(f"Error removing reaction: {e}")
        return jsonify({"error": str(e)}), 500
