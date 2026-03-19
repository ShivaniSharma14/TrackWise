from expenses.models import Expense
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum
from django.db.models.functions import Coalesce, TruncMonth


def get_user_expenses(user):
    return Expense.objects.filter(user=user)

def get_this_month_range():
    today = timezone.localdate()
    start = today.replace(day=1)
    return start, today
    
def get_last_month_range():
    today = timezone.localdate()
    this_month_start = today.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    return last_month_start, last_month_end

def get_spent_in_range(queryset, start_date, end_date):
    total = queryset.filter(
        date__gte=start_date,
        date__lte=end_date
    ).aggregate(
        total = Coalesce(Sum("amount"),Decimal("0.0"))
    )["total"]
    return total

def get_category_breakdown(queryset, start_date, end_date):
    data = (
        queryset.filter(date__gte=start_date, date__lte=end_date)
        .values("category")
        .annotate(total = Coalesce(Sum("amount"), Decimal("0.0")))
        .order_by("-total")
    )

    return [
        {
            "category":item["category"],
            "total":item["total"] 
        }
        for item in data
    ]

def get_top_category(queryset, start_date, end_date):
    categories = get_category_breakdown(queryset, start_date, end_date)
    if not categories:
        return None
    else:
        return categories[0]
    
def get_last_7_days_spending(queryset):
    today = timezone.localdate()
    start = today - timedelta(days=6)

    raw = (queryset.filter(date__gte=start, date__lte=today)
           .values("date")
           .annotate(total=Coalesce(Sum("amount"), Decimal("0.00")))
           .order_by("date")
           )
    
    spending_map = {
        item["date"] : item["total"]
        for item in raw
    }
    result = []
    current = start
    while current<=today:
        result.append({
                "date":current,
                "spending":spending_map.get(current , Decimal("0.00"))
            })
        current = current + timedelta(days=1)
    return result
        
def get_monthly_spending_history(queryset, months=6):
    today = timezone.localdate()
    approx_start = (today.replace(day=1) - timedelta(days=32 * (months - 1))).replace(day=1)

    raw = (
        queryset.filter(date__gte=approx_start, date__lte=today)
        .annotate(month=TruncMonth("date"))
        .values("month")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0.00")))
        .order_by("month")
    )

    return [
        {
            "month": item["month"].strftime("%Y-%m"),
            "total": item["total"]
        }
        for item in raw
    ]

def get_month_change(this_month_spent, last_month_spent):
    if last_month_spent==0:
        return{
            "amount_difference":this_month_spent,
            "percentage_change":None
        }
    diff = this_month_spent - last_month_spent
    percentage_change = (diff/last_month_spent)*100
    return{
        "amount_difference":diff,
        "percentage_change":round(percentage_change,2)
    }

def get_expense_dashboard_stats(user):
    queryset = get_user_expenses(user)
    this_month_start, today = get_this_month_range()
    last_month_start, last_month_end = get_last_month_range()
    this_month_spent = get_spent_in_range(queryset, this_month_start, today)
    last_month_spent = get_spent_in_range(queryset, last_month_start, last_month_end)
    category_breakdown = get_category_breakdown(queryset, this_month_start, today)
    top_category = get_top_category(queryset, this_month_start, today)
    last_7_days = get_last_7_days_spending(queryset)
    monthly_history = get_monthly_spending_history(queryset, months=6)
    month_change = get_month_change(this_month_spent, last_month_spent)
    return {
        "this_month_spent": this_month_spent,
        "last_month_spent": last_month_spent,
        "month_change": month_change,
        "top_category_this_month": top_category,
        "category_breakdown_this_month": category_breakdown,
        "last_7_days_spending": last_7_days,
        "monthly_spending_history": monthly_history,
    }


    