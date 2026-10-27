import os
import sqlite3
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL")

def connect():
    if DATABASE_URL:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url)
        conn.cursor_factory = RealDictCursor
        return conn
    else:
        DB_PATH = Path(__file__).with_name("finance.db")
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        return connection

def init_db():
    with connect() as db:
        cursor = db.cursor()
        if DATABASE_URL:
            cursor.execute("CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL, kind TEXT NOT NULL, amount REAL NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS settings (telegram_user_id BIGINT PRIMARY KEY, language TEXT NOT NULL DEFAULT 'ru', currency TEXT NOT NULL DEFAULT 'EUR')")
            cursor.execute("CREATE TABLE IF NOT EXISTS budgets (telegram_user_id BIGINT NOT NULL, category TEXT NOT NULL, limit_amount REAL NOT NULL, emoji TEXT NOT NULL DEFAULT '💰', color TEXT NOT NULL DEFAULT '#22c55e', PRIMARY KEY (telegram_user_id, category))")
            cursor.execute("CREATE TABLE IF NOT EXISTS goals (id SERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL, title TEXT NOT NULL, target_amount REAL NOT NULL, saved_amount REAL NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, UNIQUE(telegram_user_id, name, kind))")
            cursor.execute("CREATE TABLE IF NOT EXISTS recurring_payments (id SERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL, title TEXT NOT NULL, amount REAL NOT NULL, day_of_month INTEGER NOT NULL, category TEXT NOT NULL DEFAULT 'Дом и счета')")
        else:
            cursor.execute("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_user_id INTEGER NOT NULL, kind TEXT NOT NULL, amount REAL NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS settings (telegram_user_id INTEGER PRIMARY KEY, language TEXT NOT NULL DEFAULT 'ru', currency TEXT NOT NULL DEFAULT 'EUR')")
            cursor.execute("CREATE TABLE IF NOT EXISTS budgets (telegram_user_id INTEGER NOT NULL, category TEXT NOT NULL, limit_amount REAL NOT NULL, emoji TEXT NOT NULL DEFAULT '💰', color TEXT NOT NULL DEFAULT '#22c55e', PRIMARY KEY (telegram_user_id, category))")
            cursor.execute("CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_user_id INTEGER NOT NULL, title TEXT NOT NULL, target_amount REAL NOT NULL, saved_amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_user_id INTEGER NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, UNIQUE(telegram_user_id, name, kind))")
            cursor.execute("CREATE TABLE IF NOT EXISTS recurring_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_user_id INTEGER NOT NULL, title TEXT NOT NULL, amount REAL NOT NULL, day_of_month INTEGER NOT NULL, category TEXT NOT NULL DEFAULT 'Дом и счета')")
        db.commit()

# ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ БАЗОВЫХ КАТЕГОРИЙ
def ensure_default_categories(user_id: int):
    default_expense = ['Продукты', 'Дом и счета', 'Транспорт', 'Одежда', 'Здоровье', 'Развлечения', 'Другое']
    default_income = ['Зарплата', 'Подарки', 'Другое']
    
    with connect() as db:
        cursor = db.cursor()
        
        # Правильная проверка для PostgreSQL и SQLite
        if DATABASE_URL:
            cursor.execute("SELECT COUNT(*) as count FROM categories WHERE telegram_user_id = %s", (user_id,))
            count = cursor.fetchone()['count']
        else:
            cursor.execute("SELECT COUNT(*) FROM categories WHERE telegram_user_id = ?", (user_id,))
            count = cursor.fetchone()[0]
            
        if count == 0:
            for name in default_expense:
                try:
                    if DATABASE_URL:
                        cursor.execute("INSERT INTO categories (telegram_user_id, name, kind) VALUES (%s, %s, 'expense')", (user_id, name))
                    else:
                        cursor.execute("INSERT INTO categories (telegram_user_id, name, kind) VALUES (?, ?, 'expense')", (user_id, name))
                except Exception:
                    pass 
            
            for name in default_income:
                try:
                    if DATABASE_URL:
                        cursor.execute("INSERT INTO categories (telegram_user_id, name, kind) VALUES (%s, %s, 'income')", (user_id, name))
                    else:
                        cursor.execute("INSERT INTO categories (telegram_user_id, name, kind) VALUES (?, ?, 'income')", (user_id, name))
                except Exception:
                    pass 
            
            db.commit()

# --- ОСТАЛЬНЫЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ ---
def get_categories(user_id: int, kind: str):
    ensure_default_categories(user_id)
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT id, name FROM categories WHERE telegram_user_id = %s AND kind = %s ORDER BY id" if DATABASE_URL else "SELECT id, name FROM categories WHERE telegram_user_id = ? AND kind = ? ORDER BY id", (user_id, kind))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def add_category(user_id: int, name: str, kind: str):
    with connect() as db:
        cursor = db.cursor()
        try:
            cursor.execute("INSERT INTO categories (telegram_user_id, name, kind) VALUES (%s, %s, %s)" if DATABASE_URL else "INSERT INTO categories (telegram_user_id, name, kind) VALUES (?, ?, ?)", (user_id, name.strip(), kind))
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False

def add_transaction(user_id: int, kind: str, amount: float, category: str, note: str = ""):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("INSERT INTO transactions (telegram_user_id, kind, amount, category, note) VALUES (%s, %s, %s, %s, %s)" if DATABASE_URL else "INSERT INTO transactions (telegram_user_id, kind, amount, category, note) VALUES (?, ?, ?, ?, ?)", (user_id, kind, amount, category, note))
        db.commit()

def delete_transaction(transaction_id: int, user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "DELETE FROM transactions WHERE id = ? AND telegram_user_id = ?", (transaction_id, user_id))
        db.commit()

def get_transactions(user_id: int, limit: int = 100):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT id, kind, amount, category, note, created_at FROM transactions WHERE telegram_user_id = %s ORDER BY id DESC LIMIT %s" if DATABASE_URL else "SELECT id, kind, amount, category, note, created_at FROM transactions WHERE telegram_user_id = ? ORDER BY id DESC LIMIT ?", (user_id, limit))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_summary(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT COALESCE(SUM(CASE WHEN kind='income' THEN amount ELSE 0 END), 0) AS income, COALESCE(SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END), 0) AS expenses FROM transactions WHERE telegram_user_id = %s" if DATABASE_URL else "SELECT COALESCE(SUM(CASE WHEN kind='income' THEN amount ELSE 0 END), 0) AS income, COALESCE(SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END), 0) AS expenses FROM transactions WHERE telegram_user_id = ?", (user_id,))
        row = cursor.fetchone()
        income = float(row['income'])
        expenses = float(row['expenses'])
        return {"income": income, "expenses": expenses, "balance": income - expenses}

