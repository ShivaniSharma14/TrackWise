from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from expenses.models import Expense
from rest_framework.test import APIClient
from django.utils import timezone
from unittest.mock import patch


User = get_user_model()


class ExpenseViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="pass@123"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_expense_success(self):

        data = {
            "amount": 1200,
            "date": "2026-03-20",
            "category": "food",
            "note": "first love obv",
        }
        response = self.client.post("/api/expenses/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 1)

    def test_list_expenses_success(self):
        response = self.client.get("/api/expenses/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_expense_success(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        response = self.client.get(f"/api/expenses/{expense.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_expense_not_found(self):
        response = self.client.get("/api/expenses/999/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_expense_success(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        data = {
            "amount": 1200,
            "date": "2026-03-20",
            "category": "shopping",
            "note": "shopping for my life",
        }
        response = self.client.put(
            f"/api/expenses/{expense.id}/", data=data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_expense_success(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        response = self.client.delete(f"/api/expenses/{expense.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_cannot_access(self):
        client = APIClient()
        response = client.get("/api/expenses/", format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_edit_others_expense(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        other_user = User.objects.create_user(
            email="other@example.com", password="pass@123"
        )

        client = APIClient()
        client.force_authenticate(user=other_user)
        response = client.put(f"/api/expenses/{expense.id}/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_delete_others_expense(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        other_user = User.objects.create_user(
            email="other@example.com", password="pass@123"
        )

        client = APIClient()
        client.force_authenticate(user=other_user)
        response = client.delete(f"/api/expenses/{expense.id}/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_view_others_expense(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        other_user = User.objects.create_user(
            email="other@example.com", password="pass@123"
        )

        client = APIClient()
        client.force_authenticate(user=other_user)
        response = client.get(f"/api/expenses/{expense.id}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_expense_invalid_amount(self):
        data = {"amount": -500, "date": "2026-03-20", "category": "food"}
        response = self.client.post("/api/expenses/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_missing_fields(self):
        response = self.client.post("/api/expenses/", data={}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_returns_correct_data(self):
        expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        response = self.client.get(f"/api/expenses/{expense.id}/", format="json")
        self.assertEqual(response.data["category"], "food")
        self.assertEqual(response.data["amount"], "1200.00")

    def test_user_only_sees_own_expenses(self):
        Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="first love obv",
            user=self.user,
        )
        other_user = User.objects.create_user(
            email="other@example.com", password="pass@123"
        )
        Expense.objects.create(
            amount=500,
            date="2026-03-21",
            category="shopping",
            note="other user expense",
            user=other_user,
        )
        response = self.client.get("/api/expenses/", format="json")
        self.assertEqual(len(response.data), 1)

    def test_demo_can_only_read_its_own_expenses(self):
        demo_user = User.objects.create_user(
            email="demo@trackwise.app",
            password="demo-password",
            is_demo=True,
        )
        other_user = User.objects.create_user(
            email="other-demo-test@example.com",
            password="other-password",
        )
        demo_expense = Expense.objects.create(
            amount=1200,
            date="2026-03-20",
            category="food",
            note="sample",
            user=demo_user,
        )
        Expense.objects.create(
            amount=500,
            date="2026-03-21",
            category="shopping",
            note="private",
            user=other_user,
        )

        client = APIClient()
        client.force_authenticate(user=demo_user)

        response = client.get("/api/expenses/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [demo_expense.id])

    def test_legacy_shared_demo_cannot_create_expenses(self):
        demo_user = User.objects.create_user(
            email="demo@trackwise.app",
            password="demo-password",
            is_demo=True,
        )
        client = APIClient()
        client.force_authenticate(user=demo_user)

        response = client.post(
            "/api/expenses/",
            {
                "amount": 100,
                "date": "2026-03-20",
                "category": "food",
                "note": "should be rejected",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Expense.objects.count(), 0)

    def test_demo_workspace_crud_is_scoped_to_its_owner(self):
        demo_user = User.objects.create_user(
            email="demo-workspace+expense@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        other_demo = User.objects.create_user(
            email="demo-workspace+other-expense@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        private_user = User.objects.create_user(
            email="private-expense@example.com",
            password=None,
        )
        private_expense = Expense.objects.create(
            user=private_user,
            amount="73.00",
            date=timezone.localdate(),
            category="Other",
        )

        client = APIClient()
        client.force_authenticate(user=demo_user)
        payload = {
            "amount": "12.50",
            "date": timezone.localdate().isoformat(),
            "category": "Food",
            "merchant": "Workspace cafe",
        }
        created = client.post("/api/expenses/", payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        expense_id = created.data["id"]

        client.force_authenticate(user=other_demo)
        self.assertEqual(client.get("/api/expenses/").data, [])
        self.assertEqual(
            client.get(f"/api/expenses/{expense_id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            client.get(f"/api/expenses/{private_expense.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

        client.force_authenticate(user=demo_user)
        update = client.patch(
            f"/api/expenses/{expense_id}/",
            {"amount": "15.00"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["amount"], "15.00")
        self.assertEqual(
            client.delete(f"/api/expenses/{private_expense.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertTrue(Expense.objects.filter(pk=private_expense.pk).exists())
        self.assertEqual(
            client.delete(f"/api/expenses/{expense_id}/").status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(Expense.objects.filter(pk=expense_id).exists())
        client.force_authenticate(user=private_user)
        self.assertEqual(
            client.get(f"/api/expenses/{expense_id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            client.delete(f"/api/expenses/{expense_id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_demo_expense_validation_and_workspace_limit(self):
        demo_user = User.objects.create_user(
            email="demo-workspace+limit-expense@trackwise.invalid",
            password=None,
            is_demo=True,
        )
        client = APIClient()
        client.force_authenticate(user=demo_user)

        invalid = client.post(
            "/api/expenses/",
            {"amount": "-1", "date": timezone.localdate().isoformat(), "category": "Food"},
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        with patch("expenses.serializers.MAX_DEMO_EXPENSES", 0):
            limited = client.post(
                "/api/expenses/",
                {
                    "amount": "1.00",
                    "date": timezone.localdate().isoformat(),
                    "category": "Food",
                },
                format="json",
            )
        self.assertEqual(limited.status_code, status.HTTP_400_BAD_REQUEST)
