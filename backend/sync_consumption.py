from api.models import InventoryDailyConsumption, InventoryMovement
from django.db.models import F
from django.utils import timezone

# Clean existing consumption to avoid double counting
InventoryDailyConsumption.objects.all().delete()

# Get all OUT movements
movements = InventoryMovement.objects.filter(direction='OUT')

print(f"Syncing {movements.count()} movements...")

for mov in movements:
    date = mov.date.date()
    consumption, _ = InventoryDailyConsumption.objects.get_or_create(
        inventory_item=mov.inventory_item,
        date=date,
        defaults={'quantity': 0}
    )
    InventoryDailyConsumption.objects.filter(pk=consumption.pk).update(
        quantity=F('quantity') + mov.quantity
    )

# Final cleanup for zeros
InventoryDailyConsumption.objects.filter(quantity__lte=0).delete()
print("Sync complete.")
