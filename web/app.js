const tg = window.Telegram?.WebApp;
let currentKind = 'expense';
let userId = null;
let expensesChart = null;
let currentBudgetCategory = '';
let currentGoalId = null;
let appCurrency = '€';
let appCurrencyCode = 'EUR';
let currentLang = 'ru';

let selectedEmoji = '💰';
let selectedColor = '#22c55e';

const translations = {
    ru: { eyebrow: "ТВОЙ ФИНАНСОВЫЙ ПОМОЩНИК", title: "Мои Финансы", total_balance: "Общий баланс", income: "Доходы", expenses: "Расходы", stats: "Статистика расходов", quick_entry: "Быстрая запись", expense_tab: "− Расход", income_tab: "＋ Доход", amount: "Сумма", currency: "Валюта", category: "Категория", add_cat: "+ Создать категорию", note: "Комментарий (необязательно)", save_op: "Сохранить операцию", envelopes: "Мои конверты", create: "+ Создать", recurring: "Регулярные платежи", add: "+ Добавить", goals: "Мои цели", add_goal: "+ Добавить", history: "Последние операции", settings: "Настройки", lang: "Язык интерфейса", main_curr: "Основная валюта", save_settings: "Сохранить настройки", footer: "Учебная версия · Данные хранятся локально в SQLite", modal_cat: "Новая категория", name: "Название", cat_btn: "Создать", cancel: "Отмена", budget_cat: "Категория", budget_limit: "Сумма лимита", save: "Сохранить", del_budget: "Удалить конверт", goal_title: "Название цели", goal_target: "Нужная сумма", goal_save: "Сохранить", rec_modal_title: "Новый регулярный платеж", rec_title: "Название (например, Аренда)", rec_amount: "Сумма", rec_day: "День месяца (1-31)", rec_add: "Добавить", empty_history: "Пока операций нет.", empty_envelopes: "Конвертов пока нет. Нажми «+ Создать».", empty_recurring: "Платежей пока нет. Нажми «+ Добавить».", empty_goals: "Целей пока нет. Нажми «+ Добавить».", saved: "Сохранено", error: "Ошибка", delete_confirm: "Удалить эту операцию?", delete_goal_confirm: "Удалить эту цель?", delete_budget_confirm: "Удалить этот конверт?", delete_rec_confirm: "Удалить этот регулярный платеж?", month_every: "Каждый месяц", day: "числа", tip_good: "Отличная работа! Продолжайте вести учёт, чтобы всегда знать, куда уходят деньги. 💪", tip_warning: "Осторожно! Вы потратили <b>{percent}%</b> лимита на «{category}». Осталось {currency}{rest}.", tip_over: "Внимание! Вы превысили лимит на «{category}» на {currency}{over}.", forecast_title: "Прогноз на месяц", forecast_empty: "Добавьте больше расходов, чтобы увидеть прогноз.", forecast_text: "В среднем вы тратите <span>{daily}{currency}</span> в день. При таких темпах ваш бюджет закончится через <span>{days} дней</span>.", today: "Сегодня", yesterday: "Вчера" },
    uk: { eyebrow: "ТВІЙ ФІНАНСОВИЙ ПОМІЧНИК", title: "Мої Фінанси", total_balance: "Загальний баланс", income: "Доходи", expenses: "Витрати", stats: "Статистика витрат", quick_entry: "Швидкий запис", expense_tab: "− Витрата", income_tab: "＋ Дохід", amount: "Сума", currency: "Валюта", category: "Категорія", add_cat: "+ Створити категорію", note: "Коментар (необов'язково)", save_op: "Зберегти операцію", envelopes: "Мої конверти", create: "+ Створити", recurring: "Регулярні платежі", add: "+ Додати", goals: "Мої цілі", add_goal: "+ Додати", history: "Останні операції", settings: "Налаштування", lang: "Мова інтерфейсу", main_curr: "Основна валюта", save_settings: "Зберегти налаштування", footer: "Навчальна версія · Дані зберігаються локально в SQLite", modal_cat: "Нова категорія", name: "Назва", cat_btn: "Створити", cancel: "Скасувати", budget_cat: "Категорія", budget_limit: "Сума ліміту", save: "Зберегти", del_budget: "Видалити конверт", goal_title: "Назва мети", goal_target: "Потрібна сума", goal_save: "Зберегти", rec_modal_title: "Новий регулярний платіж", rec_title: "Назва (наприклад, Оренда)", rec_amount: "Сума", rec_day: "День місяця (1-31)", rec_add: "Додати", empty_history: "Поки операцій немає.", empty_envelopes: "Конвертів поки немає. Натисни «+ Створити».", empty_recurring: "Платежів поки немає. Натисни «+ Додати».", empty_goals: "Цілей поки немає. Натисни «+ Додати».", saved: "Збережено", error: "Помилка", delete_confirm: "Видалити цю операцію?", delete_goal_confirm: "Видалити цю мету?", delete_budget_confirm: "Видалити цей конверт?", delete_rec_confirm: "Видалити цей регулярний платіж?", month_every: "Щомісяця", day: "числа", tip_good: "Чудова робота! Продовжуйте вести облік, щоб завжди знати, куди йдуть гроші. 💪", tip_warning: "Обережно! Ви витратили <b>{percent}%</b> ліміту на «{category}». Залишилось {currency}{rest}.", tip_over: "Увага! Ви перевищили ліміт на «{category}» на {currency}{over}.", forecast_title: "Прогноз на місяць", forecast_empty: "Додайте більше витрат, щоб побачити прогноз.", forecast_text: "В середньому ви витрачаєте <span>{daily}{currency}</span> на день. При таких темпах ваш бюджет закінчиться через <span>{days} днів</span>.", today: "Сьогодні", yesterday: "Вчора" },
    en: { eyebrow: "YOUR FINANCIAL ASSISTANT", title: "My Finances", total_balance: "Total Balance", income: "Income", expenses: "Expenses", stats: "Expense Statistics", quick_entry: "Quick Entry", expense_tab: "− Expense", income_tab: "＋ Income", amount: "Amount", currency: "Currency", category: "Category", add_cat: "+ Create category", note: "Comment (optional)", save_op: "Save transaction", envelopes: "My Envelopes", create: "+ Create", recurring: "Recurring Payments", add: "+ Add", goals: "My Goals", add_goal: "+ Add", history: "Recent Transactions", settings: "Settings", lang: "Interface Language", main_curr: "Main Currency", save_settings: "Save settings", footer: "Educational version · Data stored locally in SQLite", modal_cat: "New Category", name: "Name", cat_btn: "Create", cancel: "Cancel", budget_cat: "Category", budget_limit: "Limit amount", save: "Save", del_budget: "Delete envelope", goal_title: "Goal name", goal_target: "Target amount", goal_save: "Save", rec_modal_title: "New Recurring Payment", rec_title: "Name (e.g. Rent)", rec_amount: "Amount", rec_day: "Day of month (1-31)", rec_add: "Add", empty_history: "No transactions yet.", empty_envelopes: "No envelopes yet. Click «+ Create».", empty_recurring: "No payments yet. Click «+ Add».", empty_goals: "No goals yet. Click «+ Add».", saved: "Saved", error: "Error", delete_confirm: "Delete this transaction?", delete_goal_confirm: "Delete this goal?", delete_budget_confirm: "Delete this envelope?", delete_rec_confirm: "Delete this recurring payment?", month_every: "Every month on the", day: "th", tip_good: "Great job! Keep tracking to always know where your money goes. 💪", tip_warning: "Careful! You've spent <b>{percent}%</b> of the limit on «{category}». {currency}{rest} left.", tip_over: "Attention! You've exceeded the limit on «{category}» by {currency}{over}.", forecast_title: "Monthly Forecast", forecast_empty: "Add more expenses to see the forecast.", forecast_text: "On average you spend <span>{daily}{currency}</span> per day. At this rate your budget will run out in <span>{days} days</span>.", today: "Today", yesterday: "Yesterday" },
    de: { eyebrow: "DEIN FINANZASSISTENT", title: "Meine Finanzen", total_balance: "Gesamtguthaben", income: "Einnahmen", expenses: "Ausgaben", stats: "Ausgabenstatistik", quick_entry: "Schnelleingabe", expense_tab: "− Ausgabe", income_tab: "＋ Einnahme", amount: "Betrag", currency: "Währung", category: "Kategorie", add_cat: "+ Kategorie erstellen", note: "Kommentar (optional)", save_op: "Transaktion speichern", envelopes: "Meine Umschläge", create: "+ Erstellen", recurring: "Wiederkehrende Zahlungen", add: "+ Hinzufügen", goals: "Meine Ziele", add_goal: "+ Hinzufügen", history: "Letzte Transaktionen", settings: "Einstellungen", lang: "Schnittstellensprache", main_curr: "Hauptwährung", save_settings: "Einstellungen speichern", footer: "Lernversion · Daten lokal in SQLite gespeichert", modal_cat: "Neue Kategorie", name: "Name", cat_btn: "Erstellen", cancel: "Abbrechen", budget_cat: "Kategorie", budget_limit: "Limitbetrag", save: "Speichern", del_budget: "Umschlag löschen", goal_title: "Zielname", goal_target: "Zielbetrag", goal_save: "Speichern", rec_modal_title: "Neue wiederkehrende Zahlung", rec_title: "Name (z.B. Miete)", rec_amount: "Betrag", rec_day: "Tag des Monats (1-31)", rec_add: "Hinzufügen", empty_history: "Noch keine Transaktionen.", empty_envelopes: "Noch keine Umschläge. Klicke «+ Erstellen».", empty_recurring: "Noch keine Zahlungen. Klicke «+ Hinzufügen».", empty_goals: "Noch keine Ziele. Klicke «+ Hinzufügen».", saved: "Gespeichert", error: "Fehler", delete_confirm: "Diese Transaktion löschen?", delete_goal_confirm: "Dieses Ziel löschen?", delete_budget_confirm: "Diesen Umschlag löschen?", delete_rec_confirm: "Diese wiederkehrende Zahlung löschen?", month_every: "Jeden Monat am", day: ".", tip_good: "Tolle Arbeit! Behalte deine Ausgaben im Blick. 💪", tip_warning: "Vorsicht! Du hast <b>{percent}%</b> des Limits für «{category}» ausgegeben. Noch {currency}{rest} übrig.", tip_over: "Achtung! Du hast das Limit für «{category}» um {currency}{over} überschritten.", forecast_title: "Monatsprognose", forecast_empty: "Füge mehr Ausgaben hinzu, um die Prognose zu sehen.", forecast_text: "Du gibst durchschnittlich <span>{daily}{currency}</span> pro Tag aus. Bei diesem Tempo ist dein Budget in <span>{days} Tagen</span> aufgebraucht.", today: "Heute", yesterday: "Gestern" }
};

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupEventListeners();
    loadData();
});

function initUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        tg.ready(); tg.expand();
        userId = tg.initDataUnsafe.user.id;
    } else {
        userId = 999;
        const header = document.querySelector('header h1');
        if(header) header.innerHTML += ' <small style="color:orange; font-size:12px;">(Тест)</small>';
    }
}

function applyLanguage(lang) {
    currentLang = lang;
    const t = translations[lang] || translations['ru'];

    document.getElementById('lbl_eyebrow').textContent = t.eyebrow;
    document.getElementById('lbl_title').textContent = t.title;
    document.getElementById('lbl_total_balance').textContent = t.total_balance;
    document.getElementById('lbl_income').textContent = t.income;
    document.getElementById('lbl_expenses').textContent = t.expenses;
    document.getElementById('lbl_stats').textContent = t.stats;
    document.getElementById('lbl_quick_entry').textContent = t.quick_entry;
    document.getElementById('expenseTab').textContent = t.expense_tab;
    document.getElementById('incomeTab').textContent = t.income_tab;
    document.getElementById('lbl_amount').textContent = t.amount;
    document.getElementById('lbl_currency').textContent = t.currency;
    document.getElementById('lbl_category').textContent = t.category;
    document.getElementById('addCategoryBtn').textContent = t.add_cat;
    document.getElementById('lbl_note').textContent = t.note;
    document.getElementById('lbl_save_op').textContent = t.save_op;
    document.getElementById('lbl_envelopes').textContent = t.envelopes;
    document.getElementById('addBudgetBtn').textContent = t.create;
    document.getElementById('lbl_recurring').textContent = t.recurring;
    document.getElementById('addRecurringBtn').textContent = t.add;
    document.getElementById('lbl_goals').textContent = t.goals;
    document.getElementById('addGoalBtn').textContent = t.add_goal;
    document.getElementById('lbl_history').textContent = t.history;
    document.getElementById('lbl_settings').textContent = t.settings;
    document.getElementById('lbl_lang').textContent = t.lang;
    document.getElementById('lbl_main_curr').textContent = t.main_curr;
    document.getElementById('saveSettings').textContent = t.save_settings;
    document.getElementById('lbl_footer').textContent = t.footer;
    document.getElementById('lbl_forecast_title').textContent = t.forecast_title;

    document.getElementById('lbl_modal_cat').textContent = t.modal_cat;
    document.getElementById('lbl_name').textContent = t.name;
    document.getElementById('saveCategoryBtn').textContent = t.cat_btn;
    document.getElementById('cancelCategoryBtn').textContent = t.cancel;
    document.getElementById('lbl_budget_cat').textContent = t.budget_cat;
    document.getElementById('lbl_budget_limit').textContent = t.budget_limit;
    document.getElementById('saveBudgetBtn').textContent = t.save;
    document.getElementById('cancelBudgetBtn').textContent = t.cancel;
    document.getElementById('deleteBudgetBtn').textContent = t.del_budget;
    document.getElementById('lbl_goal_title').textContent = t.goal_title;
    document.getElementById('lbl_goal_target').textContent = t.goal_target;
    document.getElementById('saveGoalBtn').textContent = t.goal_save;
    document.getElementById('cancelGoalBtn').textContent = t.cancel;
    document.getElementById('lbl_rec_modal_title').textContent = t.rec_modal_title;
    document.getElementById('lbl_rec_title').textContent = t.rec_title;
    document.getElementById('lbl_rec_amount').textContent = t.rec_amount;
    document.getElementById('lbl_rec_day').textContent = t.rec_day;
    document.getElementById('saveRecurringBtn').textContent = t.rec_add;
    document.getElementById('cancelRecurringBtn').textContent = t.cancel;
}

