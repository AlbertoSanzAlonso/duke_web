import os
import uuid
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db import models
from pillow_heif import register_heif_opener

register_heif_opener()

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.FileField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Processing disabled for debug
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
    table_number = models.CharField(max_length=255, blank=True, null=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_quantity = 0
        if not is_new:
            old_obj = SupplierOrderItem.objects.get(pk=self.pk)
            old_quantity = old_obj.quantity
        
        super().save(*args, **kwargs)
        
        # Update Inventory stock
        diff = self.quantity - old_quantity
        self.item.quantity = models.F('quantity') + diff
        self.item.save()

    def __str__(self):
        return f"{self.quantity} x {self.item.name}"

class GlobalSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class OpeningHour(models.Model):
    DAY_CHOICES = [
        (1, 'Lunes'),
        (2, 'Martes'),
        (3, 'Miércoles'),
        (4, 'Jueves'),
        (5, 'Viernes'),
        (6, 'Sábado'),
        (7, 'Domingo'),
    ]
    day = models.IntegerField(choices=DAY_CHOICES, unique=True)
    opening_time = models.TimeField(default="20:00")
    closing_time = models.TimeField(default="00:00")
    is_open = models.BooleanField(default=True)

    class Meta:
        ordering = ['day']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day, "Unknown")
        status = "Abierto" if self.is_open else "Cerrado"
        return f"{day_name}: {self.opening_time} - {self.closing_time} ({status})"

class DeliverySetting(models.Model):
    # Singleton-like table for delivery configuration
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    km_price = models.DecimalField(max_digits=10, decimal_places=2, default=200)
    max_km = models.DecimalField(max_digits=10, decimal_places=2, default=15)
    
    def __str__(self):
        return f"Configuración de Delivery (Base: ${self.base_price})"

class GalleryImage(models.Model):
    title = models.CharField(max_length=100, blank=True, null=True)
    image = models.FileField(upload_to='gallery/')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def save(self, *args, **kwargs):
        # Processing disabled for debug
        super().save(*args, **kwargs)

from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.FileField(upload_to='avatars/', null=True, blank=True)

    def save(self, *args, **kwargs):
        # Processing disabled for debug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil de {self.user.username}"
