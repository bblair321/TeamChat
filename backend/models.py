from datetime import datetime

# Global variables to store the model classes
User = None
Channel = None
Message = None
Reaction = None

def init_models(db_instance):
    """Initialize models with the db instance"""
    global User, Channel, Message, Reaction
    
    # Only initialize if not already done
    if User is not None:
        return User, Channel, Message, Reaction
    
    class UserModel(db_instance.Model):
        __tablename__ = 'user'
        
        id = db_instance.Column(db_instance.Integer, primary_key=True)
        username = db_instance.Column(db_instance.String(80), unique=True, nullable=False)
        password = db_instance.Column(db_instance.String(120), nullable=False)
        # Profile fields
        display_name = db_instance.Column(db_instance.String(100), nullable=True)
        avatar_url = db_instance.Column(db_instance.String(500), nullable=True)
        status_message = db_instance.Column(db_instance.String(200), nullable=True)
        is_online = db_instance.Column(db_instance.Boolean, default=False)
        last_seen = db_instance.Column(db_instance.DateTime, default=datetime.utcnow)
        created_at = db_instance.Column(db_instance.DateTime, default=datetime.utcnow)
        messages = db_instance.relationship("MessageModel", backref="user", lazy=True)

    class ChannelModel(db_instance.Model):
        __tablename__ = 'channel'
        
        id = db_instance.Column(db_instance.Integer, primary_key=True)
        name = db_instance.Column(db_instance.String(80), unique=True, nullable=False)
        messages = db_instance.relationship("MessageModel", backref="channel", lazy=True)

    class MessageModel(db_instance.Model):
        __tablename__ = 'message'
        
        id = db_instance.Column(db_instance.Integer, primary_key=True)
        content = db_instance.Column(db_instance.Text, nullable=False)
        timestamp = db_instance.Column(db_instance.DateTime, default=datetime.utcnow)
        user_id = db_instance.Column(db_instance.Integer, db_instance.ForeignKey("user.id"), nullable=False)
        channel_id = db_instance.Column(db_instance.Integer, db_instance.ForeignKey("channel.id"), nullable=False)
        reactions = db_instance.relationship("ReactionModel", backref="message", lazy=True, cascade="all, delete-orphan")

    class ReactionModel(db_instance.Model):
        __tablename__ = 'reaction'
        
        id = db_instance.Column(db_instance.Integer, primary_key=True)
        emoji = db_instance.Column(db_instance.String(10), nullable=False)
        user_id = db_instance.Column(db_instance.Integer, db_instance.ForeignKey("user.id"), nullable=False)
        message_id = db_instance.Column(db_instance.Integer, db_instance.ForeignKey("message.id"), nullable=False)
        timestamp = db_instance.Column(db_instance.DateTime, default=datetime.utcnow)
        
        # Add relationship to User
        user = db_instance.relationship("UserModel", backref="reactions", lazy=True)
        
        # Ensure one reaction per user per emoji per message
        __table_args__ = (db_instance.UniqueConstraint('user_id', 'message_id', 'emoji', name='unique_user_message_emoji'),)
    
    # Set the global variables
    User = UserModel
    Channel = ChannelModel
    Message = MessageModel
    Reaction = ReactionModel
    
    return User, Channel, Message, Reaction
