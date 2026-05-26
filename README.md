````markdown
# TrackWise

A full-stack productivity dashboard that combines habit tracking and expense management into a unified analytics-driven system.

Built with:

- Django REST Framework backend
- React + TypeScript frontend
- PostgreSQL database
- JWT authentication

TrackWise focuses on scalable backend architecture, analytics aggregation, modular service-layer design, and responsive dashboard UI.

---

## Screenshots

> Add screenshots here after deployment

### Dashboard

![Dashboard Screenshot](./screenshots/dashboard.png)

### Habits

![Habits Screenshot](./screenshots/habits.png)

### Expenses

![Expenses Screenshot](./screenshots/expenses.png)

### Analytics

![Analytics Screenshot](./screenshots/analytics.png)

---

## Features

### Habit Tracking

- Create habits with measurable targets
- Track streaks and completion rates
- Daily logging system
- Category-based organization
- 7-day progress visualization
- Habit analytics and trends

### Expense Tracking

- Record and categorize expenses
- Monthly and weekly spending analysis
- Category breakdowns
- Transaction filtering and sorting
- CSV export support
- Trend visualization

### Dashboard & Analytics

- Unified productivity dashboard
- Real-time analytics aggregation
- Monthly summaries
- Progress insights
- Interactive charts and metrics

### Authentication & Security

- JWT authentication
- Refresh token rotation
- Object-level permissions
- User data isolation
- Protected API routes

---

## Tech Stack

| Layer                  | Technology                            |
| ---------------------- | ------------------------------------- |
| Frontend               | React, TypeScript, Tailwind CSS, Vite |
| Backend                | Django, Django REST Framework         |
| Database               | PostgreSQL                            |
| Authentication         | JWT (SimpleJWT)                       |
| Filtering              | django-filter                         |
| Charts                 | Recharts                              |
| State & API            | Axios                                 |
| Planned Infrastructure | Redis, Celery                         |

---

## System Architecture

```text
React Frontend (TypeScript + Tailwind)
                │
                │ HTTP / JSON
                ▼
Django REST Framework API
                │
                ▼
Service Layer (Business Logic)
                │
                ▼
Django ORM
                │
                ▼
PostgreSQL Database
```

The backend follows a layered architecture where:

- Views handle HTTP concerns
- Services contain business logic
- Models define persistence
- PostgreSQL handles relational storage and aggregation

This separation improves:

- maintainability
- scalability
- testability
- code reuse

---

## Project Structure

```text
TrackWise/
│
├── backend/
│   ├── accounts/
│   ├── habits/
│   ├── expenses/
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   ├── services/
│   │   ├── styles/
│   │   └── types/
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Database Design

### Core Models

#### User

- Custom email-based authentication model
- UUID primary keys
- JWT authentication support

#### Habit

- User-linked habits
- Configurable target units
- Category-based organization
- Frequency tracking

#### HabitLog

- Daily completion records
- Streak calculations
- One log per habit per day

#### Expense

- Decimal-based financial records
- Category tracking
- Date indexing for analytics

### Database Features

- PostgreSQL relational schema
- Indexed query paths
- Foreign key constraints
- Unique constraints
- Optimized analytics queries

---

## Key Engineering Decisions

### Service Layer Pattern

Business logic is isolated into dedicated service modules instead of being embedded directly inside views.

Benefits:

- reusable logic
- cleaner views
- easier testing
- future Celery compatibility

Example services:

- streak calculation
- dashboard aggregation
- analytics generation
- expense trend analysis

---

### PostgreSQL Migration

The project was migrated from SQLite to PostgreSQL to support:

- better relational integrity
- indexing
- scalable analytics queries
- production-ready architecture
- concurrent access handling

---

### JWT Authentication

JWT-based authentication was chosen because:

- frontend and backend are decoupled
- APIs remain stateless
- suitable for SPA architecture
- easier future scaling

---

### TypeScript Frontend

TypeScript strict typing improves:

- maintainability
- refactoring safety
- API contract consistency
- frontend reliability

---

## API Overview

### Main API Modules

| Module            | Purpose                      |
| ----------------- | ---------------------------- |
| `/api/auth/`      | Authentication               |
| `/api/habits/`    | Habit CRUD & analytics       |
| `/api/expenses/`  | Expense CRUD & analytics     |
| `/api/dashboard/` | Combined dashboard summaries |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

---

# Backend Setup

## 1. Clone Repository

```bash
git clone https://github.com/ShivaniSharma14/TrackWise.git
cd TrackWise/backend
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create `.env` inside `backend/`

```env
DEBUG=True

SECRET_KEY=your-secret-key

DB_NAME=trackwise_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

ALLOWED_HOSTS=127.0.0.1,localhost
```

---

## 5. Run Migrations

```bash
python manage.py migrate
```

---

## 6. Create Superuser

```bash
python manage.py createsuperuser
```

---

## 7. Run Backend Server

```bash
python manage.py runserver
```

Backend runs on:

```text
http://localhost:8000
```

---

# Frontend Setup

## 1. Navigate to Frontend

```bash
cd ../frontend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Frontend Environment

Create `.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 4. Run Frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## PostgreSQL Setup

### Create Database

```sql
CREATE DATABASE trackwise_db;
```

Update backend `.env` with PostgreSQL credentials.

---

## Running Tests

```bash
python manage.py test
```

---

## Challenges Faced

### Analytics Query Performance

Analytics endpoints became slower as data volume increased. Query optimization and indexing were introduced to improve dashboard responsiveness.

### Streak Calculation Complexity

Efficient streak computation required optimized date-based querying and aggregation logic.

### User Data Isolation

Object-level permissions and queryset filtering were implemented to ensure secure multi-user separation.

### Frontend State Management

Managing JWT authentication, protected routes, and API synchronization required careful state handling.

---

## Future Improvements

### Infrastructure

- Redis caching
- Celery background jobs
- Scheduled analytics tasks
- Async email notifications

### DevOps

- Docker support
- CI/CD pipeline
- Production deployment
- Monitoring & logging

### Features

- Mobile optimization
- Recurring expenses
- Notifications
- Advanced analytics
- Goal tracking
- Offline support

---

## Current Status

### Completed

- Full-stack architecture
- Habit tracking system
- Expense management
- Analytics dashboard
- PostgreSQL integration
- JWT authentication

### In Progress

- Deployment
- Redis integration
- Celery integration
- Performance optimization

---

## Learnings

This project provided hands-on experience with:

- REST API design
- PostgreSQL schema modeling
- JWT authentication
- analytics aggregation
- service-layer architecture
- frontend/backend integration
- TypeScript strict typing
- responsive dashboard systems

---

## Deployment

Deployment currently in progress.

Planned stack:

- Frontend: Vercel
- Backend: Render/Railway
- Database: PostgreSQL
- Cache/Queue: Redis

---

## Author

**Shivani Sharma**

GitHub:
https://github.com/ShivaniSharma14

---

## License

This project is licensed under the MIT License.
````