function setupEventListeners() {
    const expenseTab = document.getElementById('expenseTab');
    const incomeTab = document.getElementById('incomeTab');

    expenseTab.addEventListener('click', () => { currentKind = 'expense'; expenseTab.classList.add('active'); incomeTab.classList.remove('active'); loadCategoriesForSelect(); });
    incomeTab.addEventListener('click', () => { currentKind = 'income'; incomeTab.classList.add('active'); expenseTab.classList.remove('active'); loadCategoriesForSelect(); });

    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);

    document.getElementById('cancelBudgetBtn').addEventListener('click', () => document.getElementById('budgetModal').style.display = 'none');
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
    document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
    document.getElementById('deleteBudgetBtn').addEventListener('click', deleteBudget);

    document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
    document.getElementById('cancelGoalBtn').addEventListener('click', () => document.getElementById('goalModal').style.display = 'none');
    document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);

    document.getElementById('addCategoryBtn').addEventListener('click', () => document.getElementById('categoryModal').style.display = 'flex');
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => document.getElementById('categoryModal').style.display = 'none');
    document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);

    document.getElementById('addRecurringBtn').addEventListener('click', () => openRecurringModal());
    document.getElementById('cancelRecurringBtn').addEventListener('click', () => document.getElementById('recurringModal').style.display = 'none');
    document.getElementById('saveRecurringBtn').addEventListener('click', saveRecurring);

    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Обработчики выбора эмодзи
    document.querySelectorAll('.emoji-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.emoji-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
            selectedEmoji = el.getAttribute('data-emoji');
        });
    });

    // Обработчики выбора цвета
    document.querySelectorAll('.color-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
            selectedColor = el.getAttribute('data-color');
        });
    });
}

