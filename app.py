from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime
from datetime import timedelta
from flask import send_file
import time
import threading
import io
import base64 
import pytz
import sqlite3
import re
import os
from apscheduler.schedulers.background import BackgroundScheduler



app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = '2004'
socketio = SocketIO(app)


# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app) 
login_manager.login_view = 'login'

def init_db():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    current_time = datetime.utcnow().isoformat()  # Save in UTC ISO 8601 format

        # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profile_picture BLOB,
            email TEXT UNIQUE NOT NULL
        )
    ''')

    # Admins table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')

        # Messages table 
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            recipient_id INTEGER,
            message TEXT,
            timestamp_utc TEXT
        )
    ''')

    # Recent chats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recent_chats (
            sender_id INTEGER,
            user_id INTEGER,
            timestamp_local TEXT,
            PRIMARY KEY (sender_id, user_id)
        )
    ''')
        # Backup table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS message_backup (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            recipient_id INTEGER,
            message TEXT,
            timestamp_utc TEXT
        )
    ''')
    #user Agreement
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_agreements (
            user_id INTEGER PRIMARY KEY,
            accepted BOOLEAN DEFAULT FALSE,
            accepted_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        recipient_id INTEGER,
        message TEXT,
        timestamp_utc TEXT,
        deleted_for_sender BOOLEAN DEFAULT 0,
        deleted_for_recipient BOOLEAN DEFAULT 0,
        deleted_for_everyone BOOLEAN DEFAULT 0
    )
