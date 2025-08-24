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
            CREATE TABLE IF NOT EXISTS final_shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                shift_period VARCHAR(255) NOT NULL, 
                shift_date DATE NOT NULL,
                shift_time VARCHAR(255) NOT NULL,
                note TEXT,
                UNIQUE(username, shift_period, shift_date, shift_time)
            )
        ''')
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@employee_final_shift_view_bp.route('/final-shifts', methods=['GET'])
def get_final_shifts():
    shift_period = request.args.get('period') 

    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**employee_final_shift_view_bp.db_config)
        cursor = conn.cursor()
        
        # SQL文のプレースホルダーを%sに変更し、is_freeカラムを削除
        cursor.execute('''
            SELECT username, shift_date, shift_time, note 
            FROM final_shifts
            WHERE shift_period = %s
            ORDER BY shift_date ASC, shift_time ASC
        ''', (shift_period,)) 
        
        all_final_shifts_from_db = cursor.fetchall() 

        if not all_final_shifts_from_db:
             return jsonify([]), 200
        
        formatted_shifts = []
        # formatted_timeを使用せず、timeをそのまま使用
        for username, shift_date, shift_time, note in all_final_shifts_from_db:
            
            formatted_shifts.append({
                "userName": username,
                "date": str(shift_date),
                "time": shift_time,
                "note": note if note is not None else ""
            })

        return jsonify(formatted_shifts), 200

    except mysql.connector.Error as e:
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"処理中に予期せぬエラーが発生しました: {e}"}), 505
    finally:
        if conn and conn.is_connected():
            conn.close()
