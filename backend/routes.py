from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)
chat_bp = Blueprint("chat", __name__)

def get_models():
    """Get models from current app context"""
    return current_app.User, current_app.Channel, current_app.Message

def get_db():
    """Get db from current app context"""
    return current_app.db

@auth_bp.route("/register", methods=["POST"])
def register():
    User, Channel, Message = get_models()
    db = get_db()
    data = request.get_json()
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = generate_password_hash(data["password"])
    new_user = User(username=data["username"], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    User, Channel, Message = get_models()
    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"token": token})

# Create channel
@chat_bp.route("/channels", methods=["POST"])
@jwt_required()
def create_channel():
    User, Channel, Message = get_models()
    db = get_db()
    data = request.get_json()
    if Channel.query.filter_by(name=data["name"]).first():
        return jsonify({"error": "Channel already exists"}), 400

    new_channel = Channel(name=data["name"])
    db.session.add(new_channel)
    db.session.commit()
    return jsonify({"message": "Channel created"}), 201

# Get channels
@chat_bp.route("/channels", methods=["GET"])
@jwt_required()
def get_channels():
    User, Channel, Message = get_models()
    channels = Channel.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in channels])

# Post message
@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def post_message():
    User, Channel, Message = get_models()
    db = get_db()
    user_id = get_jwt_identity()
    data = request.get_json()
    new_msg = Message(content=data["content"], user_id=user_id, channel_id=data["channel_id"])
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({"message": "Message sent!"}), 201

# Get messages for a channel
@chat_bp.route("/messages/<int:channel_id>", methods=["GET"])
@jwt_required()
def get_messages(channel_id):
    User, Channel, Message = get_models()
    messages = Message.query.filter_by(channel_id=channel_id).order_by(Message.timestamp).all()
    return jsonify([
        {"id": m.id, "content": m.content, "user": m.user.username, "time": m.timestamp.isoformat()}
        for m in messages
    ])
