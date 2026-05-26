from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from unittest.mock import patch

from habits.models import Habit, HabitLog
from habits.services import stats, streaks
from habits.services.dashboard import (
    build_logs_map,
    get_day_summary,
    get_dashboard_summary,
    empty_dashboard_response,
)

User = get_user_model()


TODAY = date(2025, 6, 15)


def make_user(email="test@example.com"):
    return User.objects.create_user(email="test@example.com", password="pass1234")


def make_habit(
    user, start_date=None, target_value=3, frequency="DAILY", is_active=True
):
    return Habit.objects.create(
        user=user,
        name="Read",
        frequency=frequency,
        target_value=target_value,
        target_unit="COUNT",
        start_date=start_date or TODAY,
        is_active=is_active,
    )


def make_log(habit, day, value):
    return HabitLog.objects.create(habit=habit, date=day, value=value)


# streaks.py


class TestHabitStreak(TestCase):
    def setUp(self):
        self.user = make_user()

    @patch("habits.services.streaks.timezone.localdate", return_value=TODAY)
    def test_inactive_habit_returns_zero(self, _):
        habit = make_habit(self.user, is_active=False)
        result = streaks.get_habit_streak_data(habit)
        self.assertEqual(result["current_streak"], 0)
        self.assertEqual(result["today_status"], "inactive")

    @patch("habits.services.streaks.timezone.localdate", return_value=TODAY)
    def test_consecutive_days_build_streak(self, _):
        habit = make_habit(
            self.user, start_date=TODAY - timedelta(days=4), target_value=3
        )
        make_log(habit, TODAY - timedelta(days=1), value=3)
        make_log(habit, TODAY - timedelta(days=2), value=3)
        make_log(habit, TODAY - timedelta(days=3), value=3)
        result = streaks.get_habit_streak_data(habit)
        self.assertEqual(result["current_streak"], 3)

    @patch("habits.services.streaks.timezone.localdate", return_value=TODAY)
    def test_gap_breaks_streak(self, _):
        habit = make_habit(
            self.user, start_date=TODAY - timedelta(days=4), target_value=3
        )
        make_log(habit, TODAY - timedelta(days=1), value=3)
        # day -2 intentionally missing
        make_log(habit, TODAY - timedelta(days=3), value=3)
        result = streaks.get_habit_streak_data(habit)
        self.assertEqual(result["current_streak"], 1)

    @patch("habits.services.streaks.timezone.localdate", return_value=TODAY)
    def test_today_completed_reflects_in_streak(self, _):
        habit = make_habit(
            self.user, start_date=TODAY - timedelta(days=2), target_value=3
        )
        make_log(habit, TODAY, value=3)
        make_log(habit, TODAY - timedelta(days=1), value=3)
        result = streaks.get_habit_streak_data(habit)
        self.assertEqual(result["current_streak"], 2)
        self.assertEqual(result["today_status"], "completed")


# stats.py


class TestHabitStats(TestCase):
    def setUp(self):
        self.user = make_user()

    def test_inactive_habit_total_completed_days_zero(self):
        habit = make_habit(self.user, is_active=False)
        self.assertEqual(
            stats.get_total_completed_days(habit)["total_completed_days"], 0
        )

    def test_only_logs_meeting_target_are_counted(self):
        habit = make_habit(
            self.user, start_date=TODAY - timedelta(days=4), target_value=5
        )
        make_log(habit, TODAY - timedelta(days=3), value=5)
        make_log(habit, TODAY - timedelta(days=2), value=3)
        make_log(habit, TODAY - timedelta(days=1), value=7)
        result = stats.get_total_completed_days(habit)
        self.assertEqual(result["total_completed_days"], 2)

    @patch("habits.services.stats.timezone.localdate", return_value=TODAY)
    def test_longest_streak_survives_gap(self, _):
        start = TODAY - timedelta(days=6)
        habit = make_habit(self.user, start_date=start, target_value=3)
        make_log(habit, start, value=3)
        make_log(habit, start + timedelta(days=1), value=3)

        make_log(habit, start + timedelta(days=3), value=3)
        result = stats.get_longest_streak(habit)
        self.assertEqual(result["longest_streak"], 2)

    @patch("habits.services.stats.timezone.localdate", return_value=TODAY)
    def test_last_7_days_always_has_7_entries(self, _):
        habit = make_habit(self.user, start_date=TODAY - timedelta(days=10))
        result = stats.get_last_7_days_status(habit)
        self.assertEqual(len(result["last_7_days_status"]), 7)

    @patch("habits.services.stats.timezone.localdate", return_value=TODAY)
    def test_completed_day_marked_true_in_7_days(self, _):
        habit = make_habit(
            self.user, start_date=TODAY - timedelta(days=5), target_value=3
        )
        make_log(habit, TODAY - timedelta(days=1), value=4)
        result = stats.get_last_7_days_status(habit)
        entry = next(
            e
            for e in result["last_7_days_status"]
            if e["date"] == str(TODAY - timedelta(days=1))
        )
        self.assertTrue(entry["completed"])


# ===========================================================================
# dashboard.py
# ===========================================================================


class TestDashboard(TestCase):
    def setUp(self):
        self.user = make_user()

    @patch("habits.services.dashboard.timezone.localdate", return_value=TODAY)
    def test_no_habits_returns_empty_response(self, _):
        result = get_dashboard_summary(self.user)
        self.assertEqual(result, empty_dashboard_response())

    @patch("habits.services.dashboard.timezone.localdate", return_value=TODAY)
    def test_dashboard_has_all_required_keys(self, _):
        make_habit(self.user, start_date=TODAY, target_value=1)
        result = get_dashboard_summary(self.user)
        for key in ["today", "consistency", "performance", "trend"]:
            self.assertIn(key, result)

    @patch("habits.services.dashboard.timezone.localdate", return_value=TODAY)
    def test_all_completed_today_is_perfect_day(self, _):
        habit = make_habit(self.user, start_date=TODAY, target_value=3)
        make_log(habit, TODAY, value=3)
        logs_map = build_logs_map([habit])
        summary = get_day_summary([habit], TODAY, logs_map)
        self.assertTrue(summary["is_perfect_day"])
        self.assertEqual(summary["completion_rate"], 100.0)

    @patch("habits.services.dashboard.timezone.localdate", return_value=TODAY)
    def test_trend_always_has_7_days(self, _):
        make_habit(self.user, start_date=TODAY - timedelta(days=10), target_value=1)
        result = get_dashboard_summary(self.user)
        self.assertEqual(len(result["trend"]["last_7_days"]), 7)

    @patch("habits.services.dashboard.timezone.localdate", return_value=TODAY)
    def test_inactive_habit_excluded_from_dashboard(self, _):
        make_habit(self.user, start_date=TODAY, is_active=False)
        result = get_dashboard_summary(self.user)
        self.assertEqual(result, empty_dashboard_response())