async function loadSettings() {
    try {
        const res = await fetch(`/api/settings?user_id=${userId}`);
        const data = await res.json();
        document.getElementById('language').value = data.language;
        document.getElementById('currency').value = data.currency;
        updateCurrencySymbol(data.currency);
        document.getElementById('inputCurrency').value = data.currency;
        applyLanguage(data.language);
    } catch (e) { console.error(e); }
}

function updateCurrencySymbol(code) {
    appCurrencyCode = code;
    if (code === 'EUR') appCurrency = '€';
    else if (code === 'USD') appCurrency = '$';
    else if (code === 'UAH') appCurrency = '₴';
    else if (code === 'GBP') appCurrency = '£';
    else if (code === 'PLN') appCurrency = 'zł';
    else if (code === 'RUB') appCurrency = '₽'; // ДОБАВИЛИ СИМВОЛ РУБЛЯ
}

async function saveSettings() {
    const lang = document.getElementById('language').value;
    const curr = document.getElementById('currency').value;
    await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, language: lang, currency: curr })
    });
    updateCurrencySymbol(curr);
    document.getElementById('inputCurrency').value = curr;
    await loadData();
    alert(translations[lang].saved || 'Сохранено!');
}

async function loadCategoriesForSelect() {
    try {
        const res = await fetch(`/api/categories?user_id=${userId}&kind=${currentKind}`);
        const data = await res.json();
        const select = document.getElementById('category');
        select.innerHTML = '';
        data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}

async function saveCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) return;
    try {
        const res = await fetch('/api/categories', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, name: name, kind: currentKind })
        });
        if (res.ok) {
            document.getElementById('categoryModal').style.display = 'none';
            document.getElementById('newCategoryName').value = '';
            await loadCategoriesForSelect();
            document.getElementById('category').value = name;
        } else { alert('Такая категория уже существует'); }
    } catch (e) { alert('Ошибка при создании'); }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    let amount = parseFloat(document.getElementById('amount').value);
    const inputCurrency = document.getElementById('inputCurrency').value;
    const category = document.getElementById('category').value;
    const note = document.getElementById('note').value;
    const messageEl = document.getElementById('message');

    if (!amount || amount <= 0) { messageEl.textContent = 'Введите сумму'; messageEl.style.color = '#ef4444'; return; }

    let originalAmount = amount;
    if (inputCurrency !== appCurrencyCode) {
        messageEl.textContent = 'Конвертация...'; messageEl.style.color = '#6b9e7e';
        try {
            const convRes = await fetch('/api/convert', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, from_currency: inputCurrency, to_currency: appCurrencyCode })
            });
            if (!convRes.ok) throw new Error('Сервер не смог получить курс');
            const convData = await convRes.json();
            amount = Math.round(convData.converted_amount * 100) / 100;
        } catch (err) {
            messageEl.textContent = 'Ошибка курса'; messageEl.style.color = '#ef4444';
            return;
        }
    }

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, kind: currentKind, amount: amount, category: category, note: note })
        });
        if (!response.ok) throw new Error();

        if (inputCurrency !== appCurrencyCode) {
            messageEl.textContent = `${originalAmount} ${inputCurrency} = ${appCurrency}${amount.toFixed(2)}`;
        } else {
            messageEl.textContent = `${translations[currentLang].saved}: ${appCurrency}${amount.toFixed(2)}`;
        }
        messageEl.style.color = '#4ade80';

        document.getElementById('amount').value = ''; document.getElementById('note').value = '';
        await loadData();
        setTimeout(() => { messageEl.textContent = ''; }, 4000);
    } catch (error) {
        messageEl.textContent = translations[currentLang].error; messageEl.style.color = '#ef4444';
    }
}

