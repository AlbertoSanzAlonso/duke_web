import os
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.FileField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # We process image conversion synchronously for now to ensure data integrity
        # but the user requested asynchrony: we'll optimize concurrency in views.
        if self.image:
            name, extension = os.path.splitext(self.image.name)
            if extension.lower() != '.webp':
                try:
                    im = Image.open(self.image)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGBA")
                    else:
                        im = im.convert("RGB")
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=85)
                    output.seek(0)
                    
                    self.image = ContentFile(output.read(), name=f"{name}.webp")
                except Exception as e:
                    print(f"Async-friendly log: Error converting image {name}: {e}")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class MenuEntry(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='menu_entries')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default='General')
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.name} - {self.price}"

class Sale(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('COMPLETED', 'Completado'),
        ('CANCELLED', 'Cancelado')
    ]
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    table_number = models.CharField(max_length=10, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Sale {self.id} ({self.status}) - {self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    menu_entry = models.ForeignKey(MenuEntry, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.menu_entry.product.name if self.menu_entry else 'Unknown'}"

class Expense(models.Model):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class InventoryItem(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, default='unidades')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class SupplierOrder(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('DELIVERED', 'Entregado'),
        ('CANCELLED', 'Cancelado')
    ]
    supplier_name = models.CharField(max_length=200)
    date = models.DateTimeField(auto_now_add=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"Order {self.id} - {self.supplier_name}"

class SupplierOrderItem(models.Model):
    order = models.ForeignKey(SupplierOrder, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.item.name}"
