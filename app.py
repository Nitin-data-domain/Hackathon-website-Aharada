from flask import Flask, request, jsonify, send_from_directory, Response
import sqlite3
import json
import os
import time
import re
import csv
import io
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='.', static_url_path='')

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

def get_db_connection():
    conn = sqlite3.connect('registrations.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create the teams table to store registration responses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leader_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            college TEXT NOT NULL,
            team_name TEXT NOT NULL,
            problem_statement TEXT NOT NULL,
            proposed_solution TEXT NOT NULL DEFAULT "",
            team_size INTEGER NOT NULL,
            members TEXT NOT NULL,
            leader_year TEXT NOT NULL DEFAULT "1st Year",
            transaction_id TEXT NOT NULL DEFAULT "",
            payment_screenshot TEXT NOT NULL DEFAULT "",
            payment_status TEXT NOT NULL DEFAULT "Pending",
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Safe migration: add any missing columns if table already existed
    columns_to_add = [
        ('proposed_solution', 'TEXT NOT NULL DEFAULT ""'),
        ('leader_year', 'TEXT NOT NULL DEFAULT "1st Year"'),
        ('transaction_id', 'TEXT NOT NULL DEFAULT ""'),
        ('payment_screenshot', 'TEXT NOT NULL DEFAULT ""'),
        ('payment_status', 'TEXT NOT NULL DEFAULT "Pending"')
    ]
    for col, col_type in columns_to_add:
        try:
            cursor.execute(f'ALTER TABLE teams ADD COLUMN {col} {col_type}')
        except sqlite3.OperationalError:
            pass  # Column already exists
            
    conn.commit()
    conn.close()

# Serve index.html
@app.route('/')
def index():
    return app.send_static_file('index.html')

# Serve admin.html
@app.route('/admin')
def admin():
    return app.send_static_file('admin.html')

# Serve uploaded screenshots
@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# API Endpoint to handle team registrations with payment proof & variation check
@app.route('/api/register', methods=['POST'])
def register():
    try:
        # Check if request is multipart/form-data or application/json
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            # Parse members JSON if sent as string
            members_raw = data.get('members', '[]')
            try:
                members = json.loads(members_raw)
            except Exception:
                members = []
                
            screenshot_file = request.files.get('paymentScreenshot')
            screenshot_filename = ''
            if screenshot_file and screenshot_file.filename != '':
                ext = os.path.splitext(screenshot_file.filename)[1].lower()
                clean_team = re.sub(r'[^a-zA-Z0-9]', '_', data.get('teamName', 'team'))
                timestamp = int(time.time())
                screenshot_filename = f"pay_{clean_team}_{timestamp}{ext}"
                screenshot_file.save(os.path.join(app.config['UPLOAD_FOLDER'], screenshot_filename))
        else:
            data = request.get_json(silent=True) or {}
            members = data.get('members', [])
            screenshot_filename = data.get('paymentScreenshot', '')

        leader_name = data.get('leaderName', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        college = data.get('college', '').strip()
        team_name = data.get('teamName', '').strip()
        problem_statement = data.get('problemStatement', '').strip()
        proposed_solution = data.get('proposedSolution', '').strip()
        team_size = int(data.get('teamSize', 3))
        leader_year = data.get('leaderYear', '1st Year').strip()
        transaction_id = data.get('transactionId', '').strip()

        # Validate mandatory fields
        if not (leader_name and email and phone and college and team_name and problem_statement):
            return jsonify({"status": "error", "message": "All required team information must be provided."}), 400

        # Validate team variation: At least one member must be from a different year
        all_years = [leader_year]
        for m in members:
            m_year = m.get('year', '').strip()
            if m_year:
                all_years.append(m_year)

        if len(set(all_years)) < 2:
            return jsonify({
                "status": "error",
                "message": "Team variation requirement not met: At least one member must be from a different academic year (e.g. 1st year + 2nd year). Teams cannot be composed entirely of students from the same year."
            }), 400

        # Insert record into database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO teams (
                leader_name, email, phone, college, team_name, problem_statement,
                proposed_solution, team_size, members, leader_year, transaction_id,
                payment_screenshot, payment_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            leader_name,
            email,
            phone,
            college,
            team_name,
            problem_statement,
            proposed_solution,
            team_size,
            json.dumps(members),
            leader_year,
            transaction_id,
            screenshot_filename,
            'Pending'
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Registration and payment submission completed successfully!",
            "teamId": new_id
        }), 201

    except Exception as e:
        print("Error during registration:", str(e))
        return jsonify({"status": "error", "message": f"Registration failed: {str(e)}"}), 500

