from django.db import models

class Sale(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('COMPLETED', 'Completado'),
        ('CANCELLED', 'Cancelado')
    ]
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED', db_index=True)
    is_prepared = models.BooleanField(default=False, db_index=True)
    prepared_at = models.DateTimeField(null=True, blank=True)
    is_delivered = models.BooleanField(default=False, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    table_number = models.CharField(max_length=255, blank=True, null=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    stock_deducted = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Indica si ya se descontó la materia prima del inventario al completar este pedido."
    )
    
    def __str__(self):
        return f"Sale {self.id} ({self.status}) - {self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    menu_entry = models.ForeignKey('api.MenuEntry', on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1, db_index=True)
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)

    def __str__(self):
        return f"{self.quantity} x {self.menu_entry.product.name if self.menu_entry else 'Unknown'}"
