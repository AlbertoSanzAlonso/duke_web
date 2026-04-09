import os
import uuid
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db import models
from pillow_heif import register_heif_opener

register_heif_opener()

class Product(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, null=True)
    ingredients = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, default='Burgers', db_index=True)
    image = models.FileField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image:
            name, extension = os.path.splitext(self.image.name)
            if extension.lower() != '.webp':
                try:
                    im = Image.open(self.image)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGBA")
                    else:
                        im = im.convert("RGB")
                    
                    # Resize large images
                    max_size = (1600, 1600)
                    im.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=85) 
                    output.seek(0)
                    
                    # Sanitize name
                    safe_name = "".join([c if (c.isalnum() or c in ("_", "-")) else "_" for c in name])
                    self.image = ContentFile(output.read(), name=f"{safe_name}.webp")
                except Exception as e:
                    print(f"Error processing product image {name}: {e}")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class MenuEntry(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='menu_entries')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True, db_index=True)
    
    # Scheduling
    active_monday = models.BooleanField(default=True)
    active_tuesday = models.BooleanField(default=True)
    active_wednesday = models.BooleanField(default=True)
    active_thursday = models.BooleanField(default=True)
    active_friday = models.BooleanField(default=True)
    active_saturday = models.BooleanField(default=True)
    active_sunday = models.BooleanField(default=True)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} - {self.price}"

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
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    table_number = models.CharField(max_length=255, blank=True, null=True)
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Sale {self.id} ({self.status}) - {self.total_amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    menu_entry = models.ForeignKey(MenuEntry, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1, db_index=True)
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)

    def __str__(self):
        return f"{self.quantity} x {self.menu_entry.product.name if self.menu_entry else 'Unknown'}"

class Expense(models.Model):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True, db_index=True)
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class InventoryItem(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, db_index=True)
    unit = models.CharField(max_length=50, default='unidades')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
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
    marquee_text = models.TextField(blank=True, null=True)
    
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
        if self.image:
            name, extension = os.path.splitext(self.image.name)
            if extension.lower() != '.webp':
                try:
                    im = Image.open(self.image)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGBA")
                    else:
                        im = im.convert("RGB")
                    
                    # CROP TO SQUARE (Center Crop)
                    width, height = im.size
                    min_dim = min(width, height)
                    left = (width - min_dim) / 2
                    top = (height - min_dim) / 2
                    right = (width + min_dim) / 2
                    bottom = (height + min_dim) / 2
                    im = im.crop((left, top, right, bottom))
                    
                    # Resize to a standard high-quality resolution
                    max_size = (1200, 1200)
                    im.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=85) 
                    output.seek(0)
                    
                    # Sanitize name
                    safe_name = "".join([c if (c.isalnum() or c in ("_", "-")) else "_" for c in name])
                    self.image = ContentFile(output.read(), name=f"{safe_name}.webp")
                except Exception as e:
                    print(f"Error processing gallery image {name}: {e}")
        super().save(*args, **kwargs)

from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.FileField(upload_to='avatars/', null=True, blank=True)
    
    # Permissions
    can_use_tpv = models.BooleanField(default=False)
    can_use_accounting = models.BooleanField(default=False)
    can_use_menu = models.BooleanField(default=False)
    can_use_inventory = models.BooleanField(default=False)
    can_use_promos = models.BooleanField(default=False)
    can_use_gallery = models.BooleanField(default=False)
    can_use_settings = models.BooleanField(default=False)
    can_use_kitchen = models.BooleanField(default=False)
    can_use_webmail = models.BooleanField(default=False)
    is_admin_manager = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.avatar:
            name, extension = os.path.splitext(self.avatar.name)
            if extension.lower() != '.webp':
                try:
                    im = Image.open(self.avatar)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGBA")
                    else:
                        im = im.convert("RGB")
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=80)
                    output.seek(0)
                    
                    safe_name = "".join([c if (c.isalnum() or c in ("_", "-")) else "_" for c in name])
                    self.avatar = ContentFile(output.read(), name=f"{safe_name}.webp")
                except Exception as e:
                    print(f"Error processing avatar {name}: {e}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil de {self.user.username}"

class ActionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='action_logs')
    module = models.CharField(max_length=50) # 'CONTABILIDAD', 'TPV', 'PRODUCTOS', etc
    action_type = models.CharField(max_length=50) # 'CREATE', 'UPDATE', 'DELETE'
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.username if self.user else "Sistema"
        return f"[{self.timestamp.strftime('%d/%m/%Y %H:%M')}] {user_str} - {self.module}: {self.action_type}"

def log_action(user, module, action_type, description):
    """
    Helper to log administrative actions.
    """
    try:
        from django.contrib.auth.models import User
        # Handle cases where user might be ID or None
        target_user = user
        if isinstance(user, (int, str)) and not isinstance(user, User):
            target_user = User.objects.get(id=user)
        
        ActionLog.objects.create(
            user=target_user if isinstance(target_user, User) else None,
            module=module,
            action_type=action_type,
            description=description
        )
    except Exception as e:
        print(f"Error logging action: {e}")
