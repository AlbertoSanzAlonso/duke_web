from django.db import models

class Expense(models.Model):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True, db_index=True)
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"
