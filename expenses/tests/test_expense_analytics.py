# from datetime import date
# from decimal import Decimal
# from unittest.mock import patch
# from django.contrib.auth import get_user_model
# from django.test import TestCase

# from expenses.models import Expense
# from expenses.services.expense_analytics import (
#     get_average_monthly_spend,
#     get_category_breakdown_with_percentage,
#     get_expense_analytics,
#     get_highest_expense,
#     get_month_comparison,
#     get_monthly_spending_history,
#     get_most_frequent_category,
#     get_summary_metrics,
# )

# User = get_user_model()

# FIXED_TODAY = date(2026, 3, 27)
# THIS_MONTH_START = date(2026, 3, 1)
# LAST_MONTH_START = date(2026, 2, 1)
# LAST_MONTH_END = date(2026, 2, 28)


# def make_expense(user, amount, category, date_, note=""):
#     return Expense.objects.create(
#         user=user,
#         amount=Decimal(str(amount)),
#         category=category,
#         date=date_,
#         note=note,
#     )


# class ExpenseAnalyticsBaseTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         cls.user = User.objects.create_user(
#             email="shivani@example.com",
#             password="test12345",
#         )
#         cls.other_user = User.objects.create_user(
#             email="other@example.com",
#             password="test12345",
#         )

#     def qs(self, user=None):
#         return Expense.objects.filter(user=user or self.user)


# class TestGetAverageMonthlySpend(TestCase):
#     def make_history(self, totals):
#         return [
#             {"month": f"2026-{i+1:02d}", "total": Decimal(str(total))}
#             for i, total in enumerate(totals)
#         ]

#     def test_returns_zero_for_empty_or_all_zero_history(self):
#         self.assertEqual(get_average_monthly_spend([]), Decimal("0.00"))
#         self.assertEqual(
#             get_average_monthly_spend(self.make_history([0, 0, 0])),
#             Decimal("0.00"),
#         )

#     def test_averages_only_active_months(self):
#         history = self.make_history([0, 0, 100, 200, 300])
#         self.assertEqual(get_average_monthly_spend(history), Decimal("200.00"))

#     def test_rounds_to_two_decimal_places(self):
#         history = self.make_history([10.01, 20.02, 0])
#         self.assertEqual(get_average_monthly_spend(history), Decimal("15.02"))


# class TestGetMonthlySpendingHistory(ExpenseAnalyticsBaseTest):
#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     def test_returns_requested_number_of_slots(self, _):
#         make_expense(self.user, 50, "food", date(2026, 3, 10))
#         history = get_monthly_spending_history(self.qs(), months=12)
#         self.assertEqual(len(history), 12)

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     def test_missing_months_show_zero(self, _):
#         make_expense(self.user, 100, "food", date(2026, 3, 15))
#         history = get_monthly_spending_history(self.qs(), months=12)
#         history_map = {item["month"]: item["total"] for item in history}

#         self.assertEqual(history_map["2026-02"], Decimal("0.00"))
#         self.assertEqual(history_map["2026-03"], Decimal("100.00"))

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     def test_same_month_expenses_are_summed_into_one_bucket(self, _):
#         make_expense(self.user, 30, "food", date(2026, 3, 1))
#         make_expense(self.user, 70, "food", date(2026, 3, 20))

#         history = get_monthly_spending_history(self.qs(), months=12)
#         history_map = {item["month"]: item["total"] for item in history}

#         self.assertEqual(history_map["2026-03"], Decimal("100.00"))

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     def test_range_boundaries_are_inclusive(self, _):
#         make_expense(self.user, 40, "food", date(2025, 4, 1))   # oldest month start in 12-month window
#         make_expense(self.user, 60, "food", FIXED_TODAY)

#         history = get_monthly_spending_history(self.qs(), months=12)
#         history_map = {item["month"]: item["total"] for item in history}

#         self.assertEqual(history_map["2025-04"], Decimal("40.00"))
#         self.assertEqual(history_map["2026-03"], Decimal("60.00"))


# class TestGetCategoryBreakdown(ExpenseAnalyticsBaseTest):
#     def test_returns_empty_list_for_empty_range(self):
#         result = get_category_breakdown_with_percentage(
#             self.qs(), THIS_MONTH_START, FIXED_TODAY
#         )
#         self.assertEqual(result, [])

#     def test_returns_correct_totals_percentages_and_order(self):
#         make_expense(self.user, 200, "food", date(2026, 3, 10))
#         make_expense(self.user, 100, "transport", date(2026, 3, 12))

