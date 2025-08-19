from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS

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

# --- データベース設定 ---
# 全てのinit_db関数で共通のデータベースパスを使用
DATABASE = 'shift_requestsv2.db'

# --- データベース初期化処理 ---
# アプリケーション起動時に、全てのテーブルが作成されるように各init_dbを呼び出す
def initialize_all_databases():
    """全てのデータベーステーブルを初期化します。"""
    print("データベースの初期化を開始します...")
    init_employee_shift_db()
    init_dashboard_db()
    init_final_shift_db()
    init_employee_final_shift_db() # final_shift_view.py の init_db も呼び出し
    init_management_db()
    init_draft_shift_db()
    print("データベースの初期化が完了しました。")

# アプリケーションコンテキスト内でデータベース初期化を実行
# これにより、Flaskアプリケーションの実行環境が整った状態でDB操作が行われます。
with app.app_context():
    initialize_all_databases()

# --- 各Blueprintの登録 ---
# これにより、各ファイルのAPIエンドポイントがメインアプリケーションから利用可能になります。
app.register_blueprint(employee_shift_bp)
app.register_blueprint(shift_dashboard_bp)
app.register_blueprint(final_shift_saver_bp)
app.register_blueprint(employee_final_shift_view_bp)
app.register_blueprint(employee_management_bp)
app.register_blueprint(draft_shift_bp)

# --- ルートの例（必要であれば追加） ---
@app.route('/')
def home():
    return "シフト管理アプリのバックエンドが稼働中です！"

# --- アプリケーションの起動 ---
if __name__ == '__main__':
    # debug=True は開発用です。本番環境では必ずFalseにしてください。
    # host='0.0.0.0' は外部からのアクセスを許可します。
    # port はサーバーが待機するポート番号です。
    app.run(debug=True, host='0.0.0.0', port= 5000)