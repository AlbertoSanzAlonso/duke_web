import os
from django.db import models
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
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
                    
                    max_size = (1600, 1600)
                    im.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=85) 
                    output.seek(0)
                    
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

class ProductIngredient(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='ingredients_list'
    )
    inventory_item = models.ForeignKey(
        'api.InventoryItem',
        on_delete=models.CASCADE,
        related_name='used_in_products'
    )
    quantity_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        help_text="Cantidad del ítem de inventario consumida por cada unidad vendida del producto."
    )
    measurement_unit = models.CharField(
        max_length=20, 
        default='unidades',
        help_text="Unidad lógica de descuento (ej: 'unidades', 'g', 'kg', 'ml', 'l')"
    )

    class Meta:
        unique_together = ('product', 'inventory_item')
        ordering = ['inventory_item__name']

    def __str__(self):
        return f"{self.product.name} → {self.inventory_item.name} × {self.quantity_per_unit} {self.measurement_unit}"

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
                    
                    width, height = im.size
                    min_dim = min(width, height)
                    left = (width - min_dim) / 2
                    top = (height - min_dim) / 2
                    right = (width + min_dim) / 2
                    bottom = (height + min_dim) / 2
                    im = im.crop((left, top, right, bottom))
                    
                    max_size = (1200, 1200)
                    im.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=85) 
                    output.seek(0)
                    
                    safe_name = "".join([c if (c.isalnum() or c in ("_", "-")) else "_" for c in name])
                    self.image = ContentFile(output.read(), name=f"{safe_name}.webp")
                except Exception as e:
                    print(f"Error processing gallery image {name}: {e}")
        super().save(*args, **kwargs)
