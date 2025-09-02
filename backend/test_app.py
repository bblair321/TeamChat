from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def test():
    return {"message": "Backend is running!"}

@app.route('/auth/login', methods=['POST'])
def login():
    return {"token": "test-token"}, 200

if __name__ == "__main__":
    app.run(debug=True, port=8000)
