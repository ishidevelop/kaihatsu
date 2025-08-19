import sqlite3
from flask import Blueprint, request, jsonify

employee_final_shift_view_bp = Blueprint('employee_final_shift_view', __name__)

DATABASE = 'shift_requestsv2.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
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

@employee_final_shift_view_bp.route('/final-shifts', methods=['GET'])
def get_final_shifts():
    shift_period = request.args.get('period') 

    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT username, shift_date, shift_time, note 
            FROM final_shifts
            WHERE shift_period = ?
            ORDER BY shift_date ASC, shift_time ASC
        ''', (shift_period,)) 
        
        all_final_shifts_from_db = cursor.fetchall() 

        if not all_final_shifts_from_db:
             return jsonify([]), 200
        
        formatted_shifts = []
        for username, shift_date, shift_time, note in all_final_shifts_from_db:
            
            formatted_shifts.append({
                "userName": username,
                "date": shift_date,
                "time": shift_time,
                "note": note if note is not None else ""
            })
        
        return jsonify(formatted_shifts), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 505
    finally:
        conn.close()