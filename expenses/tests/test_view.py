from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from expenses.models import Expense
from rest_framework.test import APIClient


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
