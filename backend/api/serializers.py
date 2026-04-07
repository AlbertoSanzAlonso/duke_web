from rest_framework import serializers
from .models import (Product, MenuEntry, Sale, SaleItem, Expense, InventoryItem, 
                     SupplierOrder, SupplierOrderItem, GlobalSetting, GalleryImage,
                     OpeningHour, DeliverySetting, UserProfile)
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'avatar', 'can_use_tpv', 'can_use_accounting', 
            'can_use_menu', 'can_use_inventory', 'can_use_promos', 
            'can_use_gallery', 'can_use_settings', 'is_admin_manager'
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
        fields = ['id', 'total_amount', 'date', 'notes', 'items', 'status', 'customer_name', 'table_number', 'delivery_cost']

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
        fields = ['id', 'base_price', 'km_price', 'max_km']

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'
