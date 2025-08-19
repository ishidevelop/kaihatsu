import sqlite3
from flask import Blueprint, request, jsonify

shift_dashboard_bp = Blueprint('shift_dashboard_data', __name__)

DATABASE = 'shift_requestsv2.db'

# --- データベース初期化関数 (preferred_shiftsテーブルの変更を反映) ---
def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preferred_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            shift_period TEXT NOT NULL,
            shift_date TEXT NOT NULL,
            time TEXT NOT NULL,
            UNIQUE(username, shift_period, shift_date, time, is_free)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS required_staff_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shift_period TEXT NOT NULL, 
            shift_date TEXT NOT NULL,
            headcount INTEGER NOT NULL,
            UNIQUE(shift_period, shift_date) 
        )
    ''')
    conn.commit()
    conn.close()

# --- APIエンドポイント ---
@shift_dashboard_bp.route('/shifts', methods=['GET'])
def get_shift_dashboard_data():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    shift_period = request.args.get('period')
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    # 取得カラムからend_timeを削除し、is_freeを追加
    cursor.execute('''
        SELECT id, username, shift_date, time
        FROM preferred_shifts 
        WHERE shift_period = ?
    ''', (shift_period,))
    all_preferred_shifts_from_db = cursor.fetchall()

    if not all_preferred_shifts_from_db:
             return jsonify([]), 200
    
    conn.close()

    flat_shifts_list = []
    
    for shift_id, username, dd, time in all_preferred_shifts_from_db:
        
        flat_shifts_list.append({
            "id": shift_id,
            "userName": username,
            "date": dd,
            "time": time,
            "note": "" # preferred_shiftsテーブルにはnoteがないため空文字列
        })
    
    return jsonify(flat_shifts_list)