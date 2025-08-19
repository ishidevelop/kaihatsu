import sqlite3
from flask import Blueprint, request, jsonify

# FlaskのBlueprintを作成
employee_shift_bp = Blueprint('employee_shift_submission', __name__)

# --- データベース設定 ---
DATABASE = 'shift_requestsv2.db' # SQLiteデータベースファイルのパス

# --- データベース初期化関数 ---
def init_db():
    """データベースを初期化し、希望シフトテーブルを作成します。"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # preferred_shiftsテーブルからend_timeカラムを削除し、is_freeカラムを追加
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preferred_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            shift_period TEXT NOT NULL,
            shift_date TEXT NOT NULL,
            time TEXT NOT NULL, -- start_timeをtimeに名称変更
            UNIQUE(username, shift_period, shift_date, time) 
        )
    ''')
    
    conn.commit()
    conn.close()

# --- APIエンドポイント ---
@employee_shift_bp.route('/shifts', methods=['POST'])
def submit_employee_preference():
    """
    従業員が希望シフトを提出するためのAPI。
    期間はクエリパラメータから取得し、シフトデータはリクエストボディから取得します。
    """
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
        if len(usernames_in_data) > 1:
            return jsonify({"error": "複数のユーザーのシフトが同時に提出されています。各ユーザーは個別にシフトを提出してください。"}), 410
        target_username = list(usernames_in_data)[0] if usernames_in_data else None

        if target_username:
            cursor.execute('''
                DELETE FROM preferred_shifts 
                WHERE username = ? AND shift_period = ? 
            ''', (target_username, shift_period))

        if shift_entries:
            for entry in shift_entries:
                username = entry.get('userName')
                shift_date = entry.get('date')
                time = entry.get('time')

                if not all([username, shift_date, time]):
                    conn.rollback()
                    return jsonify({"error": f"シフトエントリに必須項目が不足しています: {entry}"}), 415
                
                if username != target_username:
                    conn.rollback()
                    return jsonify({"error": f"提出されたシフトデータに不正なユーザー名 '{username}' が含まれています。"}), 420

                cursor.execute('''
                    INSERT INTO preferred_shifts 
                    (username, shift_period, shift_date, time) 
                    VALUES (?, ?, ?, ?)
                ''', (username, shift_period, shift_date, time))
        
        conn.commit()
        return jsonify({"message": "希望シフトを受け付けました"}), 200

    except sqlite3.Error as e:
        conn.rollback() 
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        conn.rollback() 
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 505
    finally:
        conn.close()