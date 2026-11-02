import random
from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.utils import timezone

from accounts.models import User
from expenses.models import Expense
from habits.models import Habit, HabitLog


DEMO_TTL = timedelta(hours=2)
DEMO_EMAIL_PREFIX = "demo-workspace+"
MAX_DEMO_HABITS = 50
MAX_DEMO_EXPENSES = 500

HABITS = [
    ("Morning workout", 30, "MINUTES", 0.80),
    ("Read a book", 30, "MINUTES", 0.70),
    ("DSA practice", 2, "COUNT", 0.85),
    ("Meditation", 10, "MINUTES", 0.60),
    ("Drink water (glasses)", 8, "COUNT", 0.75),
    ("No sugar", 1, "BOOL", 0.55),
]

EXPENSES = {
    "Food": (["Swiggy", "Zomato", "Cafe Coffee Day", "Local dhaba", "BigBasket"], 80, 650, 0.70),
    "Transport": (["Uber", "Ola", "Metro card", "Petrol"], 40, 400, 0.30),
    "Entertainment": (["Netflix", "BookMyShow", "Spotify", "Steam"], 150, 900, 0.10),
    "Shopping": (["Amazon", "Myntra", "Decathlon"], 300, 3000, 0.07),
    "Health": (["Apollo Pharmacy", "Cult.fit", "Lab test"], 150, 1500, 0.05),
    "Other": (["Stationery", "Gift", "Print shop"], 50, 800, 0.06),
}


def demo_expires_at(user):
    return user.date_joined + DEMO_TTL


def is_demo_workspace_expired(user, now=None):
    if not getattr(user, "is_demo", False):
        return False
    return demo_expires_at(user) <= (now or timezone.now())


@transaction.atomic
def create_demo_workspace():
    email = f"{DEMO_EMAIL_PREFIX}{uuid4().hex}@trackwise.invalid"
    user = User.objects.create_user(
        email=email,
        password=None,
        first_name="Demo",
        last_name="Visitor",
        is_demo=True,
    )
    reset_demo_workspace(user)
    return user


@transaction.atomic
def reset_demo_workspace(user):
    if not user.is_demo or not user.email.startswith(DEMO_EMAIL_PREFIX):
        raise ValueError("Only a visitor demo workspace can be reset.")
    if is_demo_workspace_expired(user):
        raise ValueError("This demo workspace has expired.")

    Habit.objects.filter(user=user).delete()
    Expense.objects.filter(user=user).delete()

    rng = random.Random(42)
    today = timezone.localdate()
    days = 180
    start_date = today - timedelta(days=days)
    logs = []
    expenses = []

    for index, (name, target, unit, probability) in enumerate(HABITS):
        habit = Habit.objects.create(
            user=user,
            name=name,
            frequency="DAILY",
            target_value=target,
            target_unit=unit,
            start_date=start_date,
        )
        forced_streak = (14, 9, 21)[index] if index < 3 else 0

        for offset in range(days + 1):
            day = today - timedelta(days=offset)
            roll = rng.random()
            if offset < forced_streak or roll < probability:
                value = target if unit == "BOOL" else int(target * rng.uniform(1.0, 1.3))
            elif roll < probability + 0.12 and unit != "BOOL":
                value = max(1, int(target * rng.uniform(0.3, 0.7)))
            else:
                continue
            logs.append(
                HabitLog(
                    habit=habit,
                    date=day,
                    value=value,
                    note="Felt great" if rng.random() < 0.05 else "",
                )
            )

    for offset in range(days + 1):
        day = today - timedelta(days=offset)
        for category, (merchants, low, high, probability) in EXPENSES.items():
            if rng.random() < probability:
                expenses.append(
                    Expense(
                        user=user,
                        category=category,
                        date=day,
                        merchant=rng.choice(merchants),
                        amount=Decimal(rng.randint(low, high)),
                    )
                )
        if day.day in (5, 20):
            expenses.append(
                Expense(
                    user=user,
                    category="Utilities",
                    date=day,
                    merchant=rng.choice(["Electricity board", "Airtel", "Jio Fiber"]),
                    amount=Decimal(rng.randint(350, 1400)),
                )
            )

    HabitLog.objects.bulk_create(logs)
    Expense.objects.bulk_create(expenses)


def cleanup_expired_demo_workspaces():
    cutoff = timezone.now() - DEMO_TTL
    expired = User.objects.filter(
        is_demo=True,
        email__startswith=DEMO_EMAIL_PREFIX,
        date_joined__lte=cutoff,
    )
    count = expired.count()
    expired.delete()
    return count
