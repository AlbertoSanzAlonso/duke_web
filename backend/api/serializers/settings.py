from rest_framework import serializers
from ..models import GlobalSetting, OpeningHour, DeliverySetting

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
