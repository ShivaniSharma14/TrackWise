# TrackWise

TrackWise is a Django REST Framework backend project to manage personal productivity and daily life tracking. It provides APIs for tracking daily habits and expenses with user authentication and ownership-based access control.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Expenses](#expenses)
  - [Habits](#habits)
  - [Dashboard](#dashboard)
- [API Usage Examples](#api-usage-examples)
- [Filtering & Ordering](#filtering--ordering)
- [Running Tests](#running-tests)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Django 5.2 |
| API | Django REST Framework 3.16 |
| Authentication | SimpleJWT (JWT) |
| Database | SQLite (default) |
| Filtering | django-filter |
| Python | 3.x |

---

## Features

### Completed
- Custom user authentication with JWT (email-based login)
- Expense CRUD API with filtering and ordering
- Habit and habit log models with validation
- Ownership-based access control (users can only see their own data)
- Dashboard summaries and analytics for both modules

### In Progress
- Additional habit validation rules
- Extended testing coverage

---

## Project Structure

```
TrackWise/
├── config/                  # Django project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py             # Root URL routing
│   └── dashboard.py        # Combined dashboard view
├── accounts/               # User authentication app
│   ├── models.py           # Custom User model
│   ├── views.py            # Register, login, logout
│   ├── serializers.py      # Auth serializers
│   └── urls.py              # Auth routes
├── expenses/               # Expense tracking app
│   ├── models.py           # Expense model
│   ├── views.py            # CRUD + stats views
│   ├── serializers.py      # Expense serializer
│   ├── filters.py          # Expense filters
│   ├── permissions.py      # IsOwner permission
│   └── services/           # Analytics & stats
├── habits/                 # Habit tracking app
│   ├── models.py           # Habit & HabitLog models
│   ├── views.py            # CRUD + streak views
│   ├── serializers.py     # Habit serializers
│   ├── permissions.py      # IsOwner permission
│   └── services/           # Streaks, stats, dashboard
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies
└── manage.py              # Django management script
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd TrackWise

# 2. Create and activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment file
copy .env.example .env

# 5. Run migrations
python manage.py migrate

# 6. Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

---

## Environment Setup

Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
```

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Required |
| `DEBUG` | Debug mode | `False` |

---

## API Endpoints

> **All endpoints (except register/login) require authentication.**  
> Include the JWT access token in the `Authorization` header: `Bearer <access_token>`

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/accounts/register/` | Register new user | No |
| POST | `/api/accounts/login/` | Login, get tokens | No |
| POST | `/api/accounts/refresh/` | Refresh access token | No |
| POST | `/api/accounts/logout/` | Blacklist refresh token | Yes |

### Expenses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/expenses/` | List all expenses | Yes |
| POST | `/api/expenses/` | Create expense | Yes |
| GET | `/api/expenses/{id}/` | Retrieve expense | Yes |
| PUT/PATCH | `/api/expenses/{id}/` | Update expense | Yes |
| DELETE | `/api/expenses/{id}/` | Delete expense | Yes |
| GET | `/api/expenses/stats/dashboard/` | Dashboard stats | Yes |
| GET | `/api/expenses/stats/analytics/` | Analytics data | Yes |

### Habits

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/habits/` | List all habits | Yes |
| POST | `/api/habits/` | Create habit | Yes |
| GET | `/api/habits/{id}/` | Retrieve habit | Yes |
| PUT/PATCH | `/api/habits/{id}/` | Update habit | Yes |
| DELETE | `/api/habits/{id}/` | Delete habit | Yes |
| GET | `/api/habits/{id}/streak/` | Get habit streak | Yes |
| GET | `/api/habits/{id}/stats/` | Get habit stats | Yes |
| GET | `/api/habits/logs/` | List habit logs | Yes |
| POST | `/api/habits/logs/` | Create habit log | Yes |
| GET | `/api/habits/dashboard/summary/` | Habits dashboard | Yes |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/summary/` | Combined summary | Yes |

---

## API Usage Examples

### Register a New User

```bash
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "strongpassword123"}'
```

**Response:**
```json
{"message": "User successfully registered."}
```

### Login (Get Tokens)

```bash
curl -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "strongpassword123"}'
```

**Response:**
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

### Refresh Access Token

```bash
curl -X POST http://localhost:8000/api/accounts/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

### Create an Expense

```bash
curl -X POST http://localhost:8000/api/expenses/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "150.00",
    "date": "2025-04-03",
    "category": "Food",
    "note": "Lunch at cafe"
  }'
```

### List Expenses with Filters

```bash
# Filter by category
curl "http://localhost:8000/api/expenses/?category=Food" \
  -H "Authorization: Bearer <access_token>"

# Filter by date range
curl "http://localhost:8000/api/expenses/?date_after=2025-01-01&date_before=2025-04-03" \
  -H "Authorization: Bearer <access_token>"

# Order by amount descending
curl "http://localhost:8000/api/expenses/?ordering=-amount" \
  -H "Authorization: Bearer <access_token>"
```

### Create a Habit

```bash
curl -X POST http://localhost:8000/api/habits/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Exercise",
    "frequency": "DAILY",
    "target_value": 30,
    "target_unit": "MINUTES",
    "start_date": "2025-04-01",
    "is_active": true
  }'
```

### Log Habit Completion

```bash
curl -X POST http://localhost:8000/api/habits/logs/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "habit": 1,
    "date": "2025-04-03",
    "value": 30,
    "note": "Great workout!"
  }'
```

### Get Habit Streak

```bash
curl http://localhost:8000/api/habits/1/streak/ \
  -H "Authorization: Bearer <access_token>"
```

### Get Expense Analytics

```bash
curl http://localhost:8000/api/expenses/stats/analytics/ \
  -H "Authorization: Bearer <access_token>"
```

### Logout (Blacklist Token)

```bash
curl -X POST http://localhost:8000/api/accounts/logout/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

---

## Filtering & Ordering

### Expense Filters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `category` | Filter by category | `?category=Food` |
| `date` | Filter by exact date | `?date=2025-04-03` |
| `date_after` | Filter from date | `?date_after=2025-01-01` |
| `date_before` | Filter until date | `?date_before=2025-04-03` |
| `amount_min` | Minimum amount | `?amount_min=10` |
| `amount_max` | Maximum amount | `?amount_max=500` |

### Ordering

Append `ordering` parameter with field name. Use `-` prefix for descending.

| Field | Example |
|-------|---------|
| `date` | `?ordering=date` |
| `-date` | `?ordering=-date` |
| `amount` | `?ordering=amount` |
| `-amount` | `?ordering=-amount` |
| `created_at` | `?ordering=created_at` |

**Multiple orderings:** `?ordering=-date,amount`

---

## Running Tests

```bash
# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test expenses
python manage.py test habits
python manage.py test accounts
```

---

## Models Overview

### User (`accounts.User`)
- `email` - Unique email address (used as username)
- `password` - Hashed password
- Authentication via JWT tokens

### Expense (`expenses.Expense`)
- `user` - Foreign key to User
- `amount` - Decimal amount
- `date` - Date of expense
- `category` - Category string (max 50 chars)
- `note` - Optional note
- `created_at`, `updated_at` - Timestamps

### Habit (`habits.Habit`)
- `user` - Foreign key to User
- `name` - Habit name
- `frequency` - Currently only "DAILY"
- `target_value` - Target value to achieve
- `target_unit` - MINUTES, COUNT, or BOOL
- `start_date` - Habit start date
- `is_active` - Boolean flag

### HabitLog (`habits.HabitLog`)
- `habit` - Foreign key to Habit
- `date` - Log date
- `value` - Completed value
- `note` - Optional note
- Unique constraint: one log per habit per day

---

## JWT Configuration

Tokens are configured in `config/settings.py`:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

> **Note:** Access tokens expire in 5 minutes. Use the refresh endpoint to get a new access token.

---

## Need Help?

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- SimpleJWT: https://django-rest-framework-simplejwt.readthedocs.io/