''')


    # Add timestamp_utc column
    cursor.execute("PRAGMA table_info(messages)")
    columns = [column[1] for column in cursor.fetchall()]
    if "timestamp_utc" not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN timestamp_utc TEXT")
    
    cursor.execute("PRAGMA table_info(messages)")
    columns = [column[1] for column in cursor.fetchall()]

    if "deleted_for_sender" not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN deleted_for_sender BOOLEAN DEFAULT 0")
    if "deleted_for_recipient" not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN deleted_for_recipient BOOLEAN DEFAULT 0")
    if "deleted_for_everyone" not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT 0")

class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

@login_manager.user_loader
def load_user(user_id):
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, password FROM users WHERE id = ?', (user_id,))
    user_data = cursor.fetchone()
    conn.commit()
    conn.close()
    if user_data:
        return User(user_data[0], user_data[1], user_data[2])
    return None

@app.route('/register', methods=['GET','POST']) 
def register():
    if request.method == 'GET':
        return render_template('register.html') 
    
    username = request.form['username']
    password = request.form['password']
    profile_picture = request.files['profile_picture']
    email = request.form['email']

    # Password validation (keeping your original pattern)
    password_pattern = re.compile(
        r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!#%*?&]{6,}$'
    )

    if not password_pattern.match(password):
        flash("Password must be at least 6 characters with uppercase, lowercase, number and special character", "danger")
        return redirect(url_for('register'))
    
    # Process profile picture
    profile_picture_data = profile_picture.read() if profile_picture else None

    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    try:
        # Check if username exists first
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            flash("Username already exists", "danger")
            return redirect(url_for('register')) 
        
        # Insert user (keeping plaintext password)
        cursor.execute('INSERT INTO users (username, password, profile_picture, email) VALUES (?, ?, ?, ?)', 
                      (username, password, profile_picture_data, email))
        user_id = cursor.lastrowid
        
        # Create agreement record
        cursor.execute('INSERT INTO user_agreements (user_id, accepted) VALUES (?, ?)', 
                      (user_id, False))
        
        conn.commit()
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    except sqlite3.IntegrityError:
        conn.rollback()
        flash("Username already exists", "danger")
        return redirect(url_for('register')) 
    except sqlite3.Error as e:
        conn.rollback()
        flash("Registration failed", "danger")
        print(f"Database error: {e}")
        return redirect(url_for('register'))
    finally:
        conn.close()


#----------------------------------------------------------------------------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if user and user[2] == password:  # Keeping plaintext comparison
                login_user(User(user[0], user[1], user[2]))
                session.permanent = True 
                session['user_id'] = user[0]  
                print(f"User {user[0]} logged in")
                
                # Check agreement status
                cursor.execute('SELECT accepted FROM user_agreements WHERE user_id = ?', (user[0],))
                agreement = cursor.fetchone()
                
                next_page = request.args.get('next')
                if not agreement or not agreement[0]:
                    flash('Please accept the user agreement')
                    return redirect(url_for('index', show_agreement=True))
                
                return redirect(next_page) if next_page else redirect(url_for('index'))
            else:
                flash('Invalid username or password')
        except sqlite3.Error as e:
            flash('Login error occurred')
            print(f"Database error: {e}")
        finally:
            conn.close()
    return render_template('login.html')


@app.route('/debug_session')
def debug_session():
    return jsonify({'user_id': session.get('user_id')})

#----------------------------------------------------------------------------------------
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if new_password != confirm_password:
            flash('Passwords do not match!', 'error')
            return redirect(url_for('forgot_password'))
        
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND email = ?", (username, email))
        user = cursor.fetchone()
        
        if user:
            cursor.execute("UPDATE users SET password = ? WHERE username = ? AND email = ?", (new_password, username, email))
            conn.commit()
            conn.close()
            flash('Password changed successfully! Please login.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Invalid Username or Email ID!', 'error')
            return redirect(url_for('forgot_password'))
    
    return render_template('forgot_password.html')


@app.route('/admin', methods=['GET', 'POST'])
def admin():
    next_page = request.args.get('next')  # Fix for next page redirect

    if request.method == 'POST':
        username = request.form['username']  # Changed from admin_username to username
        password = request.form['password']

        # Admin credentials (hardcoded)
        ADMIN_USERNAME = 'admin'  # Hardcoded admin username
        ADMIN_PASSWORD = 'admin@shannu44'  # Hardcoded admin password

        # Check if the entered credentials match the hardcoded ones
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin'] = username  # Store the admin username in the session
            flash("Login successful!", "success")
            return redirect(next_page or url_for('admin_panel'))  # Redirect to the admin panel
        else:
            error_message = "Invalid Username or Password!"
            return render_template('admin_login.html', error=error_message)  # Reload login page with error

    return render_template('admin_login.html')  # Render the login page initially
#----------------------------------------------------------------------------------------

@app.route('/admin_panel')
def admin_panel():
    if 'admin' not in session:
        flash("You must be logged in as an admin.", "danger")
        return redirect(url_for('admin'))

    conn = sqlite3.connect("chat.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get total messages count
    total_messages = cursor.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    
    # Get all users
    cursor.execute("SELECT id, username, password FROM users")
    users = cursor.fetchall()
    

    active_users = len(online_users)

    # Calculate database size more precisely
    db_path = "chat.db"
    size_in_bytes = os.path.getsize(db_path)
    
    # Convert to MB with 2 decimal places
    size_in_mb = round(size_in_bytes / (1024 * 1024), 2)
    
    # Also calculate in KB for comparison
    size_in_kb = round(size_in_bytes / 1024, 2)
    
    conn.close()

    return render_template(
        "admin.html", 
        users=users,
        total_messages=total_messages,
        active_users=active_users,
        storage_used=size_in_mb,
        storage_used_kb=size_in_kb
    )

#----------------------------------------------------------------------------------------
@app.route('/delete_user/<int:user_id>', methods=['POST'])
def delete_user(user_id):
    if 'admin' not in session:
        flash("You must be logged in as an admin.", "danger")
        return redirect(url_for('admin'))

    conn = sqlite3.connect("chat.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    flash("User deleted successfully.", "success")
    return redirect(url_for('admin_panel'))

@app.route('/update_last_chat/<int:user_id>', methods=['POST'])
@login_required
def update_last_chat(user_id):
    session['last_chat_user_id'] = user_id
    return '', 204

@app.route('/admin_logout')
def admin_logout():
    session.pop('admin', None)
    flash("Logged out successfully.", "success")
    return render_template("admin_login.html")


# Route to render profile page
@app.route("/profile")
def profile():
    if "user_id" not in session:
        return redirect(url_for("login"))  # Redirect if not logged in

    return render_template("profile.html", current_user={"id": session["user_id"]})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    
    # Check if user has accepted agreement (NEW CODE)
    cursor.execute('SELECT accepted FROM user_agreements WHERE user_id = ?', (current_user.id,))
    agreement_status = cursor.fetchone()
    show_agreement = not (agreement_status and agreement_status[0])  # True if not accepted
    
    # Fetch recent chats for the logged-in user (EXISTING CODE)
    cursor.execute('''
        SELECT DISTINCT u.id, u.username, rc.timestamp_local
        FROM recent_chats rc
        JOIN users u ON rc.user_id = u.id
        WHERE rc.sender_id = ?
        ORDER BY rc.timestamp_local DESC
    ''', (current_user.id,))
    recent_chats = cursor.fetchall()

    # Fetch registered users (excluding the current user) (EXISTING CODE)
    cursor.execute('SELECT id, username FROM users WHERE id != ?', (current_user.id,))
    users = cursor.fetchall()

    conn.close()

    # Get last opened chat from session or default to first recent chat (EXISTING CODE)
    last_chat_user_id = session.get('last_chat_user_id')
    if not last_chat_user_id and recent_chats:
        last_chat_user_id = recent_chats[0][0]  # Default to the most recent chat

    # Update session to remember the last chat user (EXISTING CODE)
    session['last_chat_user_id'] = last_chat_user_id

    def get_username(user_id):  # EXISTING CODE
        for user in users:
            if user[0] == user_id:
                return user[1]
        return "Unknown"

    # Modified return statement to include show_agreement
    return render_template('index.html', 
                         users=users, 
                         recent_chats=recent_chats, 
                         last_chat_user_id=last_chat_user_id,
                         get_username=get_username,
                         show_agreement=show_agreement)  # NEW PARAMETER


@app.route('/get_recent_chats', methods=['GET'])
@login_required
def get_recent_chats():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT u.id, u.username, u.profile_picture, MAX(m.timestamp_utc) as last_message_time
        FROM messages m
        JOIN users u ON (m.sender_id = u.id OR m.recipient_id = u.id)
        WHERE (m.sender_id = ? OR m.recipient_id = ?)
        AND u.id != ?
        GROUP BY u.id, u.username
        ORDER BY last_message_time DESC
    ''', (current_user.id, current_user.id, current_user.id))

    recent_chats = cursor.fetchall()
    conn.close()

    # Convert profile pictures to URLs
    recent_chats_with_pictures = []
    for chat in recent_chats:
        user_id, username, profile_picture, last_message_time = chat

        # If profile_picture exists, generate a URL; otherwise, use a default image
        if profile_picture:
            profile_picture_url = url_for('get_profile_picture', user_id=user_id)
        else:
            profile_picture_url = url_for('static', filename='default_profile.jpg')

        recent_chats_with_pictures.append({
            "user_id": user_id,
            "username": username,
            "profile_picture": profile_picture_url,
            "last_message_time": last_message_time
        })

    return jsonify(recent_chats_with_pictures)

