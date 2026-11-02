from rest_framework import serializers
from .models import Expense
from accounts.demo_workspace import MAX_DEMO_EXPENSES


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "amount",
            "date",
            "category",
            "merchant",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            request
            and request.user.is_demo
            and self.instance is None
            and Expense.objects.filter(user=request.user).count() >= MAX_DEMO_EXPENSES
        ):
            raise serializers.ValidationError(
                {"detail": f"Demo workspaces are limited to {MAX_DEMO_EXPENSES} expenses."}
            )
        return attrs
