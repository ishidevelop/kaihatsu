import sqlite3
from flask import Blueprint, request, jsonify

draft_shift_bp = Blueprint('draft_shift_saver', __name__)

DATABASE = 'shift_requestsv2.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # draft_shiftsテーブルからend_timeカラムを削除
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS draft_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            shift_period TEXT NOT NULL,
            shift_date TEXT NOT NULL,
            shift_time TEXT NOT NULL,
            note TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

@draft_shift_bp.route('/draft-shifts', methods=['POST'])
def save_draft_shifts():
    shift_period = request.args.get('period') 
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    shift_entries = request.get_json()

    if not isinstance(shift_entries, list):
        return jsonify({"error": "シフトデータはリスト形式である必要があります。"}), 405
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        usernames_in_data = set(entry.get('userName') for entry in shift_entries if isinstance(entry, dict) and 'userName' in entry)
        if usernames_in_data:
            placeholders = ','.join(['?' for _ in usernames_in_data])
            cursor.execute(f'''
                DELETE FROM draft_shifts 
                WHERE username IN ({placeholders}) AND shift_period = ? 
            ''', (*list(usernames_in_data), shift_period))

        if shift_entries:
            for entry in shift_entries:
                username = entry.get('userName')
                shift_date = entry.get('date')
                shift_time = entry.get('time')
                note = entry.get('note')

                if not all([username, shift_date, shift_time]):
                    conn.rollback()
                    return jsonify({"error": f"シフトエントリに必須項目が不足しています: {entry}"}), 410

                
                cursor.execute('''
                    INSERT INTO draft_shifts 
                    (username, shift_period, shift_date, shift_time, note) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (username, shift_period, shift_date, shift_time, note))
        
        conn.commit()
        return jsonify({"message": "ドラフトシフトを保存しました"}), 200

    except sqlite3.Error as e:
        conn.rollback() 
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        conn.rollback() 
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 505
    finally:
        conn.close()

@draft_shift_bp.route('/draft-shifts', methods=['GET'])
def get_draft_shifts():
    shift_period = request.args.get('period')
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 415

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT username, shift_date, shift_time, note 
            FROM draft_shifts 
            WHERE shift_period = ?
            ORDER BY shift_date ASC, shift_time ASC
        ''', (shift_period,))
        
        all_draft_shifts_from_db = cursor.fetchall()

        if not all_draft_shifts_from_db:
             return jsonify([]), 200
        
        formatted_shifts = []
        for username, shift_date, shift_time, note in all_draft_shifts_from_db:
            formatted_shifts.append({
                "userName": username,
                "date": shift_date,
                "time": shift_time,
                "note": note if note is not None else ""
            })
            
        return jsonify(formatted_shifts), 205
        
    except sqlite3.Error as e:
        return jsonify({"error": f"データベースエラー: {e}"}), 510
    except Exception as e:
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 515
    finally:
        conn.close()