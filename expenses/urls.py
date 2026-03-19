from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet,ExpenseDashboardStatsView


router = DefaultRouter()
router.register(r'', ExpenseViewSet , basename='expense')
urlpatterns = [
    path('', include(router.urls)),
    path("stats/dashboard/", ExpenseDashboardStatsView.as_view(), name="expense-dashboard-stats")
]
