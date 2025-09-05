# TeamChat

A real-time team chat application built with React and Flask, featuring WebSocket support for instant messaging, channel management, and user presence indicators.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using WebSockets
- **Channel Management**: Create, join, and delete chat channels
- **User Authentication**: Secure JWT-based authentication system
- **User Profiles**: Customizable user profiles with avatars and status messages
- **Online Status**: Real-time online/offline indicators for channels
- **Message Reactions**: Add emoji reactions to messages
- **Typing Indicators**: See when users are typing
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Performance Optimized**: Virtual scrolling and performance monitoring


## 🛠️ Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Create virtual environment**:

   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:

   - Windows: `venv\Scripts\activate`

4. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server**:

   ```bash
   python app.py
   ```

   The backend will start on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`

## 🔌 API Routes

### Authentication Routes (`/auth`)

| Method | Endpoint         | Description                  | Auth Required |
| ------ | ---------------- | ---------------------------- | ------------- |
| POST   | `/auth/register` | Register a new user          | No            |
| POST   | `/auth/login`    | Login user and get JWT token | No            |
| GET    | `/auth/profile`  | Get user profile             | Yes           |
| PUT    | `/auth/profile`  | Update user profile          | Yes           |
| GET    | `/auth/users`    | Get all users (for mentions) | Yes           |
| POST   | `/auth/online`   | Update online status         | Yes           |

### Chat Routes (`/chat`)

| Method | Endpoint                        | Description                  | Auth Required |
| ------ | ------------------------------- | ---------------------------- | ------------- |
| GET    | `/chat/channels`                | Get all channels             | Yes           |
| POST   | `/chat/channels`                | Create new channel           | Yes           |
| DELETE | `/chat/channels/<id>`           | Delete channel               | Yes           |
| POST   | `/chat/messages`                | Send message                 | Yes           |
| GET    | `/chat/channels/<id>/messages`  | Get channel messages         | Yes           |
| POST   | `/chat/messages/<id>/reactions` | Add reaction to message      | Yes           |
| DELETE | `/chat/messages/<id>/reactions` | Remove reaction from message | Yes           |
