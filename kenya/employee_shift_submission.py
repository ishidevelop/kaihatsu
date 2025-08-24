import mysql.connector
from flask import Blueprint, request, jsonify

# FlaskのBlueprintを作成
employee_shift_bp = Blueprint('employee_shift_submission', __name__)

# --- データベース初期化関数 ---
# db_configを引数として受け取るように変更
def init_db(db_config):
    """データベースを初期化し、希望シフトテーブルを作成します。"""
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # MySQLのCREATE TABLE文に修正
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
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- APIエンドポイント ---
@employee_shift_bp.route('/shifts', methods=['POST'])
def submit_employee_preference():
    shift_period = request.args.get('period') 
    if not shift_period:
        return jsonify({"error": "シフト期間 (period) が指定されていません。"}), 400

    shift_entries = request.get_json()
    if not isinstance(shift_entries, list):
        return jsonify({"error": "シフトデータはリスト形式である必要があります。"}), 405
    
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**employee_shift_bp.db_config)
        cursor = conn.cursor()
        
        usernames_in_data = set(entry.get('userName') for entry in shift_entries if isinstance(entry, dict) and 'userName' in entry)
        if len(usernames_in_data) > 1:
            return jsonify({"error": "複数のユーザーのシフトが同時に提出されています。各ユーザーは個別にシフトを提出してください。"}), 410
        target_username = list(usernames_in_data)[0] if usernames_in_data else None

        if target_username:
            # SQL文のプレースホルダーを%sに変更
            cursor.execute('''
                DELETE FROM preferred_shifts 
                WHERE username = %s AND shift_period = %s 
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

                # SQL文のプレースホルダーを%sに変更
                cursor.execute('''
                    INSERT INTO preferred_shifts 
                    (username, shift_period, shift_date, time) 
                    VALUES (%s, %s, %s, %s)
                ''', (username, shift_period, shift_date, time))
        
        conn.commit()
        return jsonify({"message": "希望シフトを受け付けました"}), 200

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
