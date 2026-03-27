from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch
from datetime import date
from expenses.models import Expense
from expenses.services.expense_stats import (
    get_user_expenses,
    get_spent_in_range,
    get_category_breakdown,
    get_top_category,
    get_last_7_days_spending,
    get_monthly_spending_history,
    get_month_change,
    get_expense_dashboard_stats,
    get_this_month_range,
    get_last_month_range
)

User = get_user_model()


class ExpenseStatsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="pass@123")
        self.other_user = User.objects.create_user(email="other@example.com", password="pass@123")
        self.today = timezone.localdate()
        self.queryset = get_user_expenses(self.user)

    def _create_expense(self, amount, date, category="food", user=None):
        return Expense.objects.create(
            amount=amount,
            date=date,
            category=category,
            note="test",
            user=user or self.user
        )



    def test_get_user_expenses_returns_only_own(self):
        self._create_expense(100, self.today)
        self._create_expense(200, self.today, user=self.other_user)
        qs = get_user_expenses(self.user)
        self.assertEqual(qs.count(), 1)

    def test_get_user_expenses_empty(self):
        qs = get_user_expenses(self.user)
        self.assertEqual(qs.count(), 0)


    def test_spent_in_range_correct_total(self):
        self._create_expense(500, self.today)
        self._create_expense(300, self.today)
        total = get_spent_in_range(self.queryset, self.today, self.today)
        self.assertEqual(total, Decimal("800.00"))

    def test_spent_in_range_excludes_outside_dates(self):
        self._create_expense(500, self.today - timedelta(days=10))
        total = get_spent_in_range(self.queryset, self.today, self.today)
        self.assertEqual(total, Decimal("0.00"))

    def test_spent_in_range_no_expenses_returns_zero(self):
        total = get_spent_in_range(self.queryset, self.today, self.today)
        self.assertEqual(total, Decimal("0.00"))

    def test_category_breakdown_correct(self):
        self._create_expense(500, self.today, category="food")
        self._create_expense(300, self.today, category="shopping")
        result = get_category_breakdown(self.queryset, self.today, self.today)
        categories = [item["category"] for item in result]
        self.assertIn("food", categories)
        self.assertIn("shopping", categories)

    def test_category_breakdown_ordered_by_total_desc(self):
        self._create_expense(300, self.today, category="food")
        self._create_expense(800, self.today, category="shopping")
        result = get_category_breakdown(self.queryset, self.today, self.today)
        self.assertEqual(result[0]["category"], "shopping")

    def test_category_breakdown_empty(self):
        result = get_category_breakdown(self.queryset, self.today, self.today)
        self.assertEqual(result, [])

    def test_top_category_returns_highest(self):
        self._create_expense(300, self.today, category="food")
        self._create_expense(800, self.today, category="shopping")
        result = get_top_category(self.queryset, self.today, self.today)
        self.assertEqual(result["category"], "shopping")

    def test_top_category_no_expenses_returns_none(self):
        result = get_top_category(self.queryset, self.today, self.today)
        self.assertIsNone(result)


    def test_last_7_days_returns_7_entries(self):
        result = get_last_7_days_spending(self.queryset)
        self.assertEqual(len(result), 7)

    def test_last_7_days_correct_spending(self):
        self._create_expense(400, self.today)
        result = get_last_7_days_spending(self.queryset)
        today_entry = next(r for r in result if r["date"] == self.today) # next() picks the first object where condition match
        self.assertEqual(today_entry["spending"], Decimal("400.00"))

    def test_last_7_days_missing_days_are_zero(self):
        result = get_last_7_days_spending(self.queryset)
        for entry in result:
            self.assertEqual(entry["spending"], Decimal("0.00"))


    def test_monthly_history_returns_correct_months(self):
        self._create_expense(1000, self.today)
        result = get_monthly_spending_history(self.queryset, months=6)
        self.assertEqual(len(result), 1)####

    def test_monthly_history_format(self):
        self._create_expense(1000, self.today)
        result = get_monthly_spending_history(self.queryset, months=6)
        self.assertRegex(result[-1]["month"], r"^\d{4}-\d{2}$")  # YYYY-MM

    def test_monthly_history_empty(self):
        result = get_monthly_spending_history(self.queryset, months=6)
        self.assertEqual(result, [])



    def test_month_change_with_last_month_data(self):
        result = get_month_change(Decimal("1500"), Decimal("1000"))
        self.assertEqual(result["amount_difference"], Decimal("500"))
        self.assertEqual(result["percentage_change"], 50.0)

    def test_month_change_last_month_zero(self):
        result = get_month_change(Decimal("1000"), Decimal("0"))
        self.assertIsNone(result["percentage_change"])
        self.assertEqual(result["amount_difference"], Decimal("1000"))

    def test_month_change_spending_decreased(self):
        result = get_month_change(Decimal("500"), Decimal("1000"))
        self.assertEqual(result["amount_difference"], Decimal("-500"))
        self.assertEqual(result["percentage_change"], -50.0)


    def test_dashboard_stats_keys(self):
        result = get_expense_dashboard_stats(self.user)
        expected_keys = [
            "this_month_spent",
            "last_month_spent",
            "month_change",
            "top_category_this_month",
            "category_breakdown_this_month",
            "last_7_days_spending",
            "monthly_spending_history",
        ]
        for key in expected_keys:
            self.assertIn(key, result)

    def test_dashboard_stats_scoped_to_user(self):
        self._create_expense(1000, self.today, user=self.user)
        self._create_expense(9999, self.today, user=self.other_user)
        result = get_expense_dashboard_stats(self.user)
        self.assertEqual(result["this_month_spent"], Decimal("1000.00"))

    @patch("expenses.services.expense_stats.timezone.localdate")# patch relace the today with mockdate we set
    def test_get_this_month_range(self, mock_localdate):
        mock_localdate.return_value = date(2026, 3, 26)

        start, end = get_this_month_range()

        self.assertEqual(start, date(2026, 3, 1))
        self.assertEqual(end, date(2026, 3, 26))

    @patch("expenses.services.expense_stats.timezone.localdate")
    def test_get_last_month_range(self, mock_localdate):
       mock_localdate.return_value = date(2026, 3, 26)

       start, end = get_last_month_range()

       self.assertEqual(start, date(2026, 2, 1))
       self.assertEqual(end, date(2026, 2, 28))