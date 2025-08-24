from flask import Flask, jsonify
import mysql.connector
from flask_cors import CORS
from src import DB_CONFIG # ここでsrc.pyからインポート

# 各Blueprintモジュールをインポート
from employee_shift_submission import employee_shift_bp, init_db as init_employee_shift_db
from shift_dashboard_data import shift_dashboard_bp, init_db as init_dashboard_db
from final_shift_saver import final_shift_saver_bp, init_db as init_final_shift_db
from employee_final_shift_view import employee_final_shift_view_bp, init_db as init_employee_final_shift_db
from employee_management import employee_management_bp, init_db as init_management_db
from draft_shift_saver import draft_shift_bp, init_db as init_draft_shift_db

# Flaskアプリケーションのインスタンスを作成
app = Flask(__name__)
CORS(app)

# --- データベース初期化処理 ---
def initialize_all_databases():
    """全てのデータベーステーブルを初期化します。"""
    print("データベースの初期化を開始します...")
    init_employee_shift_db(DB_CONFIG)
    init_dashboard_db(DB_CONFIG)
    init_final_shift_db(DB_CONFIG)
    init_employee_final_shift_db(DB_CONFIG)
    init_management_db(DB_CONFIG)
    init_draft_shift_db(DB_CONFIG)
    print("データベースの初期化が完了しました。")

# アプリケーションコンテキスト内でデータベース初期化を実行
with app.app_context():
    initialize_all_databases()

# --- 各Blueprintの登録 ---
app.register_blueprint(employee_shift_bp)
app.register_blueprint(shift_dashboard_bp)
app.register_blueprint(final_shift_saver_bp)
app.register_blueprint(employee_final_shift_view_bp)
app.register_blueprint(employee_management_bp)
app.register_blueprint(draft_shift_bp)

# --- データベース接続情報を各Blueprintに紐づける ---
employee_shift_bp.db_config = DB_CONFIG
shift_dashboard_bp.db_config = DB_CONFIG
final_shift_saver_bp.db_config = DB_CONFIG
employee_final_shift_view_bp.db_config = DB_CONFIG
employee_management_bp.db_config = DB_CONFIG
draft_shift_bp.db_config = DB_CONFIG

# --- ルートの例 ---
@app.route('/')
def home():
    return "シフト管理アプリのバックエンドが稼働中です！"

# --- アプリケーションの起動 ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