async function loadData() {
    try {
        await loadSettings();
        await loadCategoriesForSelect();

        const summaryRes = await fetch(`/api/summary?user_id=${userId}`);
        const summary = await summaryRes.json();

        document.getElementById('income').textContent = `${appCurrency}${summary.income.toFixed(2)}`;
        document.getElementById('expenses').textContent = `${appCurrency}${summary.expenses.toFixed(2)}`;

        const balanceEl = document.getElementById('balance');
        balanceEl.textContent = `${appCurrency}${summary.balance.toFixed(2)}`;
        if (summary.balance < 0) {
            balanceEl.classList.add('negative');
        } else {
            balanceEl.classList.remove('negative');
        }

        const historyRes = await fetch(`/api/transactions?user_id=${userId}`);
        const historyData = await historyRes.json();
        renderHistory(historyData.transactions);

        const budgetsRes = await fetch(`/api/budgets?user_id=${userId}`);
        const budgetsData = await budgetsRes.json();
        renderBudgets(budgetsData.budgets);

        const goalsRes = await fetch(`/api/goals?user_id=${userId}`);
        const goalsData = await goalsRes.json();
        renderGoals(goalsData.goals);

        const statsRes = await fetch(`/api/statistics?user_id=${userId}`);
        const statsData = await statsRes.json();
        renderChart(statsData.expenses);

        const recRes = await fetch(`/api/recurring?user_id=${userId}`);
        const recData = await recRes.json();
        renderRecurring(recData.recurring);

        generateTip(budgetsData.budgets);
        generateForecast(summary, historyData.transactions);
    } catch (error) { console.error(error); }
}

