from rest_framework import serializers
from ..models import Sale, SaleItem, deduct_inventory_for_sale

class SaleItemSerializer(serializers.ModelSerializer):
    entry_name = serializers.ReadOnlyField(source='menu_entry.product.name')
    
    class Meta:
        model = SaleItem
        fields = ['id', 'menu_entry', 'entry_name', 'quantity', 'price_at_sale']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = ['id', 'total_amount', 'date', 'updated_at', 'notes', 'items', 'status',
                  'is_prepared', 'prepared_at', 'is_delivered', 'delivered_at',
                  'customer_name', 'table_number', 'delivery_cost', 'stock_deducted']

class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = ['id', 'total_amount', 'notes', 'items', 'status', 'customer_name', 'table_number', 'delivery_cost']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        if sale.status == 'COMPLETED':
            deduct_inventory_for_sale(sale)
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        prev_status = instance.status
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)

        if prev_status != 'COMPLETED' and instance.status == 'COMPLETED':
            deduct_inventory_for_sale(instance)
                
        return instance
