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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print(f"DEBUG PRODUCT ERROR: {serializer.errors}")
            return Response({'detail': serializer.errors}, status=400)
        self.perform_update(serializer)
        return Response(serializer.data)

class MenuEntryViewSet(viewsets.ModelViewSet):
    queryset = MenuEntry.objects.all()
    serializer_class = MenuEntrySerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-date')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('name')
    serializer_class = InventoryItemSerializer

class SupplierOrderViewSet(viewsets.ModelViewSet):
    queryset = SupplierOrder.objects.all().order_by('-date')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierOrderCreateSerializer
        return SupplierOrderSerializer

class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all().order_by('key')
    serializer_class = GlobalSettingSerializer
    lookup_field = 'key'

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
    queryset = OpeningHour.objects.all()
    serializer_class = OpeningHourSerializer

class DeliverySettingViewSet(viewsets.ModelViewSet):
    queryset = DeliverySetting.objects.all()
    serializer_class = DeliverySettingSerializer

    def get_object(self):
        # Always return the first setting (Singleton logic)
        obj, created = DeliverySetting.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.filter(is_active=True)
    serializer_class = GalleryImageSerializer

# --- REAL-TIME ASYNC LOGIC ---

async def OrderStreamView(request):
    """
    Asynchronous view that streams new order notifications using Server-Sent Events (SSE).
    """
    async def event_stream():
        # Keep connection alive with heartbeats
        while True:
            # In a production system, we'd use a Redis pub/sub or database listen
            # Here we provide a foundation for real-time asynchrony
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(15) # Heartbeat every 15s

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Important for Nginx/Proxy
    return response
