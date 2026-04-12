from rest_framework import serializers
from .models import (Product, MenuEntry, Sale, SaleItem, Expense, InventoryItem, 
                     SupplierOrder, SupplierOrderItem, GlobalSetting, GalleryImage,
                     OpeningHour, DeliverySetting, UserProfile, ActionLog, ProductIngredient,
                     InventoryMovement, deduct_inventory_for_sale)
from django.contrib.auth.models import User

class ActionLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = ActionLog
        fields = ['id', 'user', 'username', 'module', 'action_type', 'description', 'timestamp']

    def get_username(self, obj):
        return obj.user.username if obj.user else "Sistema"

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'avatar', 'can_use_tpv', 'can_use_accounting', 
            'can_use_menu', 'can_use_inventory', 'can_use_promos', 
            'can_use_gallery', 'can_use_settings', 'can_use_kitchen',
            'can_use_webmail', 'is_admin_manager'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'password', 'is_staff', 'is_active', 'date_joined', 'is_superuser']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        # Create profile with permissions
        UserProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        
        # Sync profile
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        if password:
            instance.set_password(password)
            
        return super().update(instance, validated_data)

class ProductIngredientSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.ReadOnlyField(source='inventory_item.name')
    inventory_item_unit = serializers.ReadOnlyField(source='inventory_item.unit')

    class Meta:
        model = ProductIngredient
        fields = ['id', 'product', 'inventory_item', 'inventory_item_name', 'inventory_item_unit', 'quantity_per_unit']


class ProductSerializer(serializers.ModelSerializer):
    ingredients_list = ProductIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'ingredients', 'category', 'image', 'created_at', 'ingredients_list']

class MenuEntrySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    # The user wants both to point to the same field. 
    # category is now read from product.
    category = serializers.CharField(source='product.category', read_only=True)

    class Meta:
        model = MenuEntry
        fields = [
            'id', 'product', 'product_id', 'price', 'category', 'is_available',
            'active_monday', 'active_tuesday', 'active_wednesday', 'active_thursday',
            'active_friday', 'active_saturday', 'active_sunday',
            'start_date', 'end_date'
        ]

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
        # If the sale is created directly as COMPLETED (e.g. TPV cash sale), deduct stock immediately
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
            # Recreate items from scratch to reflect accurate quantities / removals
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)

        # Deduct stock if transitioning to COMPLETED for the first time
        if prev_status != 'COMPLETED' and instance.status == 'COMPLETED':
            deduct_inventory_for_sale(instance)
                
        return instance

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

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
class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'

class OpeningHourSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_display', read_only=True)
    class Meta:
        model = OpeningHour
        fields = ['id', 'day', 'day_name', 'opening_time', 'closing_time', 'is_open']

class DeliverySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySetting
        fields = ['id', 'base_price', 'km_price', 'max_km', 'marquee_text']

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'
