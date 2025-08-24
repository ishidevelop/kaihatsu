import mysql.connector
from flask import Blueprint, request, jsonify

draft_shift_bp = Blueprint('draft_shift_saver', __name__)

# init_db関数は、main.pyからdb_configを引数として受け取る
def init_db(db_config):
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # MySQLのCREATE TABLE文に修正
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS draft_shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                shift_period VARCHAR(255) NOT NULL,
                shift_date DATE NOT NULL,
                shift_time VARCHAR(255) NOT NULL,
                note TEXT
            )
        ''')
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@draft_shift_bp.route('/draft-shifts', methods=['POST'])
def save_draft_shifts():
    shift_period = request.args.get('period') 
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    shift_entries = request.get_json()

    if not isinstance(shift_entries, list):
        return jsonify({"error": "シフトデータはリスト形式である必要があります。"}), 405
    
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**draft_shift_bp.db_config)
        cursor = conn.cursor()
        
        usernames_in_data = set(entry.get('userName') for entry in shift_entries if isinstance(entry, dict) and 'userName' in entry)
        if usernames_in_data:
            # SQL文のプレースホルダーを%sに変更
            placeholders = ', '.join(['%s'] * len(usernames_in_data))
            cursor.execute(f'''
                DELETE FROM draft_shifts 
                WHERE username IN ({placeholders}) AND shift_period = %s 
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

                # SQL文のプレースホルダーを%sに変更
                cursor.execute('''
                    INSERT INTO draft_shifts 
                    (username, shift_period, shift_date, shift_time, note) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (username, shift_period, shift_date, shift_time, note))
        
        conn.commit()
        return jsonify({"message": "ドラフトシフトを保存しました"}), 200

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

@draft_shift_bp.route('/draft-shifts', methods=['GET'])
def get_draft_shifts():
    shift_period = request.args.get('period')
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 415

    conn = None
    try:
        conn = mysql.connector.connect(**draft_shift_bp.db_config)
        cursor = conn.cursor()
        
        # SQL文のプレースホルダーを%sに変更
        cursor.execute('''
            SELECT username, shift_date, shift_time, note 
            FROM draft_shifts 
            WHERE shift_period = %s
            ORDER BY shift_date ASC, shift_time ASC
                ''', (shift_period,))
        
        all_draft_shifts_from_db = cursor.fetchall()
        
        formatted_shifts = []
        for username, shift_date, shift_time, note in all_draft_shifts_from_db:
            formatted_shifts.append({
                "userName": username,
                "date": str(shift_date),
                "time": shift_time,
                "note": note if note is not None else ""
            })
            
        return jsonify(formatted_shifts), 200
        
    except mysql.connector.Error as e:
        return jsonify({"error": f"データベースエラー: {e}"}), 510
    except Exception as e:
        return jsonify({"error": f"処理中にエラーが発生しました: {e}"}), 515
    finally:
        if conn and conn.is_connected():
            conn.close()
