from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.demo_workspace import (
    DEMO_EMAIL_PREFIX,
    DEMO_TTL,
    cleanup_expired_demo_workspaces,
)
from expenses.models import Expense
from habits.models import Habit, HabitLog

User = get_user_model()


class AccountsAPITests(APITestCase):
    def test_register_success(self):
        data = {
            "email": "test@example.com",
            "password": "test98765",
            "first_name": "dummy",
            "last_name": "user",
        }

        response = self.client.post("/api/accounts/register/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().email, "test@example.com")

    def test_register_duplicate_email_fail(self):
        User.objects.create_user(email="test@example.com", password="test98765")
        data = {
            "email": "test@example.com",
            "password": "duplicaate123",
            "first_name": "dummy",
            "last_name": "user",
        }
        response = self.client.post("/api/accounts/register/", data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_login_success(self):
        User.objects.create_user(email="test@example.com", password="test98765")
        data = {"email": "test@example.com", "password": "test98765"}
        response = self.client.post("/api/accounts/login/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invlaid_password_fails(self):
        User.objects.create_user(email="test@example.com", password="test98765")
        data = {"email": "test@example.com", "password": "test12345"}
        response = self.client.post("/api/accounts/login/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_success(self):
        User.objects.create_user(email="test@example.com", password="test98765")
        login_response = self.client.post(
            "/api/accounts/login/",
            {"email": "test@example.com", "password": "test98765"},
            format="json",
        )
        access = login_response.data["access"]
        refresh = login_response.data["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            "/api/accounts/logout/", {"refresh": refresh}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_without_refresh_fails(self):
        User.objects.create_user(
            email="shivani@example.com", password="strongpassword123"
        )

        login_response = self.client.post(
            "/api/accounts/login/",
            {"email": "shivani@example.com", "password": "strongpassword123"},
            format="json",
        )

        access = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post("/api/accounts/logout/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_without_auth(self):
        response = self.client.post(
            "/api/accounts/logout/", {"refresh": "sometoken"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_blacklisted_token_connot_refreshed(self):
        User.objects.create_user(
            email="shivani@example.com", password="strongpassword123"
        )
        login_response = self.client.post(
            "/api/accounts/login/",
            {"email": "shivani@example.com", "password": "strongpassword123"},
            format="json",
        )
        access = login_response.data["access"]
        refresh = login_response.data["refresh"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.client.post("/api/accounts/logout/", {"refresh": refresh}, format="json")
        response = self.client.post(
            "/api/accounts/refresh/", {"refresh": refresh}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_fails(self):
        login_response = self.client.post(
            "/api/accounts/login/",
            {"email": "shivani@example.com", "password": "strongpassword123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_access_token_rejected(self):
        User.objects.create_user(
            email="shivani@example.com", password="strongpassword123"
        )
        self.client.post(
            "/api/accounts/login/",
            {"email": "shivani@example.com", "password": "strongpassword123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION="Bearer ")
        response = self.client.get("/api/habits/", format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_auth_header_rejected(self):
        User.objects.create_user(
            email="shivani@example.com", password="strongpassword123"
        )
        self.client.post(
            "/api/accounts/login/",
            {"email": "shivani@example.com", "password": "strongpassword123"},
            format="json",
        )

        response = self.client.get("/api/habits/", format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_does_not_return_passowrd(self):

        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "test@example.com",
                "password": "test98765",
                "first_name": "dummy",
                "last_name": "user",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)

    def test_profile_reports_demo_status_without_allowing_role_changes(self):
        user = User.objects.create_user(
            email="profile@example.com",
            password="test98765",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/accounts/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_demo"])

        response = self.client.patch(
            "/api/accounts/profile/",
            {"is_demo": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertFalse(user.is_demo)

    def legacy_demo_login_and_profile_identify_read_only_account(self):
        User.objects.create_user(
            email="other-marked-demo@example.com",
            password="unused-password",
            is_demo=True,
        )
        demo_user = User.objects.create_user(
            email="demo@trackwise.app",
            password="unused-password",
            is_demo=True,
        )

        login_response = self.client.post("/api/accounts/demo/", {}, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

        response = self.client.get("/api/accounts/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], demo_user.id)
        self.assertTrue(response.data["is_demo"])

    def legacy_demo_login_is_unavailable_without_the_designated_demo_user(self):
        User.objects.create_user(
            email="other-marked-demo@example.com",
            password="unused-password",
            is_demo=True,
        )

        response = self.client.post("/api/accounts/demo/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_demo_login_creates_an_isolated_interactive_workspace_and_reset(self):
        login_response = self.client.post("/api/accounts/demo/", {}, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_201_CREATED)
        demo_user = User.objects.get(email__startswith=DEMO_EMAIL_PREFIX)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

        profile = self.client.get("/api/accounts/profile/")
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["id"], demo_user.id)
        self.assertTrue(profile.data["is_demo"])
        self.assertIsNotNone(profile.data["demo_expires_at"])
        baseline_habits = list(
            Habit.objects.filter(user=demo_user)
            .order_by("name")
            .values_list("name", "target_value", "target_unit", "start_date")
        )
        baseline_logs = list(
            HabitLog.objects.filter(habit__user=demo_user)
            .order_by("habit__name", "date")
            .values_list("habit__name", "date", "value", "note")
        )
        baseline_expenses = sorted(
            Expense.objects.filter(user=demo_user).values_list(
                "amount", "date", "category", "merchant", "note"
            )
        )

        habit_response = self.client.post(
            "/api/habits/",
            {
                "name": "Temporary demo habit",
                "frequency": "DAILY",
                "target_value": 1,
                "target_unit": "BOOL",
                "start_date": timezone.localdate().isoformat(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(habit_response.status_code, status.HTTP_201_CREATED)

        expense_response = self.client.post(
            "/api/expenses/",
            {
                "amount": "42.50",
                "date": timezone.localdate().isoformat(),
                "category": "Food",
                "merchant": "Demo cafe",
            },
            format="json",
        )
        self.assertEqual(expense_response.status_code, status.HTTP_201_CREATED)

        real_user = User.objects.create_user(
            email="reset-protection@example.com",
            password=None,
        )
        protected_habit = Habit.objects.create(
            user=real_user,
            name="Keep this real habit",
            target_value=1,
            target_unit="BOOL",
            start_date=timezone.localdate(),
        )
        protected_expense = Expense.objects.create(
            user=real_user,
            amount="9.99",
            date=timezone.localdate(),
            category="Other",
        )

        reset_response = self.client.post("/api/accounts/demo/reset/", {}, format="json")
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        demo_user.refresh_from_db()
        self.assertEqual(demo_user.habits.count(), 6)
        self.assertFalse(demo_user.expenses.filter(merchant="Demo cafe").exists())
        self.assertEqual(
            list(
                Habit.objects.filter(user=demo_user)
                .order_by("name")
                .values_list("name", "target_value", "target_unit", "start_date")
            ),
            baseline_habits,
        )
        self.assertEqual(
            list(
                HabitLog.objects.filter(habit__user=demo_user)
                .order_by("habit__name", "date")
                .values_list("habit__name", "date", "value", "note")
            ),
            baseline_logs,
        )
        self.assertEqual(
            sorted(
                demo_user.expenses.values_list(
                    "amount", "date", "category", "merchant", "note"
                )
            ),
            baseline_expenses,
        )
        self.assertTrue(Habit.objects.filter(pk=protected_habit.pk).exists())
        self.assertTrue(Expense.objects.filter(pk=protected_expense.pk).exists())

    def test_expired_demo_access_and_refresh_tokens_are_rejected(self):
        user = User.objects.create_user(
            email=f"{DEMO_EMAIL_PREFIX}expired@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        User.objects.filter(pk=user.pk).update(
            date_joined=timezone.now() - DEMO_TTL - timedelta(seconds=1)
        )
        refresh = RefreshToken.for_user(user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}"
        )
        response = self.client.get("/api/accounts/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            "/api/accounts/refresh/",
            {"refresh": str(refresh)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_two_demo_visitors_and_reset_remain_isolated(self):
        first = self.client.post("/api/accounts/demo/", {}, format="json")
        second = self.client.post("/api/accounts/demo/", {}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        first_client = self.client_class()
        second_client = self.client_class()
        first_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {first.data['access']}"
        )
        second_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {second.data['access']}"
        )
        first_profile = first_client.get("/api/accounts/profile/")
        second_profile = second_client.get("/api/accounts/profile/")
        self.assertNotEqual(first_profile.data["id"], second_profile.data["id"])

        created = first_client.post(
            "/api/habits/",
            {
                "name": "First visitor only",
                "frequency": "DAILY",
                "target_value": 1,
                "target_unit": "BOOL",
                "start_date": timezone.localdate().isoformat(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        second_habit_ids = {item["id"] for item in second_client.get("/api/habits/").data}
        self.assertNotIn(created.data["id"], second_habit_ids)

        reset = second_client.post("/api/accounts/demo/reset/", {}, format="json")
        self.assertEqual(reset.status_code, status.HTTP_200_OK)
        first_user = User.objects.get(pk=first_profile.data["id"])
        self.assertTrue(first_user.habits.filter(pk=created.data["id"]).exists())

    def test_reset_requires_demo_identity_and_cleanup_only_removes_expired_workspaces(self):
        normal_user = User.objects.create_user(
            email="not-a-demo@example.com",
            password=None,
        )
        self.client.force_authenticate(user=normal_user)
        denied = self.client.post("/api/accounts/demo/reset/", {}, format="json")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        expired = User.objects.create_user(
            email=f"{DEMO_EMAIL_PREFIX}cleanup@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        User.objects.filter(pk=expired.pk).update(
            date_joined=timezone.now() - DEMO_TTL - timedelta(seconds=1)
        )
        active = User.objects.create_user(
            email=f"{DEMO_EMAIL_PREFIX}active@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        legacy = User.objects.create_user(
            email="demo@trackwise.app",
            password=None,
            is_demo=True,
        )

        self.assertEqual(cleanup_expired_demo_workspaces(), 1)
        self.assertFalse(User.objects.filter(pk=expired.pk).exists())
        self.assertTrue(User.objects.filter(pk=active.pk).exists())
        self.assertTrue(User.objects.filter(pk=legacy.pk).exists())
        self.assertTrue(User.objects.filter(pk=normal_user.pk).exists())
