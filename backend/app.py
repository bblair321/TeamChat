import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Create the SQLAlchemy instance
db = SQLAlchemy()
# Create the SocketIO instance
socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    
    # Simple CORS configuration
    CORS(app)
    
    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///chat.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "supersecretkey")

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading', logger=True, engineio_logger=True)

    # Add a simple test route
    @app.route('/')
    def test():
        return {"message": "Backend is running!"}

    # Add a debug route to check database
    @app.route('/debug/users')
    def debug_users():
        with app.app_context():
            try:
                from models import init_models
                User, Channel, Message = init_models(db)
                users = User.query.all()
                return {
                    "total_users": len(users),
                    "users": [{"id": u.id, "username": u.username} for u in users]
                }
            except Exception as e:
                return {"error": str(e)}, 500

    with app.app_context():
        # Initialize models with the db instance FIRST
        from models import init_models
        User, Channel, Message, Reaction = init_models(db)
        
        # Make models and db available globally
        app.User = User
        app.Channel = Channel
        app.Message = Message
        app.Reaction = Reaction
        app.db = db
        
        db.create_all()  # create database tables
        
        # Create default channel if none exist
        if Channel.query.count() == 0:
            default_channel = Channel(name="General")
            db.session.add(default_channel)
            db.session.commit()
            print("Created default 'General' channel")

    # Import and register blueprints AFTER models are initialized
    from routes import auth_bp, chat_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(chat_bp, url_prefix="/chat")
    
    # Import socket events to register them
    import socket_events
    socket_events.init_socket_events(socketio, db)

    return app

if __name__ == "__main__":
    try:
        print("Starting Flask app...")
        app = create_app()
        print("App created successfully")
        port = int(os.environ.get("PORT", 8000))
        debug = os.environ.get("FLASK_ENV") == "development"
        print(f"Starting server on port {port}, debug={debug}")
        socketio.run(app, debug=True, port=port, host='0.0.0.0', allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"Error starting app: {e}")
        import traceback
        traceback.print_exc()