function renderHistory(transactions) {
    const historyEl = document.getElementById('history');
    if (!transactions || transactions.length === 0) {
        historyEl.innerHTML = `<p class="hint">${translations[currentLang].empty_history}</p>`;
        return;
    }

    const t = translations[currentLang];
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groups = {};
    transactions.forEach(tx => {
        const datePart = tx.created_at.split(' ')[0];
        if (!groups[datePart]) groups[datePart] = [];
        groups[datePart].push(tx);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    let html = '';
    sortedDates.forEach(dateStr => {
        let dateLabel = dateStr;
        if (dateStr === todayStr) dateLabel = t.today;
        else if (dateStr === yesterdayStr) dateLabel = t.yesterday;
        else {
            const d = new Date(dateStr);
            const monthsRu = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
            const monthsUk = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
            const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthsDe = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

            let monthName = '';
            if (currentLang === 'ru') monthName = monthsRu[d.getMonth()];
            else if (currentLang === 'uk') monthName = monthsUk[d.getMonth()];
            else if (currentLang === 'de') monthName = monthsDe[d.getMonth()];
            else monthName = monthsEn[d.getMonth()];

            if (currentLang === 'en' || currentLang === 'de') {
                dateLabel = `${monthName} ${d.getDate()}`;
            } else {
                dateLabel = `${d.getDate()} ${monthName}`;
            }
        }

        html += `<div class="history-group">
            <div class="history-date">${dateLabel}</div>
            ${groups[dateStr].map(tx => {
                const isSavings = tx.category === 'Накопления' || tx.note.startsWith('Цель:');
                let sign = '-';
                let color = '#ef4444';
                
                if (tx.kind === 'income') {
                    sign = '+';
                    color = '#4ade80';
                } else if (isSavings) {
                    sign = '→';
                    color = '#38bdf8';
                }

                return `<div class="history-item">
                        <div style="flex:1;"><strong>${tx.category}</strong><div style="font-size:12px;">${tx.note || ''}</div></div>
                        <div style="color:${color}; font-weight:bold; margin-right: 10px;">${sign}${appCurrency}${tx.amount.toFixed(2)}</div>
                        <button class="history-delete" onclick="deleteTransaction(${tx.id})">✕</button>
                    </div>`;
            }).join('')}
        </div>`;
    });

    historyEl.innerHTML = html;
}

async function deleteTransaction(id) {
    if (!confirm(translations[currentLang].delete_confirm)) return;
    await fetch(`/api/transactions/${id}?user_id=${userId}`, { method: 'DELETE' });
    await loadData();
}

function renderBudgets(budgets) {
    const container = document.getElementById('budgetsContainer');
    if (!budgets || budgets.length === 0) { container.innerHTML = `<p class="hint">${translations[currentLang].empty_envelopes}</p>`; return; }
    container.innerHTML = '';
    budgets.forEach(b => {
        let percent = 0;
        let currentColor = b.color;
        if (b.limit_amount > 0) {
            percent = (b.spent / b.limit_amount) * 100;
            if (b.spent > b.limit_amount) {
                percent = 100;
                currentColor = '#ef4444';
            }
        }
        const envDiv = document.createElement('div');
        envDiv.className = 'envelope';
        envDiv.innerHTML = `
            <div class="emoji">${b.emoji || '💰'}</div>
            <div class="env-info">
                <strong>${b.category}</strong>
                <div style="width:100%; background:#1f3b2d; height:6px; border-radius:3px; margin-top:8px;">
                    <div style="width:${percent}%; background:${currentColor}; height:100%; border-radius:3px; transition: width 0.3s ease;"></div>
                </div>
            </div>
            <span class="env-amount" style="font-size: 12px; color: ${b.spent > b.limit_amount ? '#ef4444' : '#6b9e7e'};">
                ${appCurrency}${b.spent.toFixed(2)} / ${appCurrency}${b.limit_amount.toFixed(2)}
            </span>
        `;
        envDiv.addEventListener('click', () => openBudgetModal(b.category, b.limit_amount, b.emoji, b.color));
        container.appendChild(envDiv);
    });
}

async function openBudgetModal(category = '', limit = '', emoji = '💰', color = '#22c55e') {
    currentBudgetCategory = category;
    document.getElementById('budgetModalTitle').textContent = category ? 'Настройка конверта' : translations[currentLang].envelopes;

    selectedEmoji = emoji;
    selectedColor = color;

    if (!category) {
        const res = await fetch(`/api/categories?user_id=${userId}&kind=expense`);
        const data = await res.json();
        const select = document.getElementById('budgetCategorySelect');
        select.innerHTML = '';
        data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name; opt.textContent = cat.name; select.appendChild(opt);
        });

        const catName = data.categories[0]?.name || '';
        if (catName.includes('Продукт')) selectedEmoji = '🥦';
        else if (catName.includes('Дом')) selectedEmoji = '🏠';
        else if (catName.includes('Транспорт')) selectedEmoji = '🚗';
        else if (catName.includes('Одежда')) selectedEmoji = '👕';
        else if (catName.includes('Здоровье')) selectedEmoji = '💊';
        else if (catName.includes('Развлечения')) selectedEmoji = '🎉';
        else selectedEmoji = '💰';
    }

    document.querySelectorAll('.emoji-option').forEach(opt => {
        opt.classList.toggle('selected', opt.getAttribute('data-emoji') === selectedEmoji);
    });
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.getAttribute('data-color') === selectedColor);
    });

    document.getElementById('budgetCategorySelect').value = category;
    document.getElementById('budgetCategorySelect').disabled = !!category;
    document.getElementById('budgetLimitInput').value = limit;
    document.getElementById('deleteBudgetBtn').style.display = category ? 'block' : 'none';
    document.getElementById('budgetModal').style.display = 'flex';
}

