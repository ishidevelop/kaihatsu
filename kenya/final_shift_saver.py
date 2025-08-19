import sqlite3
from flask import Blueprint, request, jsonify

final_shift_saver_bp = Blueprint('final_shift_saver', __name__)

DATABASE = 'shift_requestsv2.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # final_shiftsテーブルの定義を修正
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS final_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            shift_period TEXT NOT NULL, 
            shift_date TEXT NOT NULL,
            shift_time TEXT NOT NULL,
            note TEXT,
            UNIQUE(username, shift_period, shift_date, shift_time)
        )
    ''')
    
    conn.commit()
    conn.close()

@final_shift_saver_bp.route('/final-shifts', methods=['POST'])
def save_final_shift():
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
                DELETE FROM final_shifts 
                WHERE shift_period = ? AND username IN ({placeholders})
            ''', (shift_period, *list(usernames_in_data)))

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
                    INSERT INTO final_shifts 
                    (username, shift_period, shift_date, shift_time, note) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (username, shift_period, shift_date, shift_time, note))
        
        conn.commit()
        return jsonify({"message": "最終シフトを保存しました"}), 200

    except sqlite3.Error as e:
        conn.rollback() 
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        conn.rollback() 
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 505
    finally:
        conn.close()