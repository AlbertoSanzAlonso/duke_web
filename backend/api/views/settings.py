from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from ..models import GlobalSetting, OpeningHour, DeliverySetting
from ..serializers import (GlobalSettingSerializer, OpeningHourSerializer, 
                           DeliverySettingSerializer)
from ..permissions import IsAdminManager

class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all().order_by('key')
    serializer_class = GlobalSettingSerializer
    lookup_field = 'key'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminManager()]

    @action(detail=False, methods=['post'], url_path='setup-defaults')
    def setup_defaults(self, request):
        defaults = [
            {'key': 'delivery_base_price', 'value': '1000', 'description': 'Precio base del envío'},
            {'key': 'delivery_km_price', 'value': '200', 'description': 'Precio por cada KM recorrido'},
            # ... and more
        ]
        created_count = 0
        for d in defaults:
            obj, created = GlobalSetting.objects.get_or_create(key=d['key'], defaults={'value': d['value'], 'description': d['description']})
            if created: created_count += 1
        return Response({'message': f'Configuraciones inicializadas. {created_count} nuevas.'})

class OpeningHourViewSet(viewsets.ModelViewSet):
    queryset = OpeningHour.objects.all().order_by('day')
    serializer_class = OpeningHourSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminManager()]

class DeliverySettingViewSet(viewsets.ModelViewSet):
    queryset = DeliverySetting.objects.all()
    serializer_class = DeliverySettingSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminManager()]

    def get_object(self):
        obj, _ = DeliverySetting.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)