async function saveBudget() {
    const category = document.getElementById('budgetCategorySelect').value;
    const limit = parseFloat(document.getElementById('budgetLimitInput').value);
    if (!category) { alert('Выберите категорию'); return; }
    await fetch('/api/budgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            category: category,
            limit_amount: limit,
            emoji: selectedEmoji,
            color: selectedColor
        })
    });
    document.getElementById('budgetModal').style.display = 'none';
    await loadData();
}

async function deleteBudget() {
    if (!confirm(translations[currentLang].delete_budget_confirm)) return;
    await fetch(`/api/budgets?category=${encodeURIComponent(currentBudgetCategory)}&user_id=${userId}`, { method: 'DELETE' });
    document.getElementById('budgetModal').style.display = 'none';
    await loadData();
}

function openGoalModal(goal = null) {
    if (goal) {
        currentGoalId = goal.id;
        document.getElementById('goalModalTitle').textContent = 'Редактировать цель';
        document.getElementById('goalTitleInput').value = goal.title;
        document.getElementById('goalTargetInput').value = goal.target_amount;
    } else {
        currentGoalId = null;
        document.getElementById('goalModalTitle').textContent = translations[currentLang].goals;
        document.getElementById('goalTitleInput').value = '';
        document.getElementById('goalTargetInput').value = '';
    }
    document.getElementById('goalModal').style.display = 'flex';
}

