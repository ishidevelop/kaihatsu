import mysql.connector
from flask import Blueprint, request, jsonify

shift_dashboard_bp = Blueprint('shift_dashboard_data', __name__)

# --- データベース初期化関数 (preferred_shiftsテーブルの変更を反映) ---
def init_db(db_config):
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # MySQLのCREATE TABLE文に修正し、is_freeカラムをUNIQUE制約から削除
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS preferred_shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                shift_period VARCHAR(255) NOT NULL,
                shift_date DATE NOT NULL,
                time VARCHAR(255) NOT NULL,
                UNIQUE(username, shift_period, shift_date, time)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS required_staff_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shift_period VARCHAR(255) NOT NULL, 
                shift_date DATE NOT NULL,
                headcount INT NOT NULL,
                UNIQUE(shift_period, shift_date) 
            )
        ''')
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- APIエンドポイント ---
@shift_dashboard_bp.route('/shifts', methods=['GET'])
def get_shift_dashboard_data():
    conn = None
    try:
        conn = mysql.connector.connect(**shift_dashboard_bp.db_config)
        cursor = conn.cursor()
        
        shift_period = request.args.get('period')
        if not shift_period:
            return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

        # SQL文のプレースホルダーを%sに変更
        cursor.execute('''
            SELECT id, username, shift_date, time
            FROM preferred_shifts 
            WHERE shift_period = %s
        ''', (shift_period,))
        all_preferred_shifts_from_db = cursor.fetchall()
        
        if not all_preferred_shifts_from_db:
            return jsonify([]), 200
        
        flat_shifts_list = []
        
        for shift_id, username, dd, time in all_preferred_shifts_from_db:

            flat_shifts_list.append({
                "id": shift_id,
                "userName": username,
                "date": str(dd), # DATE型は文字列に変換
                "time": time,
                "note": "" # preferred_shiftsテーブルにはnoteがないため空文字列
            })
        
        return jsonify(flat_shifts_list), 200
    
    except mysql.connector.Error as e:
        if conn and conn.is_connected():
            conn.rollback()
        return jsonify({"error": f"データベースエラーが発生しました: {e}"}), 500
    except Exception as e:
        if conn and conn.is_connected():
            conn.rollback()
        return jsonify({"error": f"処理中に予期せぬエラーが発生しました: {e}"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