#         result = get_category_breakdown_with_percentage(
#             self.qs(), THIS_MONTH_START, FIXED_TODAY
#         )

#         self.assertEqual(result[0]["category"], "food")
#         self.assertEqual(result[0]["total"], Decimal("200.00"))
#         self.assertEqual(result[0]["percentage"], Decimal("66.67"))
#         self.assertEqual(result[1]["category"], "transport")
#         self.assertEqual(result[1]["percentage"], Decimal("33.33"))

#     def test_excludes_expenses_outside_requested_range(self):
#         make_expense(self.user, 999, "old", date(2026, 2, 10))
#         make_expense(self.user, 100, "food", date(2026, 3, 10))

#         result = get_category_breakdown_with_percentage(
#             self.qs(), THIS_MONTH_START, FIXED_TODAY
#         )

#         self.assertEqual(len(result), 1)
#         self.assertEqual(result[0]["category"], "food")


# class TestGetMonthComparison(ExpenseAnalyticsBaseTest):
#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_returns_none_percentage_when_last_month_is_zero(self, *_):
#         make_expense(self.user, 100, "food", date(2026, 3, 10))

#         result = get_month_comparison(self.qs())

#         self.assertEqual(result["this_month_spent"], Decimal("100.00"))
#         self.assertEqual(result["last_month_spent"], Decimal("0.00"))
#         self.assertEqual(result["amount_difference"], Decimal("100.00"))
#         self.assertIsNone(result["percentage_change"])

#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_returns_positive_percentage_when_spending_increases(self, *_):
#         make_expense(self.user, 100, "food", date(2026, 2, 15))
#         make_expense(self.user, 150, "food", date(2026, 3, 10))

#         result = get_month_comparison(self.qs())

#         self.assertEqual(result["amount_difference"], Decimal("50.00"))
#         self.assertEqual(result["percentage_change"], Decimal("50.00"))

#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_returns_negative_percentage_when_spending_decreases(self, *_):
#         make_expense(self.user, 200, "food", date(2026, 2, 10))
#         make_expense(self.user, 100, "food", date(2026, 3, 10))

#         result = get_month_comparison(self.qs())

#         self.assertEqual(result["amount_difference"], Decimal("-100.00"))
#         self.assertEqual(result["percentage_change"], Decimal("-50.00"))


# class TestGetHighestExpense(ExpenseAnalyticsBaseTest):
#     def test_returns_none_for_empty_range(self):
#         result = get_highest_expense(self.qs(), THIS_MONTH_START, FIXED_TODAY)
#         self.assertIsNone(result)

#     def test_returns_highest_expense_and_uses_latest_date_as_tiebreak(self):
#         make_expense(self.user, 100, "food", date(2026, 3, 1), note="older")
#         make_expense(self.user, 100, "rent", date(2026, 3, 15), note="latest")

#         result = get_highest_expense(self.qs(), THIS_MONTH_START, FIXED_TODAY)

#         self.assertEqual(result["amount"], Decimal("100.00"))
#         self.assertEqual(result["category"], "rent")
#         self.assertEqual(result["date"], date(2026, 3, 15))
#         self.assertEqual(result["note"], "latest")


# class TestGetMostFrequentCategory(ExpenseAnalyticsBaseTest):
#     def test_returns_none_for_empty_range(self):
#         result = get_most_frequent_category(self.qs(), THIS_MONTH_START, FIXED_TODAY)
#         self.assertIsNone(result)

#     def test_returns_most_frequent_category_with_alphabetical_tiebreak(self):
#         make_expense(self.user, 10, "rent", date(2026, 3, 1))
#         make_expense(self.user, 10, "food", date(2026, 3, 5))

#         result = get_most_frequent_category(self.qs(), THIS_MONTH_START, FIXED_TODAY)

#         self.assertEqual(result["category"], "food")
#         self.assertEqual(result["count"], 1)


# class TestGetSummaryMetrics(ExpenseAnalyticsBaseTest):
#     def test_returns_zeroed_metrics_for_empty_range(self):
#         result = get_summary_metrics(self.qs(), THIS_MONTH_START, FIXED_TODAY)

#         self.assertEqual(result["total_expenses_count"], 0)
#         self.assertEqual(result["total_spent"], Decimal("0.00"))
#         self.assertEqual(result["average_expense_amount"], Decimal("0.00"))