#--------------------------------------------------------------------BACKUP MSG-------
def backup_messages():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()

    # Copy new messages into backup table
    cursor.execute('''
        INSERT INTO message_backup (sender_id, recipient_id, message, timestamp_utc)
        SELECT sender_id, recipient_id, message, timestamp_utc FROM messages
        WHERE id NOT IN (SELECT id FROM message_backup)
    ''')

    conn.commit()
    conn.close()


# Initialize and start scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(backup_messages, 'interval', seconds=1)  # Run every second
scheduler.start()


def run_backup_scheduler():
    while True:
        backup_messages()
        time.sleep(300)  # Run every 5 min

# Start backup scheduler in a separate thread
backup_thread = threading.Thread(target=run_backup_scheduler, daemon=True)
backup_thread.start()

#------------------------------

@socketio.on('chat_cleared')
def handle_chat_cleared(data):
    # Emit to the recipient and sender that the chat was cleared
    emit('chat_cleared', data, room=data['recipient_id'])
    emit('chat_cleared', data, room=data['sender_id'])



@socketio.on('send_message')
def handle_send_message(data):
    print("send message socket::::")
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()

    timestamp = data.get('timestamp', datetime.utcnow().isoformat())

    # Save the message to the database
    cursor.execute(
        '''INSERT INTO messages (sender_id, recipient_id, message, timestamp_utc)
           VALUES (?, ?, ?, ?)''',
        (data['sender_id'], data['recipient_id'], data['message'], timestamp)
    )
    
    message_id = cursor.lastrowid  # Get the ID of the inserted message

    conn.commit()
    conn.close()

    # Include message_id in the emitted data
    emit('receive_message', {
        **data, 
        'sender_username': current_user.username,
        'status': 'sent',
        'message_id': message_id,
        'timestamp': timestamp
    }, room=data['recipient_id'])
    
    emit('receive_message', {
        **data, 
        'sender_username': current_user.username,
        'status': 'sent',
        'message_id': message_id,
        'timestamp': timestamp
    }, room=data['sender_id'])

