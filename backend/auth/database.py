
import sqlite3
from datetime import datetime

DB_NAME = "users.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            provider TEXT NOT NULL,
            provider_user_id TEXT,
            display_name TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def create_or_update_user(user_info: dict):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    email = user_info.get("email")
    provider = user_info.get("provider")
    provider_user_id = user_info.get("sub") or user_info.get("id")
    name = user_info.get("name")
    
    # Admin Logic
    role = 'user'
    if email == 'kshitij.betwal@gmail.com' or name == 'theNeuralHorizon':
        role = 'admin'
    
    cursor.execute("SELECT * FROM users WHERE email = ? AND provider = ?", (email, provider))
    existing_user = cursor.fetchone()
    
    now = datetime.utcnow()
    
    if existing_user:
        # Update login time and ensure admin role is set if matches
        current_role = existing_user[5] # index of role
        new_role = 'admin' if (role == 'admin') else current_role

        cursor.execute("UPDATE users SET last_login = ?, display_name = ?, provider_user_id = ?, role = ? WHERE id = ?", 
                       (now, name, provider_user_id, new_role, existing_user[0]))
        user_id = existing_user[0]
        final_role = new_role
    else:
        cursor.execute("INSERT INTO users (email, provider, provider_user_id, display_name, role, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                       (email, provider, provider_user_id, name, role, now, now))
        user_id = cursor.lastrowid
        final_role = role
        
    conn.commit()
    conn.close()
    
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "provider": provider,
        "role": final_role
    }
