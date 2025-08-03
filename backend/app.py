from flask import Flask, request, jsonify, send_from_directory
import json
import os
from mood_detect import detect_mood

app = Flask(__name__, static_folder='../frontend', static_url_path='/')

DATA_DIR = 'data'
DATA_FILE = os.path.join(DATA_DIR, 'users.json')

# Ensure data directory and file exist
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.isfile(DATA_FILE):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

def load_users():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return app.send_static_file(path)

@app.route('/api/mood_detect', methods=['POST'])
def mood_detect_api():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    audio_file = request.files['audio']

    if audio_file.filename == '':
        return jsonify({'error': 'Empty audio file'}), 400

    try:
        mood = detect_mood(audio_file)
        return jsonify({'mood': mood})
    except Exception as e:
        return jsonify({'error': 'Mood detection failed', 'details': str(e)}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json(force=True)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    users = load_users()
    if any(u['username'].lower() == username.lower() for u in users):
        return jsonify({'error': 'Username already exists'}), 400

    users.append({'username': username, 'password': password})
    save_users(users)
    return jsonify({'message': 'Signup successful'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    users = load_users()
    for user in users:
        if user['username'].lower() == username.lower() and user['password'] == password:
            return jsonify({'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    users = load_users()
    # Don't expose passwords
    users_public = [{'username': u['username']} for u in users]
    return jsonify(users_public)

@app.route('/api/users/delete', methods=['POST'])
def delete_user():
    data = request.get_json(force=True)
    username = data.get('username', '').strip()

    if not username:
        return jsonify({'error': 'Username required'}), 400

    users = load_users()
    new_users = [u for u in users if u['username'].lower() != username.lower()]

    if len(new_users) == len(users):
        return jsonify({'error': 'User not found'}), 404

    save_users(new_users)
    return jsonify({'message': f'User "{username}" deleted successfully'})

@app.route('/api/users/export', methods=['GET'])
def export_users():
    users = load_users()
    csv_data = "username,password\n"
    for u in users:
        # Escape commas or newlines if needed here (simple version)
        csv_data += f"{u['username']},{u['password']}\n"
    headers = {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=users.csv'
    }
    return csv_data, 200, headers

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
