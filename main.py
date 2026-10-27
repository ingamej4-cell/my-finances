import asyncio
import logging
from contextlib import asynccontextmanager
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message, InlineKeyboardButton, InlineKeyboardMarkup,
    WebAppInfo, ReplyKeyboardRemove, MenuButtonDefault, BotCommand
)
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import uvicorn
import httpx

from config import BOT_TOKEN, WEBAPP_URL
from database import (
    init_db, add_transaction, get_transactions, get_summary, delete_transaction,
    get_settings, save_settings, set_budget, get_budgets, delete_budget,
    add_goal, get_goals, update_goal_amount, delete_goal, update_goal,
    get_expenses_by_category, get_categories, add_category,
    add_recurring, get_recurring, delete_recurring, pay_recurring
)

logging.basicConfig(level=logging.INFO)
dp = Dispatcher()


@dp.message(CommandStart())
async def start_handler(message: Message):
    greeting = (
        "👋 **Добро пожаловать в «Мои Финансы»!**\n\n"
        "Я — твой личный помощник для контроля денег. 💰\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение. Все твои данные сохраняются автоматически. 👇"
    )

    if WEBAPP_URL.startswith("https://"):
        inline_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="💶 Открыть Мои Финансы", web_app=WebAppInfo(url=WEBAPP_URL))]]
        )
        await message.answer("Обновляю меню...", reply_markup=ReplyKeyboardRemove())
        await message.answer(greeting, reply_markup=inline_kb, parse_mode="Markdown")
    else:
        await message.answer(greeting + "\n\n(Локальный режим: http://127.0.0.1:8000)", parse_mode="Markdown")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if not BOT_TOKEN or "ВСТАВЬ" in BOT_TOKEN:
        task = None
    else:
        try:
            await bot.set_my_commands([
                BotCommand(command="start", description="Запустить приложение"),
                BotCommand(command="help", description="Помощь")
            ])
            await bot.set_chat_menu_button(menu_button=MenuButtonDefault())
        except Exception as e:
            logging.error(f"Не удалось настроить меню: {e}")
        task = asyncio.create_task(dp.start_polling(bot))
    yield
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        await bot.session.close()


app = FastAPI(title="Мои Финансы", lifespan=lifespan)
app.mount("/static", StaticFiles(directory="web"), name="static")


@app.get("/")
async def home():
    return FileResponse("web/index.html")


class TransactionInput(BaseModel):
    user_id: int = Field(gt=0);
    kind: str;
    amount: float = Field(gt=0, le=100000000)
    category: str = Field(min_length=1, max_length=60);
    note: str = Field(default="", max_length=200)


class SettingsInput(BaseModel):
    user_id: int = Field(gt=0);
    language: str = Field(default="ru", pattern="^(ru|uk|en|de)$");
    currency: str = Field(default="EUR", pattern="^(EUR|USD|UAH|GBP|PLN)$")


class BudgetInput(BaseModel):
    user_id: int = Field(gt=0);
    category: str = Field(min_length=1, max_length=60);
    limit_amount: float = Field(ge=0)
    emoji: str = Field(default="💰", max_length=10);
    color: str = Field(default="#22c55e", max_length=10)


class GoalInput(BaseModel):
    user_id: int = Field(gt=0);
    title: str = Field(min_length=1, max_length=100);
    target_amount: float = Field(gt=0)


class GoalUpdateInput(BaseModel):
    user_id: int = Field(gt=0);
    goal_id: int;
    amount: float


class GoalEditInput(BaseModel):
    user_id: int = Field(gt=0);
    goal_id: int;
    title: str = Field(min_length=1, max_length=100);
    target_amount: float = Field(gt=0)


class CategoryInput(BaseModel):
    user_id: int = Field(gt=0);
    name: str = Field(min_length=1, max_length=50);
    kind: str = Field(pattern="^(income|expense)$")


# Обновленная модель регулярного платежа
class RecurringInput(BaseModel):
    user_id: int = Field(gt=0);
    title: str = Field(min_length=1, max_length=100);
    amount: float = Field(gt=0);
    day_of_month: int = Field(ge=1, le=31)
    category: str = Field(default="Дом и счета", min_length=1, max_length=60)


class ConvertInput(BaseModel):
    amount: float = Field(gt=0);
    from_currency: str = Field(min_length=3, max_length=3);
    to_currency: str = Field(min_length=3, max_length=3)


@app.get("/api/summary")
async def api_summary(user_id: int = 999): return get_summary(user_id)


@app.get("/api/transactions")
async def api_transactions(user_id: int = 999): return {"transactions": get_transactions(user_id)}


