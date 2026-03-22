from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Avg
from django.db.models.functions import Coalesce, TruncMonth, Round
from django.utils import timezone

from expenses.services.expense_stats import (
    get_user_expenses,
    get_this_month_range,
    get_last_month_range,
    get_spent_in_range,
)


def get_last_n_month_starts(months=12):
    today = timezone.localdate()
    current = today.replace(day=1)
    month_starts = []
    for _ in range(months):
        month_starts.append(current)
        current = (current - timedelta(days=1)).replace(day=1)
    month_starts.reverse()
    return month_starts, today


def get_monthly_spending_history(queryset, months=12):
    month_starts, today = get_last_n_month_starts(months=months)
    start_date = month_starts[0]
    raw = (
        queryset.filter(date__gte=start_date, date__lte=today)
        .annotate(month=TruncMonth("date"))
        .values("month")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0.00")))
        .order_by("month")
    )
    spending_map = {
        item["month"]: item["total"]
        for item in raw
    }
    history = []
    for month_start in month_starts:
        history.append(
            {
                "month": month_start.strftime("%Y-%m"),
                "total": spending_map.get(month_start, Decimal("0.00")),
            }
        )
    return history


def get_average_monthly_spend(monthly_history):
    non_zero_months = [
        item["total"]
        for item in monthly_history
        if item["total"] > 0
    ]

    if not non_zero_months:
        return Decimal("0.00")

    total = sum(non_zero_months, Decimal("0.00"))
    return round(total / len(non_zero_months), 2)


def get_category_breakdown_with_percentage(queryset, start_date, end_date):
    filtered = queryset.filter(date__gte=start_date, date__lte=end_date)

    total_spent = filtered.aggregate(
        total=Coalesce(Sum("amount"), Decimal("0.00"))
    )["total"]

    data = (
        filtered.values("category")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0.00")))
        .order_by("-total")
    )

    result = []
    for item in data:
        percentage = Decimal("0.00")

        if total_spent > 0:
            percentage = round((item["total"] / total_spent) * 100, 2)

        result.append(
            {
                "category": item["category"],
                "total": item["total"],
                "percentage": percentage,
            }
        )

    return result


def get_summary_metrics(queryset, start_date, end_date):
    filtered = queryset.filter(date__gte=start_date, date__lte=end_date)

    return filtered.aggregate(
        total_expenses_count=Count("id"),
        average_expense_amount=Round(Coalesce(Avg("amount"), Decimal("0.00")),2),
        total_spent=Coalesce(Sum("amount"), Decimal("0.00")),
    )


def get_highest_expense(queryset, start_date, end_date):
    expense = (
        queryset.filter(date__gte=start_date, date__lte=end_date)
        .order_by("-amount", "-date")
        .first()
    )

    if not expense:
        return None

    return {
        "id": expense.id,
        "amount": expense.amount,
        "category": expense.category,
        "date": expense.date,
        "note": expense.note,
    }


def get_most_frequent_category(queryset, start_date, end_date):
    data = (
        queryset.filter(date__gte=start_date, date__lte=end_date)
        .values("category")
        .annotate(count=Count("id"))
        .order_by("-count", "category")
        .first()
    )

    if not data:
        return None

    return data


def get_month_comparison(queryset):
    this_month_start, today = get_this_month_range()
    last_month_start, last_month_end = get_last_month_range()

    this_month_spent = get_spent_in_range(queryset, this_month_start, today)
    last_month_spent = get_spent_in_range(queryset, last_month_start, last_month_end)

    amount_difference = this_month_spent - last_month_spent

    percentage_change = None
    if last_month_spent > 0:
        percentage_change = round((amount_difference / last_month_spent) * 100, 2)

    return {
        "this_month_spent": this_month_spent,
        "last_month_spent": last_month_spent,
        "amount_difference": amount_difference,
        "percentage_change": percentage_change,
    }


def get_expense_analytics(user):
    queryset = get_user_expenses(user)
    this_month_start, today = get_this_month_range()

    monthly_history = get_monthly_spending_history(queryset, months=12)
    average_monthly_spend = get_average_monthly_spend(monthly_history)
    category_breakdown = get_category_breakdown_with_percentage(
        queryset, this_month_start, today
    )
    summary_metrics = get_summary_metrics(queryset, this_month_start, today)
    highest_expense = get_highest_expense(queryset, this_month_start, today)
    most_frequent_category = get_most_frequent_category(
        queryset, this_month_start, today
    )
    month_comparison = get_month_comparison(queryset)

    return {
        "monthly_trend": {
            "history": monthly_history,
            "average_monthly_spend": average_monthly_spend,
        },
        "category_distribution_this_month": category_breakdown,
        "spending_behavior_this_month": {
            "total_expenses_count": summary_metrics["total_expenses_count"],
            "average_expense_amount": summary_metrics["average_expense_amount"],
            "total_spent": summary_metrics["total_spent"],
            "highest_expense": highest_expense,
            "most_frequent_category": most_frequent_category,
        },
        "month_comparison": month_comparison,
    }