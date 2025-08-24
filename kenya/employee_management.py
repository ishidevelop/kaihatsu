import mysql.connector
from flask import Blueprint, request, jsonify

employee_management_bp = Blueprint('employee_management', __name__)

# init_db関数は、main.pyからdb_configを引数として受け取る
def init_db(db_config):
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # MySQLのCREATE TABLE文に修正
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                role VARCHAR(255)
            )
        ''')
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@employee_management_bp.route('/employees', methods=['POST'])
def register_employee():
    data = request.get_json()
    name = data.get('name')
    role = data.get('role')

    if not name or not isinstance(name, str) or name.strip() == '':
        return jsonify({"error": "従業員名 (name) は必須であり、有効な文字列である必要があります。"}), 400
    
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**employee_management_bp.db_config)
        cursor = conn.cursor()

        # SQL文のプレースホルダーを%sに変更
        cursor.execute('SELECT id FROM employees WHERE name = %s', (name,))
        if cursor.fetchone():
            return jsonify({"error": f"従業員名 '{name}' は既に登録されています。"}), 409
        
        cursor.execute('''
            INSERT INTO employees (name, role) 
            VALUES (%s, %s)
        ''', (name.strip(), role))
        
        new_employee_id = cursor.lastrowid
        conn.commit()
        return jsonify({
            "message": f"従業員 '{name}' が正常に登録されました。",
            "employee": {
                "id": new_employee_id,
                "name": name,
                "role": role if role else None
            }
        }), 201
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
            cursor.close()
            conn.close()

@employee_management_bp.route('/employees', methods=['GET'])
def get_employees():
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**employee_management_bp.db_config)
        cursor = conn.cursor()
        
        # SQL文の修正
        cursor.execute('SELECT id, name, role FROM employees ORDER BY name ASC')
        employees_data = cursor.fetchall()
        
        formatted_employees = []
        for emp_id, name, role in employees_data:
            formatted_employees.append({
                "id": emp_id,
                "name": name,
                "role": role if role else "未設定"
            })
        
        return jsonify(formatted_employees), 200

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
            cursor.close()
            conn.close()

@employee_management_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    conn = None
    try:
        # main.pyから渡されたdb_configを使って接続
        conn = mysql.connector.connect(**employee_management_bp.db_config)
        cursor = conn.cursor()

        # SQL文のプレースホルダーを%sに変更
        cursor.execute('SELECT name FROM employees WHERE id = %s', (employee_id,))
        if not cursor.fetchone():
            return jsonify({"error": f"ID {employee_id} に該当する従業員が見つかりません。"}), 404
        
        cursor.execute('DELETE FROM employees WHERE id = %s', (employee_id,))
        conn.commit()

        return jsonify({
            "message": "従業員を削除しました"
        }), 200

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
            cursor.close()
            conn.close()
