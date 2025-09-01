from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Create the SQLAlchemy instance
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Simple CORS configuration
    CORS(app)
    
    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///chat.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "supersecretkey"  # change for production

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)

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
        User, Channel, Message = init_models(db)
        
        # Make models and db available globally
        app.User = User
        app.Channel = Channel
        app.Message = Message
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

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=8000)
