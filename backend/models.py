from datetime import datetime

# Global variables to store the model classes
User = None
Channel = None
Message = None

def init_models(db_instance):
    """Initialize models with the db instance"""
    global User, Channel, Message
    
    # Only initialize if not already done
    if User is not None:
        return User, Channel, Message
    
    class UserModel(db_instance.Model):
        __tablename__ = 'user'
        
        id = db_instance.Column(db_instance.Integer, primary_key=True)
        username = db_instance.Column(db_instance.String(80), unique=True, nullable=False)
        password = db_instance.Column(db_instance.String(120), nullable=False)
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
    
    # Set the global variables
    User = UserModel
    Channel = ChannelModel
    Message = MessageModel
    
    return User, Channel, Message
