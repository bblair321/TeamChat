from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@app.route('/')
def test():
    return {"message": "Backend is running!"}

@app.route('/auth/login', methods=['POST'])
def login():
    return {"token": "test-token"}, 200

if __name__ == "__main__":
    print("Starting simple Flask app...")
    socketio.run(app, debug=True, port=8000, allow_unsafe_werkzeug=True)