#     def test_returns_exact_count_total_and_average(self):
#         make_expense(self.user, 100, "food", date(2026, 3, 5))
#         make_expense(self.user, 200, "rent", date(2026, 3, 10))

#         result = get_summary_metrics(self.qs(), THIS_MONTH_START, FIXED_TODAY)

#         self.assertEqual(result["total_expenses_count"], 2)
#         self.assertEqual(result["total_spent"], Decimal("300.00"))
#         self.assertEqual(result["average_expense_amount"], Decimal("150.00"))


# class TestGetExpenseAnalytics(ExpenseAnalyticsBaseTest):
#     @classmethod
#     def setUpTestData(cls):
#         super().setUpTestData()
#         make_expense(cls.user, 100, "food", date(2026, 3, 10))
#         make_expense(cls.user, 50, "transport", date(2026, 3, 15))
#         make_expense(cls.user, 200, "rent", date(2026, 2, 5))

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_returns_expected_payload_and_exact_values(self, *_):
#         result = get_expense_analytics(self.user)

#         self.assertEqual(set(result.keys()), {
#             "monthly_trend",
#             "category_distribution_this_month",
#             "spending_behavior_this_month",
#             "month_comparison",
#         })

#         self.assertEqual(len(result["monthly_trend"]["history"]), 12)
#         self.assertEqual(
#             result["monthly_trend"]["average_monthly_spend"],
#             Decimal("175.00"),
#         )

#         behavior = result["spending_behavior_this_month"]
#         self.assertEqual(behavior["total_expenses_count"], 2)
#         self.assertEqual(behavior["average_expense_amount"], Decimal("75.00"))
#         self.assertEqual(behavior["total_spent"], Decimal("150.00"))
#         self.assertEqual(behavior["highest_expense"]["amount"], Decimal("100.00"))
#         self.assertEqual(behavior["highest_expense"]["category"], "food")
#         self.assertEqual(behavior["most_frequent_category"]["category"], "food")
#         self.assertEqual(behavior["most_frequent_category"]["count"], 1)

#         categories = result["category_distribution_this_month"]
#         self.assertEqual(categories[0]["category"], "food")
#         self.assertEqual(categories[0]["percentage"], Decimal("66.67"))
#         self.assertEqual(categories[1]["category"], "transport")
#         self.assertEqual(categories[1]["percentage"], Decimal("33.33"))

#         comparison = result["month_comparison"]
#         self.assertEqual(comparison["this_month_spent"], Decimal("150.00"))
#         self.assertEqual(comparison["last_month_spent"], Decimal("200.00"))
#         self.assertEqual(comparison["amount_difference"], Decimal("-50.00"))
#         self.assertEqual(comparison["percentage_change"], Decimal("-25.00"))

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_excludes_other_users_expenses_from_all_sections(self, *_):
#         make_expense(self.other_user, 99999, "other", date(2026, 3, 20))

#         result = get_expense_analytics(self.user)

#         self.assertEqual(
#             result["spending_behavior_this_month"]["total_spent"],
#             Decimal("150.00"),
#         )
#         self.assertNotIn(
#             "other",
#             [item["category"] for item in result["category_distribution_this_month"]],
#         )

#     @patch("expenses.services.expense_analytics.timezone.localdate", return_value=FIXED_TODAY)
#     @patch("expenses.services.expense_analytics.get_this_month_range", return_value=(THIS_MONTH_START, FIXED_TODAY))
#     @patch("expenses.services.expense_analytics.get_last_month_range", return_value=(LAST_MONTH_START, LAST_MONTH_END))
#     def test_handles_brand_new_user_with_no_expenses(self, *_):
#         empty_user = User.objects.create_user(
#             email="empty@example.com",
#             password="test12345",
#         )

#         result = get_expense_analytics(empty_user)

#         self.assertEqual(
#             result["spending_behavior_this_month"]["total_spent"],
#             Decimal("0.00"),
#         )
#         self.assertEqual(
#             result["spending_behavior_this_month"]["total_expenses_count"],
#             0,
#         )
#         self.assertIsNone(result["spending_behavior_this_month"]["highest_expense"])
#         self.assertIsNone(
#             result["spending_behavior_this_month"]["most_frequent_category"]
#         )
#         self.assertEqual(
#             result["monthly_trend"]["average_monthly_spend"],
#             Decimal("0.00"),
#         )
#         self.assertEqual(result["category_distribution_this_month"], [])
#         self.assertIsNone(result["month_comparison"]["percentage_change"])