import os
from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver
from django.db import models
from django.utils import timezone
from .models import Product, GalleryImage, UserProfile, InventoryMovement, InventoryDailyConsumption

@receiver(post_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)

@receiver(post_delete, sender=GalleryImage)
def delete_gallery_image(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)

@receiver(post_delete, sender=UserProfile)
def delete_profile_avatar(sender, instance, **kwargs):
    if instance.avatar:
        instance.avatar.delete(save=False)

@receiver(pre_save, sender=Product)
def delete_old_product_image(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_file = Product.objects.get(pk=instance.pk).image
    except Product.DoesNotExist:
        return False

    new_file = instance.image
    if not old_file == new_file:
        if old_file:
            old_file.delete(save=False)

@receiver(pre_save, sender=GalleryImage)
def delete_old_gallery_image(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_file = GalleryImage.objects.get(pk=instance.pk).image
    except GalleryImage.DoesNotExist:
        return False

    new_file = instance.image
    if not old_file == new_file:
        if old_file:
            old_file.delete(save=False)

@receiver(pre_save, sender=UserProfile)
def delete_old_profile_avatar(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        old_file = UserProfile.objects.get(pk=instance.pk).avatar
    except UserProfile.DoesNotExist:
        return False

    new_file = instance.avatar
    if not old_file == new_file:
        if old_file:
            old_file.delete(save=False)

@receiver(post_save, sender=InventoryMovement)
def update_daily_consumption(sender, instance, created, **kwargs):
    """
    Cualquier movimiento de salida ('OUT') se suma al consumo diario.
    Esto permite que los ajustes manuales y las ventas se reflejen en los acumulados.
    """
    if instance.direction == 'OUT':
        # Aseguramos que usamos la fecha local del sistema
        today = timezone.localtime(instance.date).date() if instance.date else timezone.now().date()
        
        consumption, _ = InventoryDailyConsumption.objects.get_or_create(
            inventory_item=instance.inventory_item,
            date=today,
            defaults={'quantity': 0}
        )
        
        # Usamos F() para evitar colisiones de concurrencia
        InventoryDailyConsumption.objects.filter(pk=consumption.pk).update(
            quantity=models.F('quantity') + instance.quantity
        )

@receiver(post_delete, sender=InventoryMovement)
def reverse_daily_consumption(sender, instance, **kwargs):
    """
    Si se borra un movimiento de salida, restamos del consumo diario.
    Si el consumo llega a 0, eliminamos el registro para que no aparezca en la lista.
    """
    if instance.direction == 'OUT':
        today = timezone.localtime(instance.date).date() if instance.date else timezone.now().date()
        try:
            consumption = InventoryDailyConsumption.objects.get(
                inventory_item=instance.inventory_item,
                date=today
            )
            InventoryDailyConsumption.objects.filter(pk=consumption.pk).update(
                quantity=models.F('quantity') - instance.quantity
            )
            
            # Limpieza si queda en cero o negativo
            consumption.refresh_from_db()
            if consumption.quantity <= 0:
                consumption.delete()
        except InventoryDailyConsumption.DoesNotExist:
            pass
