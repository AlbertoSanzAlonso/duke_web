from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import (Product, MenuEntry, Sale, Expense, InventoryItem, 
                     SupplierOrder, GlobalSetting, GalleryImage, OpeningHour, DeliverySetting)
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, 
                          SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, 
                          SupplierOrderCreateSerializer, GlobalSettingSerializer, 
                          GalleryImageSerializer, OpeningHourSerializer, 
                          DeliverySettingSerializer)
from django.http import StreamingHttpResponse
import asyncio
import json
from asgiref.sync import sync_to_async

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response({'detail': serializer.errors}, status=400)
        self.perform_update(serializer)
        return Response(serializer.data)

class MenuEntryViewSet(viewsets.ModelViewSet):
    queryset = MenuEntry.objects.all()
    serializer_class = MenuEntrySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-date')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('name')
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class SupplierOrderViewSet(viewsets.ModelViewSet):
    queryset = SupplierOrder.objects.all().order_by('-date')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierOrderCreateSerializer
        return SupplierOrderSerializer

class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all().order_by('key')
    serializer_class = GlobalSettingSerializer
    lookup_field = 'key'
    permission_classes = [permissions.IsAuthenticated]

    from rest_framework.decorators import action
    @action(detail=False, methods=['post'], url_path='setup-defaults')
    def setup_defaults(self, request):
        defaults = [
            {'key': 'delivery_base_price', 'value': '1000', 'description': 'Precio base del envío'},
            {'key': 'delivery_km_price', 'value': '200', 'description': 'Precio por cada KM recorrido'},
            {'key': 'delivery_max_km', 'value': '15', 'description': 'Distancia máxima permitida (KM)'},
            {'key': 'opening_days', 'value': '1,2,3,4,5,6,7', 'description': 'Días de apertura (1=Lunes, 7=Domingo)'},
            {'key': 'opening_time', 'value': '20:00', 'description': 'Horario de apertura (HH:MM)'},
            {'key': 'closing_time', 'value': '00:00', 'description': 'Horario de cierre (HH:MM)'}
        ]
        created_count = 0
        for d in defaults:
            obj, created = GlobalSetting.objects.get_or_create(key=d['key'], defaults={'value': d['value'], 'description': d['description']})
            if created: created_count += 1
        
        return Response({'message': f'Configuraciones inicializadas. {created_count} nuevas creadas.', 'total': GlobalSetting.objects.count()})

class OpeningHourViewSet(viewsets.ModelViewSet):
    queryset = OpeningHour.objects.all().order_by('day')
    serializer_class = OpeningHourSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DeliverySettingViewSet(viewsets.ModelViewSet):
    queryset = DeliverySetting.objects.all()
    serializer_class = DeliverySettingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        obj, created = DeliverySetting.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.filter(is_active=True).order_by('-id')
    serializer_class = GalleryImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# --- REAL-TIME ASYNC LOGIC ---

async def OrderStreamView(request):
    async def event_stream():
        while True:
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(15)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
