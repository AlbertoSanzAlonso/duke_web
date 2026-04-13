from rest_framework import viewsets, permissions
from django.utils import timezone
from datetime import timedelta

from ..models import (InventoryItem, InventoryMovement, InventoryDailyConsumption, 
                       SupplierOrder, log_action)
from ..serializers import (InventoryItemSerializer, InventoryMovementSerializer, 
                           InventoryDailyConsumptionSerializer, SupplierOrderSerializer, 
                           SupplierOrderCreateSerializer)
from ..permissions import HasInventoryPermission

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('-id')
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]

    def perform_create(self, serializer):
        item = serializer.save()
        log_action(self.request.user, 'INVENTARIO', 'CREATE', f'Nuevo item de inventario: {item.name}')

    def perform_update(self, serializer):
        instance = self.get_object()
        old_quantity = instance.quantity
        item = serializer.save()
        new_quantity = item.quantity
        
        if old_quantity != new_quantity:
            diff = new_quantity - old_quantity
            InventoryMovement.objects.create(
                inventory_item=item,
                direction='IN' if diff > 0 else 'OUT',
                quantity=abs(diff),
                reason='Ajuste Manual',
                description=f'Cambio manual ({old_quantity} -> {new_quantity})'
            )
        log_action(self.request.user, 'INVENTARIO', 'UPDATE', f'Editado item inventario: {item.name}')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'INVENTARIO', 'DELETE', f'Eliminado item inventario: {instance.name}')
        instance.delete()

class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryMovement.objects.select_related('inventory_item').all().order_by('-date')
    serializer_class = InventoryMovementSerializer
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        days = self.request.query_params.get('days')
        if days:
            try:
                cutoff = timezone.now() - timedelta(days=int(days))
                queryset = queryset.filter(date__gte=cutoff)
            except ValueError: pass
        return queryset[:500]

class InventoryDailyConsumptionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryDailyConsumption.objects.select_related('inventory_item').all().order_by('-date')
    serializer_class = InventoryDailyConsumptionSerializer
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        days = self.request.query_params.get('days')
        if days:
            try:
                cutoff = timezone.now().date() - timedelta(days=int(days))
                queryset = queryset.filter(date__gte=cutoff)
            except ValueError: pass
        return queryset

class SupplierOrderViewSet(viewsets.ModelViewSet):
    queryset = SupplierOrder.objects.prefetch_related('items', 'items__item').all().order_by('-date')
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierOrderCreateSerializer
        return SupplierOrderSerializer