# View all registrations (backward-compatible)
@app.route('/api/view-registrations', methods=['GET'])
def view_registrations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM teams ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()

    registrations = []
    for row in rows:
        r = dict(row)
        try:
            r['members'] = json.loads(r['members']) if r.get('members') else []
        except Exception:
            r['members'] = []
        registrations.append(r)

    return jsonify({"total": len(registrations), "data": registrations}), 200

# Dedicated Admin API for full dashboard stats & team list
@app.route('/api/admin/registrations', methods=['GET'])
def admin_registrations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM teams ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()

    teams = []
    total_participants = 0
    verified_count = 0
    pending_count = 0
    tracks_distribution = {}
    colleges_distribution = {}

    for row in rows:
        t = dict(row)
        try:
            t['members'] = json.loads(t['members']) if t.get('members') else []
        except Exception:
            t['members'] = []

        total_participants += int(t.get('team_size') or 3)
        status = t.get('payment_status') or 'Pending'
        if status == 'Verified':
            verified_count += 1
        else:
            pending_count += 1

        track = t.get('problem_statement') or 'Unspecified'
        tracks_distribution[track] = tracks_distribution.get(track, 0) + 1

        college = t.get('college') or 'Unknown'
        colleges_distribution[college] = colleges_distribution.get(college, 0) + 1

        teams.append(t)

    stats = {
        "total_teams": len(teams),
        "total_participants": total_participants,
        "verified_payments": verified_count,
        "pending_payments": pending_count,
        "total_revenue": len(teams) * 500,
        "verified_revenue": verified_count * 500,
        "tracks": tracks_distribution,
        "colleges": colleges_distribution
    }

    return jsonify({"status": "success", "stats": stats, "data": teams}), 200

# Admin API to verify or update payment status
@app.route('/api/admin/verify-payment', methods=['POST'])
def verify_payment():
    try:
        data = request.json or {}
        team_id = data.get('teamId')
        new_status = data.get('status', 'Verified')

        if not team_id:
            return jsonify({"status": "error", "message": "teamId is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE teams SET payment_status = ? WHERE id = ?', (new_status, team_id))
        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": f"Payment marked as {new_status}"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Admin API to delete a team
@app.route('/api/admin/delete-team/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM teams WHERE id = ?', (team_id,))
        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Team deleted successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Admin API to export registrations as CSV
@app.route('/api/admin/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM teams ORDER BY id ASC')
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # CSV Header
    writer.writerow([
        'Team ID', 'Team Name', 'Team Size', 'Problem Statement',
        'Leader Name', 'Leader Year', 'Leader Email', 'Leader Phone', 'College',
        'Member 2 Name', 'Member 2 Year', 'Member 2 Email', 'Member 2 Phone',
        'Member 3 Name', 'Member 3 Year', 'Member 3 Email', 'Member 3 Phone',
        'Member 4 Name', 'Member 4 Year', 'Member 4 Email', 'Member 4 Phone',
        'Member 5 Name', 'Member 5 Year', 'Member 5 Email', 'Member 5 Phone',
        'Transaction ID (UTR)', 'Payment Screenshot File', 'Payment Status',
        'Proposed Solution', 'Registration Timestamp'
    ])

    for row in rows:
        r = dict(row)
        try:
            members = json.loads(r.get('members', '[]'))
        except Exception:
            members = []

        m_cells = []
        for i in range(4): # up to 4 additional members (members 2 to 5)
            if i < len(members):
                m = members[i]
                m_cells.extend([m.get('name', ''), m.get('year', ''), m.get('email', ''), m.get('phone', '')])
            else:
                m_cells.extend(['', '', '', ''])

        writer.writerow([
            r.get('id'),
            r.get('team_name'),
            r.get('team_size'),
            r.get('problem_statement'),
            r.get('leader_name'),
            r.get('leader_year', '1st Year'),
            r.get('email'),
            r.get('phone'),
            r.get('college'),
            *m_cells,
            r.get('transaction_id', ''),
            r.get('payment_screenshot', ''),
            r.get('payment_status', 'Pending'),
            r.get('proposed_solution', ''),
            r.get('registration_date')
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=aharada_hackathon_registrations.csv"}
    )

if __name__ == '__main__':
    init_db()
    print("Database initialized.")
    print("Starting Aharada Kaushal Kumbh Backend Server...")
    app.run(port=5000, debug=True)
