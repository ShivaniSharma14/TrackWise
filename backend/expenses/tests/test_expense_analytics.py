from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from expenses.models import Expense
from expenses.services.expense_analytics import (
    get_average_monthly_spend,
    get_category_breakdown_with_percentage,
    get_expense_analytics,
    get_highest_expense,
)

User = get_user_model()


def make_expense(user, amount, category, date_):
    return Expense.objects.create(
        user=user,
        amount=Decimal(str(amount)),
        category=category,
        date=date_,
    )


class TestAverageMonthlySpend(TestCase):
    def _history(self, totals):
        return [
            {"month": f"2025-{i + 1:02d}", "total": Decimal(str(t))}
            for i, t in enumerate(totals)
        ]

    def test_all_zero_months_returns_zero(self):
        result = get_average_monthly_spend(self._history([0, 0, 0]))
        self.assertEqual(result, Decimal("0.00"))

    def test_averages_only_non_zero_months(self):
        # 9 empty + 3 active → should divide by 3, not 12
        result = get_average_monthly_spend(self._history([0] * 9 + [100, 200, 300]))
        self.assertEqual(result, Decimal("200.00"))


class TestCategoryBreakdown(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="shivani@example.com", password="test"
        )

    def test_empty_range_returns_empty_list(self):
        qs = Expense.objects.filter(user=self.user)
        result = get_category_breakdown_with_percentage(
            qs, date(2026, 3, 1), date(2026, 3, 31)
        )
        self.assertEqual(result, [])

    def test_single_category_is_100_percent(self):
        make_expense(self.user, 200, "food", date(2026, 3, 10))
        qs = Expense.objects.filter(user=self.user)
        result = get_category_breakdown_with_percentage(
            qs, date(2026, 3, 1), date(2026, 3, 31)
        )
        self.assertEqual(result[0]["percentage"], Decimal("100.00"))

    def test_ordered_by_highest_total_first(self):
        make_expense(self.user, 300, "rent", date(2026, 3, 1))
        make_expense(self.user, 50, "food", date(2026, 3, 5))
        qs = Expense.objects.filter(user=self.user)
        result = get_category_breakdown_with_percentage(
            qs, date(2026, 3, 1), date(2026, 3, 31)
        )
        self.assertEqual(result[0]["category"], "rent")


class TestHighestExpense(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="shivani2@example.com", password="test"
        )

    def test_returns_none_when_no_expenses(self):
        qs = Expense.objects.filter(user=self.user)
        result = get_highest_expense(qs, date(2026, 3, 1), date(2026, 3, 31))
        self.assertIsNone(result)

    def test_returns_highest_amount(self):
        make_expense(self.user, 50, "food", date(2026, 3, 5))
        make_expense(self.user, 200, "rent", date(2026, 3, 1))
        qs = Expense.objects.filter(user=self.user)
        result = get_highest_expense(qs, date(2026, 3, 1), date(2026, 3, 31))
        self.assertEqual(result["amount"], Decimal("200.00"))


class TestGetExpenseAnalytics(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="shivani@exmaple.com", password="test"
        )
        cls.other_user = User.objects.create_user(
            email="other@example.com", password="test"
        )
        make_expense(cls.user, 100, "food", date(2026, 3, 10))
        make_expense(cls.user, 200, "rent", date(2026, 2, 5))

    def test_top_level_keys_present(self):
        result = get_expense_analytics(self.user)
        self.assertIn("monthly_trend", result)
        self.assertIn("category_distribution_this_month", result)
        self.assertIn("spending_behavior_this_month", result)
        self.assertIn("month_comparison", result)

    def test_monthly_trend_always_has_12_entries(self):
        result = get_expense_analytics(self.user)
        self.assertEqual(len(result["monthly_trend"]["history"]), 12)

    def test_other_user_expenses_do_not_leak(self):
        make_expense(self.other_user, 99999, "other", date(2026, 3, 20))
        result = get_expense_analytics(self.user)
        total = result["spending_behavior_this_month"]["total_spent"]
        self.assertLess(total, Decimal("99999.00"))

    def test_new_user_with_no_expenses_does_not_crash(self):
        empty_user = User.objects.create_user(
            email="empty@example.com", password="test"
        )
        try:
            result = get_expense_analytics(empty_user)
        except Exception as e:
            self.fail(f"Crashed for user with no expenses: {e}")
        self.assertEqual(
            result["spending_behavior_this_month"]["total_spent"], Decimal("0.00")
        )