async function saveGoal() {
    const title = document.getElementById('goalTitleInput').value.trim();
    const target = parseFloat(document.getElementById('goalTargetInput').value);
    if (!title || !target || target <= 0) { alert('Заполните все поля'); return; }

    if (currentGoalId) {
        await fetch(`/api/goals/${currentGoalId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, goal_id: currentGoalId, title: title, target_amount: target })
        });
    } else {
        await fetch('/api/goals', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, title: title, target_amount: target })
        });
    }
    document.getElementById('goalModal').style.display = 'none';
    await loadData();
}

function renderGoals(goals) {
    const container = document.getElementById('goalsContainer');
    if (!goals || goals.length === 0) { container.innerHTML = `<p class="hint">${translations[currentLang].empty_goals}</p>`; return; }
    container.innerHTML = goals.map(goal => {
        const percent = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
        return `
            <div class="goal-card">
                <div class="goal-header">
                    <strong>${goal.title}</strong>
                    <div>
                        <button onclick='openGoalModal(${JSON.stringify(goal)})' style="background:none; border:none; color:#4ade80; cursor:pointer; font-size:14px;">✎</button>
                        <button class="goal-delete" onclick="deleteGoal(${goal.id})">✕</button>
                    </div>
                </div>
                <div style="font-size: 13px; color: #ccc;">Накоплено: <b>${appCurrency}${goal.saved_amount.toFixed(2)}</b> из ${appCurrency}${goal.target_amount.toFixed(2)}</div>
                <div class="goal-progress-bg"><div class="goal-progress-bar" style="width: ${percent}%; background: ${percent >= 100 ? '#4ade80' : '#38bdf8'};"></div></div>
                <div class="goal-actions">
                    <input type="number" id="add-money-${goal.id}" placeholder="Сумма" step="0.01" min="0.01">
                    <button onclick="addMoneyToGoal(${goal.id})">Отложить</button>
                </div>
            </div>
        `;
    }).join('');
}

async function addMoneyToGoal(goalId) {
    const input = document.getElementById(`add-money-${goalId}`);
    const amount = parseFloat(input.value);
    if (!amount || amount <= 0) { alert('Введите сумму'); return; }
    await fetch('/api/goals/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, goal_id: goalId, amount: amount })
    });
    await loadData();
}

async function deleteGoal(goalId) {
    if (!confirm(translations[currentLang].delete_goal_confirm)) return;
    await fetch(`/api/goals/${goalId}?user_id=${userId}`, { method: 'DELETE' });
    await loadData();
}

async function openRecurringModal() {
    const res = await fetch(`/api/categories?user_id=${userId}&kind=expense`);
    const data = await res.json();
    const select = document.getElementById('recurringCategorySelect');
    select.innerHTML = '';
    data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name; opt.textContent = cat.name; select.appendChild(opt);
    });

    document.getElementById('recurringTitleInput').value = '';
    document.getElementById('recurringAmountInput').value = '';
    document.getElementById('recurringDayInput').value = '1';
    document.getElementById('recurringModal').style.display = 'flex';
}

async function saveRecurring() {
    const title = document.getElementById('recurringTitleInput').value.trim();
    const category = document.getElementById('recurringCategorySelect').value;
    const amount = parseFloat(document.getElementById('recurringAmountInput').value);
    const day = parseInt(document.getElementById('recurringDayInput').value);

    if (!title || !amount || amount <= 0 || !day || day < 1 || day > 31) { alert('Заполните все поля корректно'); return; }

    await fetch('/api/recurring', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: title, amount: amount, day_of_month: day, category: category })
    });
    document.getElementById('recurringModal').style.display = 'none';
    await loadData();
}

function renderRecurring(payments) {
    const container = document.getElementById('recurringContainer');
    if (!payments || payments.length === 0) { container.innerHTML = `<p class="hint">${translations[currentLang].empty_recurring}</p>`; return; }
    container.innerHTML = payments.map(p => `
        <div class="recurring-item">
            <div class="recurring-info">
                <strong>${p.title}</strong>
                <div>${p.category} · ${translations[currentLang].month_every} ${p.day_of_month} ${translations[currentLang].day}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="recurring-amount">${appCurrency}${p.amount.toFixed(2)}</span>
                <button class="btn-pay" onclick="payRecurring(${p.id})">Оплатить</button>
                <button class="recurring-delete" onclick="deleteRecurring(${p.id})">✕</button>
            </div>
        </div>
    `).join('');
}

async function payRecurring(id) {
    if (!confirm('Оплатить этот счет? Расход будет добавлен автоматически.')) return;
    await fetch(`/api/recurring/${id}/pay?user_id=${userId}`, { method: 'POST' });
    await loadData();
}

async function deleteRecurring(id) {
    if (!confirm(translations[currentLang].delete_rec_confirm)) return;
    await fetch(`/api/recurring/${id}?user_id=${userId}`, { method: 'DELETE' });
    await loadData();
}

function renderChart(data) {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    if (expensesChart) expensesChart.destroy();
    if (!data || data.length === 0) return;

    const labels = data.map(item => item.category);
    const values = data.map(item => item.total);
    const colors = ['#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#eab308', '#10b981'];

    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#111613', hoverOffset: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#ccc', font: { size: 11 }, boxWidth: 12 } } }
        }
    });
}

function generateTip(budgets) {
    const tipCard = document.getElementById('tipCard');
    const tipText = document.getElementById('tipText');
    const t = translations[currentLang];

    let highestPercent = 0;
    let warningBudget = null;
    let overBudget = null;

    if (budgets && budgets.length > 0) {
        budgets.forEach(b => {
            if (b.limit_amount > 0) {
                const percent = (b.spent / b.limit_amount) * 100;
                if (b.spent > b.limit_amount) {
                    overBudget = b;
                } else if (percent > highestPercent && percent >= 70) {
                    highestPercent = percent;
                    warningBudget = b;
                }
            }
        });
    }

    tipCard.style.display = 'flex';

    if (overBudget) {
        tipCard.style.borderLeftColor = '#ef4444';
        const overAmount = (overBudget.spent - overBudget.limit_amount).toFixed(2);
        let text = t.tip_over.replace('{category}', overBudget.category).replace('{over}', overAmount).replace('{currency}', appCurrency);
        tipText.innerHTML = text;
    } else if (warningBudget) {
        tipCard.style.borderLeftColor = '#f59e0b';
        const rest = (warningBudget.limit_amount - warningBudget.spent).toFixed(2);
        let text = t.tip_warning.replace('{percent}', Math.round(highestPercent)).replace('{category}', warningBudget.category).replace('{rest}', rest).replace('{currency}', appCurrency);
        tipText.innerHTML = text;
    } else {
        tipCard.style.borderLeftColor = '#4ade80';
        tipText.innerHTML = t.tip_good;
    }
}

function generateForecast(summary, transactions) {
    const forecastCard = document.getElementById('forecastCard');
    const forecastText = document.getElementById('forecastText');
    const t = translations[currentLang];

    const today = new Date();
    const dayOfMonth = today.getDate();
    let totalExpenses = summary.expenses;

    if (totalExpenses <= 0) {
        forecastCard.style.display = 'none';
        return;
    }

    const dailyAverage = totalExpenses / dayOfMonth;
    const balance = summary.balance;

    if (balance <= 0) {
        forecastCard.style.display = 'block';
        forecastText.innerHTML = "Ваш баланс отрицательный. Пора остановиться и пересмотреть расходы! 🛑";
        return;
    }

    const daysLeft = Math.floor(balance / dailyAverage);

    forecastCard.style.display = 'block';

    if (daysLeft <= 0) {
        forecastText.innerHTML = "Вы уже вышли за пределы бюджета! 😱";
    } else {
        let text = t.forecast_text
            .replace('{daily}', dailyAverage.toFixed(2))
            .replace('{currency}', appCurrency)
            .replace('{days}', daysLeft);
        forecastText.innerHTML = text;
    }
}
