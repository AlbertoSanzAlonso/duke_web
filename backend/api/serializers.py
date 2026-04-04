from rest_framework import serializers
from .models import Product, MenuEntry, Sale, SaleItem, Expense, InventoryItem, SupplierOrder, SupplierOrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class MenuEntrySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = MenuEntry
        fields = ['id', 'product', 'product_id', 'price', 'category', 'is_available']

class SaleItemSerializer(serializers.ModelSerializer):
    entry_name = serializers.ReadOnlyField(source='menu_entry.product.name')
    
    class Meta:
        model = SaleItem
        fields = ['id', 'menu_entry', 'entry_name', 'quantity', 'price_at_sale']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = ['id', 'total_amount', 'date', 'notes', 'items']

class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = ['id', 'total_amount', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        return sale

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

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
