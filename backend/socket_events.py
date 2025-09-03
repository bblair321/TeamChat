from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from models import init_models

# Global variable to store the socketio instance
_socketio = None
_db = None

# Track online users per channel
_online_users = {}  # {channel_id: {user_id: username}}

def init_socket_events(socketio_instance, db_instance):
    """Initialize socket events with the socketio and db instances"""
    global _socketio, _db
    _socketio = socketio_instance
    _db = db_instance
    
    # Register all event handlers
    _socketio.on_event('connect', handle_connect)
    _socketio.on_event('disconnect', handle_disconnect)
    _socketio.on_event('join_channel', handle_join_channel)
    _socketio.on_event('leave_channel', handle_leave_channel)
    _socketio.on_event('send_message', handle_send_message)
    _socketio.on_event('typing', handle_typing)

def emit_online_status(channel_id):
    """Emit online status for a channel to all users in that channel"""
    if channel_id in _online_users:
        online_count = len(_online_users[channel_id])
        online_users = list(_online_users[channel_id].values())
        
        room = f'channel_{channel_id}'
        emit('online_status', {
            'channel_id': channel_id,
            'online_count': online_count,
            'online_users': online_users
        }, room=room)
        
        print(f"Emitted online status for channel {channel_id}: {online_count} users online")

def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('status', {'msg': 'Connected to chat server'})

def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')
    
    # Note: We can't easily track which user disconnected without storing socket_id to user_id mapping
    # For now, we'll rely on the leave_channel events to clean up online users
    # In a production app, you'd want to store socket_id -> user_id mapping

def handle_join_channel(data):
    """Handle user joining a channel"""
    try:
        # Get token from the data
        token = data.get('token')
        if not token:
            emit('error', {'msg': 'No token provided'})
            return
        
        # Decode token to get user info
        decoded = decode_token(token)
        user_id = decoded['sub']
        
        # Get channel ID
        channel_id = data.get('channel_id')
        if not channel_id:
            emit('error', {'msg': 'No channel ID provided'})
            return
        
        # Get user info from database
        from flask import current_app
        User = current_app.User
        user = User.query.get(user_id)
        if not user:
            emit('error', {'msg': 'User not found'})
            return
        
        # Join the room for this channel
        room = f'channel_{channel_id}'
        join_room(room)
        
        # Track online user
        if channel_id not in _online_users:
            _online_users[channel_id] = {}
        _online_users[channel_id][user_id] = user.username
        
        print(f'User {user.username} (ID: {user_id}) joined channel {channel_id}')
        emit('status', {'msg': f'Joined channel {channel_id}'}, room=room)
        
        # Emit updated online status
        emit_online_status(channel_id)
        
    except Exception as e:
        print(f'Error joining channel: {e}')
        emit('error', {'msg': 'Failed to join channel'})

def handle_leave_channel(data):
    """Handle user leaving a channel"""
    try:
        # Get token from the data
        token = data.get('token')
        channel_id = data.get('channel_id')
        
        if channel_id:
            room = f'channel_{channel_id}'
            leave_room(room)
            
            # Remove user from online tracking if token provided
            if token:
                try:
                    decoded = decode_token(token)
                    user_id = decoded['sub']
                    
                    if channel_id in _online_users and user_id in _online_users[channel_id]:
                        username = _online_users[channel_id][user_id]
                        del _online_users[channel_id][user_id]
                        print(f'User {username} (ID: {user_id}) left channel {channel_id}')
                        
                        # Emit updated online status
                        emit_online_status(channel_id)
                except:
                    pass  # If token is invalid, just continue
            
            print(f'User left channel {channel_id}')
            emit('status', {'msg': f'Left channel {channel_id}'})
    except Exception as e:
        print(f'Error leaving channel: {e}')
        emit('error', {'msg': 'Failed to leave channel'})

def handle_send_message(data):
    """Handle sending a message to a channel"""
    try:
        # Get token from the data
        token = data.get('token')
        if not token:
            emit('error', {'msg': 'No token provided'})
            return
        
        # Decode token to get user info
        decoded = decode_token(token)
        user_id = decoded['sub']
        
        # Get message data
        channel_id = data.get('channel_id')
        content = data.get('content')
        
        if not channel_id or not content:
            emit('error', {'msg': 'Missing channel ID or content'})
            return
        
        # Get models from the app context
        from flask import current_app
        User = current_app.User
        Channel = current_app.Channel
        Message = current_app.Message
        
        # Get user info
        user = User.query.get(user_id)
        if not user:
            emit('error', {'msg': 'User not found'})
            return
        
        # Create and save message
        new_message = Message(
            content=content,
            user_id=user_id,
            channel_id=channel_id
        )
        current_app.db.session.add(new_message)
        current_app.db.session.commit()
        
        # Emit message to all users in the channel
        room = f'channel_{channel_id}'
        message_data = {
            'id': new_message.id,
            'content': content,
            'user': user.username,
            'time': new_message.timestamp.isoformat(),
            'channel_id': channel_id
        }
        
        emit('new_message', message_data, room=room)
        
    except Exception as e:
        print(f'Error sending message: {e}')
        import traceback
        traceback.print_exc()
        emit('error', {'msg': 'Failed to send message'})

def handle_typing(data):
    """Handle typing indicator"""
    try:
        token = data.get('token')
        channel_id = data.get('channel_id')
        is_typing = data.get('is_typing', False)
        
        if token and channel_id:
            decoded = decode_token(token)
            user_id = decoded['sub']
            User, Channel, Message = init_models(_db)
            user = User.query.get(user_id)
            
            if user:
                room = f'channel_{channel_id}'
                emit('user_typing', {
                    'user': user.username,
                    'is_typing': is_typing
                }, room=room, include_self=False)
                
    except Exception as e:
        print(f'Error handling typing: {e}')
