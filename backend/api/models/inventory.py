from django.db import models
from django.utils import timezone

class InventoryItem(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, db_index=True)
    unit = models.CharField(max_length=50, default='unidades', help_text="Unidad base (ej: gramos, unidades)")
    
    pack_name = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre del contenedor (ej: 'cajas', 'packs')")
    units_per_pack = models.DecimalField(max_digits=10, decimal_places=2, default=1, help_text="Cuántas unidades base trae cada pack")
    
    has_weight = models.BooleanField(default=False, help_text="¿La unidad tiene un peso/volumen asignado?")
    weight_per_unit = models.DecimalField(max_digits=10, decimal_places=3, default=0, help_text="Peso/Volumen de 1 unidad base")
    weight_unit = models.CharField(max_length=10, default='g', choices=[('g','Gramos'), ('kg','Kilogramos'), ('ml','Mililitros'), ('l','Litros')])

    use_sub_units = models.BooleanField(default=False, help_text="¿La unidad tiene un desglose interno en unidades?")
    sub_unit_name = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: fetas, unidades")
    sub_units_per_unit = models.DecimalField(max_digits=10, decimal_places=3, default=1, help_text="Cuántas sub-unidades trae cada unidad base")

    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class InventoryMovement(models.Model):
    DIRECTION_CHOICES = [
        ('IN',  'Entrada'),
        ('OUT', 'Salida (Ajuste)'),
        ('ADJ', 'Ajuste Manual'),
    ]
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='movements',
    )
    direction = models.CharField(max_length=3, choices=DIRECTION_CHOICES, db_index=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    reason = models.CharField(max_length=255, help_text="Ej: 'Compra proveedor', 'Ajuste manual'")
    description = models.TextField(blank=True, null=True, help_text="Detalle adicional del movimiento.")
    date = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        sign = '+' if self.direction == 'IN' else '-'
        return f"[{self.date.strftime('%d/%m/%Y %H:%M')}] {sign}{self.quantity} {self.inventory_item.name} — {self.reason}"

class InventoryDailyConsumption(models.Model):
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='daily_consumptions'
    )
    date = models.DateField(default=timezone.now, db_index=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)

    class Meta:
        unique_together = ('inventory_item', 'date')
        ordering = ['-date', 'inventory_item__name']

    def __str__(self):
        return f"[{self.date}] {self.inventory_item.name}: {self.quantity} {self.inventory_item.unit}"

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
        
        diff = self.quantity - old_quantity
        InventoryItem.objects.filter(pk=self.item_id).update(
            quantity=models.F('quantity') + diff
        )

        if diff != 0:
            direction = 'IN' if diff > 0 else 'OUT'
            InventoryMovement.objects.create(
                inventory_item=self.item,
                direction=direction,
                quantity=abs(diff),
                reason=f'Compra proveedor #{self.order_id} — {self.order.supplier_name}',
                description=f'{abs(diff)} {self.item.unit} de {self.item.name}',
            )

    def __str__(self):
        return f"{self.quantity} x {self.item.name}"

def deduct_inventory_for_sale(sale):
    """
    Descuenta del inventario la materia prima consumida por cada producto de un pedido.
    """
    if sale.stock_deducted or sale.status != 'COMPLETED':
        return

    items = sale.items.select_related(
        'menu_entry__product'
    ).prefetch_related(
        'menu_entry__product__ingredients_list__inventory_item'
    ).all()

    today = timezone.localtime().date()

    for item in items:
        if not item.menu_entry or not item.menu_entry.product:
            continue
        product = item.menu_entry.product
        for ingredient in product.ingredients_list.all():
            inv_item = ingredient.inventory_item
            
            base_consumed_rate = float(ingredient.quantity_per_unit)
            
            if ingredient.measurement_unit != 'unidades' and inv_item.has_weight and inv_item.weight_per_unit > 0:
                consumed_weight = base_consumed_rate
                if ingredient.measurement_unit in ['kg', 'l']:
                    consumed_weight *= 1000.0
                item_weight = float(inv_item.weight_per_unit)
                if inv_item.weight_unit in ['kg', 'l']:
                    item_weight *= 1000.0
                base_consumed_rate = consumed_weight / item_weight
            
            if ingredient.measurement_unit == 'pack' and inv_item.pack_name and inv_item.units_per_pack > 0:
                base_consumed_rate = base_consumed_rate * float(inv_item.units_per_pack)
            
            if ingredient.measurement_unit == 'sub-unit' and inv_item.use_sub_units and inv_item.sub_units_per_unit > 0:
                base_consumed_rate = base_consumed_rate / float(inv_item.sub_units_per_unit)

            consumed = base_consumed_rate * item.quantity
            
            # Update stock
            InventoryItem.objects.filter(pk=inv_item.pk).update(
                quantity=models.F('quantity') - consumed
            )
            
            # Create movement to keep history and trigger signal for daily consumption
            InventoryMovement.objects.create(
                inventory_item=inv_item,
                direction='OUT',
                quantity=consumed,
                reason=f'Venta #{sale.id}',
                description=f'{item.quantity}x {product.name} ({consumed} {inv_item.unit}/ud.)',
            )

    # Note: Using update() to avoid recursion if Sale.save() calls this
    from .sales import Sale
    Sale.objects.filter(pk=sale.pk).update(stock_deducted=True)
