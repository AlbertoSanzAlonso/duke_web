from rest_framework import serializers
from ..models import Product, MenuEntry, ProductIngredient, GalleryImage

class ProductIngredientSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.ReadOnlyField(source='inventory_item.name')
    inventory_item_unit = serializers.ReadOnlyField(source='inventory_item.unit')

    class Meta:
        model = ProductIngredient
        fields = ['id', 'product', 'inventory_item', 'inventory_item_name', 'inventory_item_unit', 'quantity_per_unit', 'measurement_unit']

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
    category = serializers.CharField(source='product.category', read_only=True)

    class Meta:
        model = MenuEntry
        fields = [
            'id', 'product', 'product_id', 'price', 'category', 'is_available',
            'active_monday', 'active_tuesday', 'active_wednesday', 'active_thursday',
            'active_friday', 'active_saturday', 'active_sunday',
            'start_date', 'end_date'
        ]

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'
