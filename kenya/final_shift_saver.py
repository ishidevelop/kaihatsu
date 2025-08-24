import mysql.connector
from flask import Blueprint, request, jsonify

final_shift_saver_bp = Blueprint('final_shift_saver', __name__)

# init_db関数は、main.pyからdb_configを引数として受け取る
def init_db(db_config):
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # MySQLのCREATE TABLE文に修正
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS final_shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                shift_period VARCHAR(255) NOT NULL, 
                shift_date DATE NOT NULL,
                shift_time VARCHAR(255) NOT NULL,
                note VARCHAR(255),
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

@final_shift_saver_bp.route('/final-shifts', methods=['POST'])
def save_final_shift():
    shift_period = request.args.get('period')
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    shift_entries = request.get_json()
    if not isinstance(shift_entries, list):
        return jsonify({"error": "シフトデータはリスト形式である必要があります。"}), 405
    
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**final_shift_saver_bp.db_config)
        cursor = conn.cursor()

        usernames_in_data = set(entry.get('userName') for entry in shift_entries if isinstance(entry, dict) and 'userName' in entry)

        if usernames_in_data:
            placeholders = ', '.join(['%s'] * len(usernames_in_data))
            # SQL文のプレースホルダーを%sに変更
            cursor.execute(f'''
                DELETE FROM final_shifts 
                WHERE shift_period = %s AND username IN ({placeholders})
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
                
                # SQL文のプレースホルダーを%sに変更
                cursor.execute('''
                    INSERT INTO final_shifts 
                    (username, shift_period, shift_date, shift_time, note) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (username, shift_period, shift_date, shift_time, note))
        
        conn.commit()
        return jsonify({"message": "最終シフトを保存しました"}), 200

    except mysql.connector.Error as e:
        if conn and conn.is_connected():
            conn.rollback() 
        return jsonify({"error": f"データベースエラー: {e}"}), 500
    except Exception as e:
        if conn and conn.is_connected():
            conn.rollback() 
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 505
    finally:
        if conn and conn.is_connected():
            conn.close()
