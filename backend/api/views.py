from rest_framework import viewsets
from rest_framework.response import Response
from .models import Product, MenuEntry, Sale, Expense, InventoryItem, SupplierOrder
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, SupplierOrderCreateSerializer)
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
