from expenses.models import Expense
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum
from django.db.models.functions import Coalesce


def get_expense_trend(user, days=7):
    """Get daily expense trend for the last N days."""
    today = timezone.localdate()
    start = today - timedelta(days=days - 1)

    queryset = Expense.objects.filter(user=user)

    raw = (
        queryset.filter(date__gte=start, date__lte=today)
        .values("date")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0.00")))
        .order_by("date")
    )

    spending_map = {item["date"]: float(item["total"]) for item in raw}
    result = []
    current = start
    while current <= today:
        result.append({
            "date": str(current),
            "spending": spending_map.get(current, 0.0),
        })
        current = current + timedelta(days=1)

    return {
        "days": days,
        "trend": result,
    }
