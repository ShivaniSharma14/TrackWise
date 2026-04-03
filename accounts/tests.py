from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

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