def get_expenses_by_category(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT category, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE telegram_user_id = %s AND kind = 'expense' GROUP BY category ORDER BY total DESC" if DATABASE_URL else "SELECT category, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE telegram_user_id = ? AND kind = 'expense' GROUP BY category ORDER BY total DESC", (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def save_settings(user_id: int, language: str, currency: str):
    with connect() as db:
        cursor = db.cursor()
        if DATABASE_URL:
            cursor.execute("INSERT INTO settings (telegram_user_id, language, currency) VALUES (%s, %s, %s) ON CONFLICT (telegram_user_id) DO UPDATE SET language=EXCLUDED.language, currency=EXCLUDED.currency", (user_id, language, currency))
        else:
            cursor.execute("INSERT INTO settings (telegram_user_id, language, currency) VALUES (?, ?, ?) ON CONFLICT(telegram_user_id) DO UPDATE SET language=excluded.language, currency=excluded.currency", (user_id, language, currency))
        db.commit()

def get_settings(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT language, currency FROM settings WHERE telegram_user_id = %s" if DATABASE_URL else "SELECT language, currency FROM settings WHERE telegram_user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return {"language": "ru", "currency": "EUR"}

def set_budget(user_id: int, category: str, limit_amount: float, emoji: str = '💰', color: str = '#22c55e'):
    with connect() as db:
        cursor = db.cursor()
        if DATABASE_URL:
            cursor.execute("INSERT INTO budgets (telegram_user_id, category, limit_amount, emoji, color) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (telegram_user_id, category) DO UPDATE SET limit_amount=EXCLUDED.limit_amount, emoji=EXCLUDED.emoji, color=EXCLUDED.color", (user_id, category, limit_amount, emoji, color))
        else:
            cursor.execute("INSERT INTO budgets (telegram_user_id, category, limit_amount, emoji, color) VALUES (?, ?, ?, ?, ?) ON CONFLICT(telegram_user_id, category) DO UPDATE SET limit_amount=excluded.limit_amount, emoji=excluded.emoji, color=excluded.color", (user_id, category, limit_amount, emoji, color))
        db.commit()

def delete_budget(user_id: int, category: str):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("DELETE FROM budgets WHERE telegram_user_id = %s AND category = %s" if DATABASE_URL else "DELETE FROM budgets WHERE telegram_user_id = ? AND category = ?", (user_id, category))
        db.commit()

def get_budgets(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        if DATABASE_URL:
            cursor.execute("""
                SELECT b.category, b.limit_amount, b.emoji, b.color, COALESCE(SUM(t.amount), 0) AS spent
                FROM budgets b
                LEFT JOIN transactions t ON b.category = t.category AND t.telegram_user_id = b.telegram_user_id AND t.kind = 'expense' AND TO_CHAR(t.created_at, 'YYYY-MM') = TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM')
                WHERE b.telegram_user_id = %s
                GROUP BY b.category, b.limit_amount, b.emoji, b.color
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT b.category, b.limit_amount, b.emoji, b.color, COALESCE(SUM(t.amount), 0) AS spent
                FROM budgets b
                LEFT JOIN transactions t ON b.category = t.category AND t.telegram_user_id = b.telegram_user_id AND t.kind = 'expense' AND strftime('%Y-%m', t.created_at) = strftime('%Y-%m', 'now')
                WHERE b.telegram_user_id = ?
                GROUP BY b.category, b.limit_amount, b.emoji, b.color
            """, (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def add_goal(user_id: int, title: str, target_amount: float):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("INSERT INTO goals (telegram_user_id, title, target_amount) VALUES (%s, %s, %s)" if DATABASE_URL else "INSERT INTO goals (telegram_user_id, title, target_amount) VALUES (?, ?, ?)", (user_id, title, target_amount))
        db.commit()

def update_goal(goal_id: int, user_id: int, title: str, target_amount: float):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("UPDATE goals SET title = %s, target_amount = %s WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "UPDATE goals SET title = ?, target_amount = ? WHERE id = ? AND telegram_user_id = ?", (title, target_amount, goal_id, user_id))
        db.commit()

def get_goals(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM goals WHERE telegram_user_id = %s ORDER BY id DESC" if DATABASE_URL else "SELECT * FROM goals WHERE telegram_user_id = ? ORDER BY id DESC", (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def update_goal_amount(goal_id: int, user_id: int, amount: float):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT title FROM goals WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "SELECT title FROM goals WHERE id = ? AND telegram_user_id = ?", (goal_id, user_id))
        goal = cursor.fetchone()
    if goal:
        with connect() as db:
            cursor = db.cursor()
            cursor.execute("UPDATE goals SET saved_amount = saved_amount + %s WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "UPDATE goals SET saved_amount = saved_amount + ? WHERE id = ? AND telegram_user_id = ?", (amount, goal_id, user_id))
            db.commit()
        add_transaction(user_id, "expense", amount, "Накопления", f"Цель: {goal['title']}")

def delete_goal(goal_id: int, user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("DELETE FROM goals WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "DELETE FROM goals WHERE id = ? AND telegram_user_id = ?", (goal_id, user_id))
        db.commit()

def add_recurring(user_id: int, title: str, amount: float, day_of_month: int, category: str):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("INSERT INTO recurring_payments (telegram_user_id, title, amount, day_of_month, category) VALUES (%s, %s, %s, %s, %s)" if DATABASE_URL else "INSERT INTO recurring_payments (telegram_user_id, title, amount, day_of_month, category) VALUES (?, ?, ?, ?, ?)", (user_id, title, amount, day_of_month, category))
        db.commit()

def get_recurring(user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM recurring_payments WHERE telegram_user_id = %s ORDER BY day_of_month" if DATABASE_URL else "SELECT * FROM recurring_payments WHERE telegram_user_id = ? ORDER BY day_of_month", (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_recurring(payment_id: int, user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("DELETE FROM recurring_payments WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "DELETE FROM recurring_payments WHERE id = ? AND telegram_user_id = ?", (payment_id, user_id))
        db.commit()

def pay_recurring(payment_id: int, user_id: int):
    with connect() as db:
        cursor = db.cursor()
        cursor.execute("SELECT title, amount, category FROM recurring_payments WHERE id = %s AND telegram_user_id = %s" if DATABASE_URL else "SELECT title, amount, category FROM recurring_payments WHERE id = ? AND telegram_user_id = ?", (payment_id, user_id))
        payment = cursor.fetchone()
    if payment:
        add_transaction(user_id, "expense", payment['amount'], payment['category'], f"Регулярный платеж: {payment['title']}")
        return True
    return False