@app.post("/api/transactions")
async def api_add_transaction(payload: TransactionInput):
    if payload.kind not in ("income", "expense"): raise HTTPException(400, "kind error")
    add_transaction(payload.user_id, payload.kind, payload.amount, payload.category.strip(), payload.note.strip())
    return {"ok": True, "summary": get_summary(payload.user_id)}


@app.delete("/api/transactions/{transaction_id}")
async def api_delete_transaction(transaction_id: int, user_id: int = 999):
    delete_transaction(transaction_id, user_id);
    return {"ok": True}


@app.get("/api/statistics")
async def api_statistics(user_id: int = 999): return {"expenses": get_expenses_by_category(user_id)}


@app.get("/api/categories")
async def api_get_categories(user_id: int = 999, kind: str = "expense"): return {
    "categories": get_categories(user_id, kind)}


@app.post("/api/categories")
async def api_add_category(payload: CategoryInput):
    if not add_category(payload.user_id, payload.name, payload.kind): raise HTTPException(400, "Уже есть")
    return {"ok": True}


@app.get("/api/settings")
async def api_get_settings(user_id: int = 999): return get_settings(user_id)


@app.post("/api/settings")
async def api_save_settings(payload: SettingsInput):
    save_settings(payload.user_id, payload.language, payload.currency);
    return {"ok": True}


@app.get("/api/budgets")
async def api_get_budgets(user_id: int = 999): return {"budgets": get_budgets(user_id)}


@app.post("/api/budgets")
async def api_set_budget(payload: BudgetInput):
    set_budget(payload.user_id, payload.category.strip(), payload.limit_amount, payload.emoji, payload.color)
    return {"ok": True}


@app.delete("/api/budgets")
async def api_delete_budget(category: str, user_id: int = 999):
    delete_budget(user_id, category);
    return {"ok": True}


@app.get("/api/goals")
async def api_get_goals(user_id: int = 999): return {"goals": get_goals(user_id)}


@app.post("/api/goals")
async def api_add_goal(payload: GoalInput):
    add_goal(payload.user_id, payload.title.strip(), payload.target_amount);
    return {"ok": True}


@app.put("/api/goals/{goal_id}")
async def api_edit_goal(goal_id: int, payload: GoalEditInput):
    update_goal(goal_id, payload.user_id, payload.title.strip(), payload.target_amount)
    return {"ok": True}


@app.post("/api/goals/update")
async def api_update_goal(payload: GoalUpdateInput):
    update_goal_amount(payload.goal_id, payload.user_id, payload.amount);
    return {"ok": True}


@app.delete("/api/goals/{goal_id}")
async def api_delete_goal(goal_id: int, user_id: int = 999):
    delete_goal(goal_id, user_id);
    return {"ok": True}


# НОВЫЕ API ДЛЯ РЕГУЛЯРНЫХ ПЛАТЕЖЕЙ
@app.get("/api/recurring")
async def api_get_recurring(user_id: int = 999): return {"recurring": get_recurring(user_id)}


@app.post("/api/recurring")
async def api_add_recurring(payload: RecurringInput):
    add_recurring(payload.user_id, payload.title.strip(), payload.amount, payload.day_of_month,
                  payload.category.strip());
    return {"ok": True}


@app.delete("/api/recurring/{payment_id}")
async def api_delete_recurring(payment_id: int, user_id: int = 999):
    delete_recurring(payment_id, user_id);
    return {"ok": True}


@app.post("/api/recurring/{payment_id}/pay")
async def api_pay_recurring(payment_id: int, user_id: int = 999):
    success = pay_recurring(payment_id, user_id)
    if not success: raise HTTPException(404, "Платеж не найден")
    return {"ok": True}


@app.post("/api/convert")
async def api_convert(payload: ConvertInput):
    if payload.from_currency == payload.to_currency:
        return {"converted_amount": payload.amount}
    url = f"https://cdn.jsdelivr.net/gh/irfanokr/currency-api@main/v1/currencies/{payload.from_currency.lower()}.min.json"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            rates_dict = data.get(payload.from_currency.lower())
            if not rates_dict: raise ValueError(f"Не найдены курсы для {payload.from_currency}")
            rate = rates_dict.get(payload.to_currency.lower())
            if rate is None: raise ValueError(f"Курс для {payload.to_currency} не найден")
            return {"converted_amount": payload.amount * rate}
    except Exception as e:
        logging.error(f"Ошибка конвертации: {e}")
        raise HTTPException(status_code=500, detail="Не удалось получить курс валют.")


bot = Bot(token=BOT_TOKEN) if BOT_TOKEN and "ВСТАВЬ" not in BOT_TOKEN else None
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)