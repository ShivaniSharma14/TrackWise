
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from expenses.models import Expense
from habits.models import Habit, HabitLog


DEMO_EMAIL = "demo@trackwise.app"
DAYS = 90

HABITS = [
    ("Morning workout", 30, "MINUTES", 0.80),
    ("Read a book", 30, "MINUTES", 0.70),
    ("DSA practice", 2, "COUNT", 0.85),
    ("Meditation", 10, "MINUTES", 0.60),
    ("Drink water (glasses)", 8, "COUNT", 0.75),
    ("No sugar", 1, "BOOL", 0.55),
]

EXPENSES = {
    "Food": (
        ["Swiggy", "Zomato", "Cafe Coffee Day", "Local dhaba", "BigBasket"],
        80, 650, 0.70,
    ),
    "Transport": (
        ["Uber", "Ola", "Metro card", "Petrol"],
        40, 400, 0.30,
    ),
    "Entertainment": (
        ["Netflix", "BookMyShow", "Spotify", "Steam"],
        150, 900, 0.10,
    ),
    "Shopping": (
        ["Amazon", "Myntra", "Decathlon"],
        300, 3000, 0.07,
    ),
    "Health": (
        ["Apollo Pharmacy", "Cult.fit", "Lab test"],
        150, 1500, 0.05,
    ),
    "Other": (
        ["Stationery", "Gift", "Print shop"],
        50, 800, 0.06,
    ),
}


class Command(BaseCommand):
    help = "Create or refresh the read-only TrackWise demo account."

    @transaction.atomic
    def handle(self, *args, **options):
        rng = random.Random(42)
        today = timezone.localdate()

        user = User.objects.filter(email=DEMO_EMAIL).first()

        if user is not None and not user.is_demo:
            raise CommandError(
                f"{DEMO_EMAIL} already exists but is not marked as a demo account. "
                "No data was changed."
            )

        if user is None:
            user = User.objects.create_user(
                email=DEMO_EMAIL,
                password=None,
                first_name="Demo",
                last_name="User",
                is_demo=True,
            )
        else:
            user.first_name = "Demo"
            user.last_name = "User"
            user.is_demo = True
            user.save(update_fields=["first_name", "last_name", "is_demo"])

        user.set_unusable_password()
        user.save(update_fields=["password"])

        # Refresh only this dedicated demo account's data.
        Habit.objects.filter(user=user).delete()
        Expense.objects.filter(user=user).delete()

        start_date = today - timedelta(days=DAYS)
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

            for offset in range(DAYS + 1):
                day = today - timedelta(days=offset)
                roll = rng.random()

                if offset < forced_streak or roll < probability:
                    value = (
                        target
                        if unit == "BOOL"
                        else int(target * rng.uniform(1.0, 1.3))
                    )
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

        for offset in range(DAYS + 1):
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
                        merchant=rng.choice(
                            ["Electricity board", "Airtel", "Jio Fiber"]
                        ),
                        amount=Decimal(rng.randint(350, 1400)),
                    )
                )

        HabitLog.objects.bulk_create(logs)
        Expense.objects.bulk_create(expenses)

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo account ready: {len(HABITS)} habits, "
                f"{len(logs)} habit logs, and {len(expenses)} expenses."
            )
        )
