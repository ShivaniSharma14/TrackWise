from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from habits.services.dashboard import get_dashboard_summary
from expenses.services.expense_stats import get_expense_dashboard_stats


def get_combined_dashboard_data(user):
    habit_stats = get_dashboard_summary(user)
    expense_stats = get_expense_dashboard_stats(user)

    return {
        "habit_stats": habit_stats,
        "expense_stats": expense_stats,
    }


class CombinedDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_combined_dashboard_data(request.user)
        return Response(data)
