from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from unittest.mock import patch

from habits.models import Habit, HabitLog
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
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


class HabitPermissionAPITests(APITestCase):
    def setUp(self):
        self.demo_user = User.objects.create_user(
            email="demo@trackwise.app",
            password="demo-password",
            is_demo=True,
        )
        self.other_user = User.objects.create_user(
            email="other-habit-test@example.com",
            password="other-password",
        )
        self.demo_habit = Habit.objects.create(
            user=self.demo_user,
            name="Sample reading",
            target_value=20,
            target_unit="MINUTES",
            start_date=date.today() - timedelta(days=7),
        )
        self.other_habit = Habit.objects.create(
            user=self.other_user,
            name="Private habit",
            target_value=1,
            target_unit="BOOL",
            start_date=date.today() - timedelta(days=7),
        )
        self.client.force_authenticate(user=self.demo_user)

    def test_demo_can_only_read_its_own_habits(self):
        response = self.client.get("/api/habits/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [self.demo_habit.id])

        response = self.client.get(f"/api/habits/{self.other_habit.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_legacy_shared_demo_cannot_create_habits_or_logs(self):
        habit_response = self.client.post(
            "/api/habits/",
            {
                "name": "New sample",
                "frequency": "DAILY",
                "target_value": 1,
                "target_unit": "BOOL",
                "start_date": date.today().isoformat(),
                "is_active": True,
            },
            format="json",
        )
        log_response = self.client.post(
            "/api/habits/logs/",
            {
                "habit": self.demo_habit.id,
                "date": date.today().isoformat(),
                "value": 1,
                "note": "",
            },
            format="json",
        )

        self.assertEqual(habit_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(log_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Habit.objects.filter(user=self.demo_user).count(), 1)
        self.assertFalse(HabitLog.objects.filter(habit=self.demo_habit).exists())

    def test_demo_workspace_habit_crud_and_logs_are_owner_scoped(self):
        demo_user = User.objects.create_user(
            email="demo-workspace+habit@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        other_demo = User.objects.create_user(
            email="demo-workspace+other-habit@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        client = APIClient()
        client.force_authenticate(user=demo_user)

        payload = {
            "name": "Demo reading",
            "frequency": "DAILY",
            "target_value": 20,
            "target_unit": "MINUTES",
            "start_date": date.today().isoformat(),
            "is_active": True,
        }
        created = client.post("/api/habits/", payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        habit_id = created.data["id"]

        log_response = client.post(
            "/api/habits/logs/",
            {
                "habit": habit_id,
                "date": date.today().isoformat(),
                "value": 20,
                "note": "",
            },
            format="json",
        )
        self.assertEqual(log_response.status_code, status.HTTP_201_CREATED)

        update = client.patch(
            f"/api/habits/{habit_id}/",
            {"name": "Updated demo reading"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)

        client.force_authenticate(user=other_demo)
        self.assertEqual(client.get("/api/habits/").data, [])
        self.assertEqual(
            client.get(f"/api/habits/{habit_id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            client.get(f"/api/habits/logs/{log_response.data['id']}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

        client.force_authenticate(user=demo_user)
        self.assertEqual(
            client.delete(f"/api/habits/{self.other_habit.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            client.delete(f"/api/habits/{habit_id}/").status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(Habit.objects.filter(pk=habit_id).exists())

    def test_demo_habit_target_validation(self):
        demo_user = User.objects.create_user(
            email="demo-workspace+invalid-habit@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        client = APIClient()
        client.force_authenticate(user=demo_user)
        response = client.post(
            "/api/habits/",
            {
                "name": "Invalid target",
                "frequency": "DAILY",
                "target_value": 0,
                "target_unit": "BOOL",
                "start_date": date.today().isoformat(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authenticated_user_can_create_habits_and_log_them(self):
        user = User.objects.create_user(
            email="owner-habit-test@example.com",
            password="owner-password",
        )
        client = APIClient()
        client.force_authenticate(user=user)

        habit_response = client.post(
            "/api/habits/",
            {
                "name": "My reading",
                "frequency": "DAILY",
                "target_value": 20,
                "target_unit": "MINUTES",
                "start_date": date.today().isoformat(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(habit_response.status_code, status.HTTP_201_CREATED)
        habit_id = habit_response.data["id"]

        log_response = client.post(
            "/api/habits/logs/",
            {
                "habit": habit_id,
                "date": date.today().isoformat(),
                "value": 20,
                "note": "",
            },
            format="json",
        )
        self.assertEqual(log_response.status_code, status.HTTP_201_CREATED)

    def test_user_cannot_log_another_users_habit(self):
        user = User.objects.create_user(
            email="cross-habit-test@example.com",
            password="owner-password",
        )
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            "/api/habits/logs/",
            {
                "habit": self.other_habit.id,
                "date": date.today().isoformat(),
                "value": 1,
                "note": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(HabitLog.objects.filter(habit=self.other_habit).exists())
