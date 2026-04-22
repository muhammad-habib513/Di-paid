# Di-Paid Backend

This is the backend for the Di-Paid Tipping Bill Splitting Platform, built with Flask and MySQL.

## Features
- User authentication and management
- Group and expense management
- Payment integration (Easypaisa, Jazzcash, Bank Transfer)
- Notifications, reminders, and email automation
- Reporting, chat, and more

## Structure
```
di_paid_backend/
│
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── static/
│   └── templates/
├── migrations/
├── tests/
├── config.py
├── requirements.txt
├── run.py
└── README.md
```

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Configure your database in `config.py`
3. Run migrations: `flask db upgrade`
4. Start the server: `python run.py` 