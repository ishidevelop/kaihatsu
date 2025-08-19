import sqlite3
from flask import Blueprint, request, jsonify

employee_management_bp = Blueprint('employee_management', __name__)

DATABASE = 'shift_requestsv2.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            role TEXT
        )
    ''')
    conn.commit()
    conn.close()

@employee_management_bp.route('/employees', methods=['POST'])
def register_employee():
    data = request.get_json()
    name = data.get('name')
    role = data.get('role')

    if not name or not isinstance(name, str) or name.strip() == '':
        return jsonify({"error": "従業員名 (name) は必須であり、有効な文字列である必要があります。"}), 400
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT id FROM employees WHERE name = ?', (name,))
        if cursor.fetchone():
            return jsonify({"error": f"従業員名 '{name}' は既に登録されています。"}), 409
        cursor.execute('''
            INSERT INTO employees (name, role) 
            VALUES (?, ?)
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
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"データベースエラーが発生しました: {e}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"処理中に予期せぬエラーが発生しました: {e}"}), 500
    finally:
        conn.close()

@employee_management_bp.route('/employees', methods=['GET'])
def get_employees():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
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

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"データベースエラーが発生しました: {e}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"処理中に予期せぬエラーが発生しました: {e}"}), 500
    finally:
        conn.close()


@employee_management_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT name FROM employees WHERE id = ?', (employee_id,))
        if not cursor.fetchone():
            return jsonify({"error": f"ID {employee_id} に該当する従業員が見つかりません。"}), 404
        
        cursor.execute('DELETE FROM employees WHERE id = ?', (employee_id,))
        conn.commit()

        return jsonify({
            "message": "従業員を削除しました"
        }), 200

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"データベースエラーが発生しました: {e}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"処理中に予期せぬエラーが発生しました: {e}"}), 500
    finally:
        conn.close()