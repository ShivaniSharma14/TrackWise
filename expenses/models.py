from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

# Create your models here.
class Expense(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
        related_name="expenses"
     )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    date = models.DateField() 
    category = models.CharField(max_length=50)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["user","date"]),
            models.Index(fields=["user","category"])
        ]

    def __str__(self):
        return f"{self.user} - {self.category} - {self.amount} on {self.date}"