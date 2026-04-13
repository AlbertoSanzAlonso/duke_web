from rest_framework import serializers
from ..models import (InventoryItem, InventoryMovement, InventoryDailyConsumption, 
                       SupplierOrder, SupplierOrderItem)

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class InventoryMovementSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_unit = serializers.CharField(source='inventory_item.unit', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = ['id', 'inventory_item', 'inventory_item_name', 'inventory_item_unit', 'direction', 'quantity', 'reason', 'description', 'date']

class InventoryDailyConsumptionSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_unit = serializers.CharField(source='inventory_item.unit', read_only=True)
    inventory_item_category = serializers.CharField(source='inventory_item.category', read_only=True)

    class Meta:
        model = InventoryDailyConsumption
        fields = ['id', 'inventory_item', 'inventory_item_name', 'inventory_item_unit', 'inventory_item_category', 'date', 'quantity']

class SupplierOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.name')

    class Meta:
        model = SupplierOrderItem
        fields = ['id', 'item', 'item_name', 'quantity', 'cost']

class SupplierOrderSerializer(serializers.ModelSerializer):
    items = SupplierOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SupplierOrder
        fields = ['id', 'supplier_name', 'date', 'total_cost', 'status', 'items']

class SupplierOrderCreateSerializer(serializers.ModelSerializer):
    items = SupplierOrderItemSerializer(many=True)

    class Meta:
        model = SupplierOrder
        fields = ['id', 'supplier_name', 'total_cost', 'status', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = SupplierOrder.objects.create(**validated_data)
        for item_data in items_data:
            SupplierOrderItem.objects.create(order=order, **item_data)
        return order
