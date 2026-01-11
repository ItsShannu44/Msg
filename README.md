# 🚀 KwikChat – Real-Time Messaging & Voice-to-Text Platform

KwikChat is a modern, feature-rich **real-time web-based messaging application** designed to provide seamless communication with built-in **voice-to-text**, **theme customization**, and **profile management**.  
It focuses on usability, accessibility, and real-time interaction using modern web technologies.

---

## ✨ Features

- 🔐 **User Authentication**
  - Secure user registration and login
  - Password hashing for enhanced security

- 💬 **Real-Time Messaging**
  - Instant message delivery without page reload
  - Persistent chat history stored in database

- 🎙️ **Voice-to-Text Chat**
  - Speech-to-text conversion using Web Speech API
  - Improves accessibility and faster communication

- 🎨 **Theme Customization**
  - Dark / Light mode toggle
  - Custom accent color selection

- 👤 **Profile Management**
  - Update username
  - Upload and change profile picture (stored as BLOB)

- 🔍 **Chat Utilities**
  - Search conversations
  - Clear chat history
  - Recent chats support

---

## 🛠️ Tech Stack

### Frontend
- HTML5  
- CSS3  
- JavaScript  

### Backend
- Python (Flask)  
- Flask-SocketIO  

### Database
- SQLite3  
  - User details  
  - Messages  
  - Profile pictures (BLOB format)

---

## 📐 System Architecture

KwikChat follows a **Client–Server Architecture**:

- **Frontend**: User interface, message input, voice input, themes  
- **Backend (Flask)**: Authentication, messaging logic, APIs  
- **Database (SQLite)**: Stores users, messages, and profile images  

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9 or above
- pip
- Modern browser (Chrome recommended for voice-to-text)

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/KwikChat.git

# Navigate to project directory
cd KwikChat

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Open your browser and visit:
```
http://localhost:5000
```

---

## 🧪 Testing

The application was tested for:

- Backend route functionality
- Database CRUD operations
- Real-time message delivery
- Voice-to-text accuracy
- UI responsiveness across devices
- Security (password hashing & input validation)

---

## ⚠️ Limitations

- SQLite is not suitable for very large-scale concurrent users
- No media/file sharing feature
- OAuth login (Google/GitHub) not implemented
- Voice-to-text has limited browser support

---

## 🔮 Future Scope

- Migration to PostgreSQL or MongoDB
- End-to-End Encryption (E2EE)
- Group chats and channels
- Media & file sharing
- Progressive Web App (PWA)
- Mobile applications (Android & iOS)
- AI-powered smart replies and moderation

---

## 🎓 Academic Context

This project was originally developed as a **BCA Final Year Project** and later enhanced and published as an independent open-source project.

---

## 👨‍💻 Authors

- **Shanmukha Bhat**
- Darshan K G  
- Dishank S S  

---

## 📜 License

This project is open-source and available for educational and learning purposes.