@socketio.on('message_deleted')
def handle_message_deleted(data):
    """Forward deletion events to relevant users"""
    emit('message_deleted', data, room=data.get('room', ''))


@app.route('/get_messages/<int:recipient_id>', methods=['GET'])
@login_required
def get_messages(recipient_id):
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            u.username, 
            m.message, 
            m.timestamp_utc,
            m.id as message_id,
            m.sender_id,
            m.deleted_for_sender,
            m.deleted_for_recipient,
            m.deleted_for_everyone,
            CASE 
                WHEN m.deleted_for_everyone = 1 THEN '[This message was deleted]'
                WHEN m.deleted_for_sender = 1 AND ? = m.sender_id THEN '[You deleted this message]'
                WHEN m.deleted_for_recipient = 1 AND ? = m.recipient_id THEN '[Message deleted]'
                ELSE m.message
            END as display_message
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE ((m.sender_id = ? AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = ?))
        ORDER BY m.timestamp_utc
    ''', (current_user.id, current_user.id, 
          current_user.id, recipient_id, recipient_id, current_user.id))
    
    messages = cursor.fetchall()
    conn.close()

    formatted_messages = []
    for msg in messages:
        sender_id = msg[4]
        is_sender = sender_id == current_user.id
        
        # Check if message should be shown
        if msg[7]:  # deleted_for_everyone
            show_message = False
        elif is_sender and msg[5]:  # deleted_for_sender
            show_message = False
        elif not is_sender and msg[6]:  # deleted_for_recipient
            show_message = False
        else:
            show_message = True
        
        formatted_messages.append({
            'username': msg[0],
            'message': msg[1],
            'timestamp': msg[2],
            'message_id': msg[3],
            'sender_id': sender_id,
            'display_message': msg[8] if not show_message else msg[1],
            'is_deleted': not show_message,
            'can_delete_for_everyone': is_sender and not msg[7]  # sender and not already deleted for everyone
        })
    
    return jsonify(formatted_messages)


def send_message(recipient_id, message):
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    timestamp_utc = datetime.utcnow().isoformat()  
    try:
        # Insert message into messages table
        cursor.execute('''
            INSERT INTO messages (sender_id, recipient_id, message, timestamp_utc)
            VALUES (?, ?, ?, ?)
        ''', (current_user.id, recipient_id, message, timestamp_utc))

        # Insert into recent_chats, avoiding duplicates
        cursor.execute('''
            INSERT INTO recent_chats (sender_id, user_id, timestamp_local)
            VALUES (?, ?, ?)
        ''', (current_user.id, recipient_id, timestamp_utc))

        conn.commit()
    except sqlite3.Error as e:
        print(f"Database Error: {e}")  # Debugging log
    finally:
        conn.close()



#$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ CLEAR CHAT $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$



@app.route('/clear_chat/<int:recipient_id>', methods=['POST'])
@login_required
def clear_chat(recipient_id):
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()

    cursor.execute('''
        DELETE FROM messages
        WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
    ''', (current_user.id, recipient_id, recipient_id, current_user.id))

    conn.commit()
    conn.close()

    return jsonify({'status': 'success'})



@app.route('/api/get_users')
def get_users():
    try:
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id, username FROM users')
        users = cursor.fetchall()
        conn.close()

        users_data = [{'id': user[0], 'username': user[1]} for user in users]
        return jsonify(users_data)

    except Exception as e:
        print(f"ERROR in get_users: {e}")  # Log error
        return jsonify({"error": str(e)}), 500



@app.route('/api/get_current_user')
def get_current_user():
    if "user_id" not in session:
        return jsonify({"error": "User not logged in"}), 401  # Unauthorized access

    try:
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()

        # Fetch the current user's username based on session user_id
        cursor.execute('SELECT username FROM users WHERE id = ?', (session["user_id"],))
        user = cursor.fetchone()
        conn.close()

        if user:
            return jsonify({"username": user[0]})  # Return only the logged-in user's username
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"ERROR in get_current_user: {e}")  # Log error
        return jsonify({"error": str(e)}), 500


@app.template_filter('get_username')
def get_username_filter(user_id):
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
    username = cursor.fetchone()
    conn.close()
    return username[0] if username else "Unknown"
#$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$online status$$$$$$$$$$$$$$$$$$$$$$
online_users = set()

@socketio.on('connect')
def handle_connect():
    user_id = session.get("user_id")  # Get user ID from session
    if user_id:
        online_users.add(user_id)
        emit("user_online", {"user_id": user_id}, broadcast=True)
        join_room(user_id)  # Join user's private room
        print(f"User {user_id} joined room {user_id}")
        print("A user connected")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get("user_id")
    if user_id:
        online_users.discard(user_id)
        emit("user_offline", {"user_id": user_id}, broadcast=True)
        print("A user disconnected")

@app.route('/user_status/<int:user_id>')
def get_user_status(user_id):
    return jsonify({"online": user_id in online_users})

#$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

@socketio.on("message")
def handle_message(data):
    print("Received message:", data)
    send(data, broadcast=True)  # Broadcast message to all clients

@socketio.on("update_status")
def update_status(data):
    """Update message status dynamically"""
    print(f"Updating message {data['index']} to {data['status']}")
    emit("status_updated", data, broadcast=True)  
    
#900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 PROFILE PIC
@app.route('/upload_profile_picture', methods=['POST'])
def upload_profile_picture():
    if 'profile_picture' not in request.files:
        flash('No file selected')
        return redirect(url_for('index'))

    file = request.files['profile_picture']
    
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('index'))

    if file and allowed_file(file.filename):
        profile_picture_data = file.read()
        user_id = session.get('user_id')  # Assuming user authentication is handled

        if user_id:
            conn = sqlite3.connect('chat.db')
            c = conn.cursor()
            c.execute("UPDATE users SET profile_picture = ? WHERE id = ?", (profile_picture_data, user_id))
            conn.commit()
            conn.close()

            flash('Profile picture updated successfully')
            return redirect(url_for('index'))
        else:
            flash('User not logged in')
            return redirect(url_for('index'))
    else:
        flash('Invalid file format. Only images allowed.')
        return redirect(url_for('index'))
    
@app.route('/profile_picture/<int:user_id>')
def get_profile_picture(user_id):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT profile_picture FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()

    if row and row[0]:
        return send_file(io.BytesIO(row[0]), mimetype='img/jpeg/jpg/png')  # Assuming images are stored as JPEG
    else:
        return send_file('D:/Github/Projects/Msg/static/default_profile.jpg', mimetype='img/jpeg/jpg/png')  
    

#------------------------------------UPDATE PROFILE PIC------------------------------------------------

# Route to upload/change profile picture
@app.route("/update-profile-picture", methods=["POST"])
def update_profile_picture():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "User not logged in"}), 401

    user_id = session["user_id"]
    
    if "profile_pic" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"})

    file = request.files["profile_pic"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No selected file"})

    image_data = file.read()  # Read image as binary

    try:
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()
        
        # Update profile picture in the database
        cursor.execute("UPDATE users SET profile_picture = ? WHERE id = ?", (image_data, user_id))
        
        conn.commit()  # Save changes
        conn.close()
        
        return jsonify({"success": True, "message": "Profile picture updated successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})



#------------------------------------------------------------------------USERNAME---------------
@app.route("/update-username", methods=["POST"])
def update_username():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "User not logged in"}), 401

    user_id = session["user_id"]
    data = request.get_json()  # Get JSON data
    new_username = data.get("new_username", "").strip()

    if not new_username:
        return jsonify({"success": False, "message": "Username cannot be empty"}), 400

    try:
        conn = sqlite3.connect('chat.db')
        cursor = conn.cursor()

        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (new_username,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"success": False, "message": "Username already taken"}), 409

        # Update username
        cursor.execute("UPDATE users SET username = ? WHERE id = ?", (new_username, user_id))
        conn.commit()

        # Update session username (important!)
        session["username"] = new_username

        return jsonify({"success": True, "message": "Username updated successfully!"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

#----------------------------------------------

# Function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}

# Function to determine media type
def get_media_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    return 'image' if ext in {'png', 'jpg', 'jpeg', 'gif'} else 'video'
#------------------------------------------------------------------------------------Admin message--
@app.route('/fetch_user_messages', methods=['GET'])
@login_required
def fetch_user_messages():
    sender_username = request.args.get('sender')
    receiver_username = request.args.get('receiver')

    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()

    # Fetch sender and receiver IDs based on usernames
    cursor.execute("SELECT id FROM users WHERE username = ?", (sender_username,))
    sender = cursor.fetchone()
    cursor.execute("SELECT id FROM users WHERE username = ?", (receiver_username,))
    receiver = cursor.fetchone()
    
    if sender and receiver:
        cursor.execute(''' 
            SELECT u.username, m.message, m.timestamp_utc
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.timestamp_utc
        ''', (sender[0], receiver[0], receiver[0], sender[0]))
        messages = cursor.fetchall()
    else:
        messages = []

    conn.close()

    # Format the messages for output
    formatted_messages = [{'sender': msg[0], 'message': msg[1], 'timestamp': msg[2]} for msg in messages]
    return jsonify(formatted_messages)



#------------

@app.route('/get_active_users_count')
def get_active_users_count():
    return jsonify({
        "count": len(online_users),
        "online_users": list(online_users)  # For debugging
    })

#=======================USER AGREEMENT=============


@app.route('/accept_agreement', methods=['POST'])
@login_required
def accept_agreement():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    
    try:
        # Update agreement status
        current_time = datetime.utcnow().isoformat()
        cursor.execute('''
            UPDATE user_agreements 
            SET accepted = TRUE, accepted_date = ?
            WHERE user_id = ?
        ''', (current_time, current_user.id))
        
        conn.commit()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred'})
    finally:
        conn.close()

@app.route('/check_agreement_status', methods=['GET'])
@login_required
def check_agreement_status():
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT accepted FROM user_agreements WHERE user_id = ?', (current_user.id,))
        agreement = cursor.fetchone()
        
        # Return whether user has accepted agreement
        accepted = agreement and agreement[0] if agreement else False
        return jsonify({'accepted': accepted})
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'accepted': True})  # Default to accepted to avoid infinite loop
    finally:
        conn.close()

#-------------------------ENDPOINT FOR DELETE FEATURE------------------
@app.route('/delete_message', methods=['POST'])
@login_required
def delete_message():
    data = request.json
    message_id = data.get('message_id')
    delete_type = data.get('delete_type')  # 'for_me' or 'for_everyone'
    
    # Fetch the message
    conn = sqlite3.connect('chat.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT sender_id, recipient_id FROM messages WHERE id = ?', (message_id,))
        message = cursor.fetchone()

        if not message:
            return jsonify({'success': False, 'error': 'Message not found'})

        sender_id, recipient_id = message

        # Check permissions based on delete type
        if delete_type == 'for_everyone':
            # Only sender can delete for everyone
            if current_user.id != sender_id:
                return jsonify({
                    'success': False, 
                    'error': 'Only sender can delete for everyone'
                })
            
            # Mark as deleted for everyone in database
            cursor.execute('UPDATE messages SET deleted_for_everyone = 1 WHERE id = ?', (message_id,))
            
            # Also mark as deleted for sender to avoid confusion
            cursor.execute('UPDATE messages SET deleted_for_sender = 1 WHERE id = ?', (message_id,))
            
            # Emit to both users
            socketio.emit('message_deleted', {
                'message_id': message_id, 
                'delete_type': 'for_everyone'
            }, room=str(sender_id))
            
            socketio.emit('message_deleted', {
                'message_id': message_id, 
                'delete_type': 'for_everyone'
            }, room=str(recipient_id))
            
        elif delete_type == 'for_me':
            # Check if user is either sender or recipient
            if current_user.id not in [sender_id, recipient_id]:
                return jsonify({
                    'success': False, 
                    'error': 'You are not allowed to delete this message'
                })
            
            # Mark as deleted for this user only
            if current_user.id == sender_id:
                cursor.execute('UPDATE messages SET deleted_for_sender = 1 WHERE id = ?', (message_id,))
            else:  # user is recipient
                cursor.execute('UPDATE messages SET deleted_for_recipient = 1 WHERE id = ?', (message_id,))
            
            # Emit only to the user who deleted
            socketio.emit('message_deleted', {
                'message_id': message_id, 
                'delete_type': 'for_me'
            }, room=str(current_user.id))
            
        else:
            return jsonify({'success': False, 'error': 'Invalid delete type'})

        conn.commit()
        return jsonify({'success': True})
        
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    socketio.run(app, debug=True, port=3000)

