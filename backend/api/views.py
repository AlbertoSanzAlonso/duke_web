from rest_framework import viewsets
from .models import Product, MenuEntry, Sale, Expense, InventoryItem, SupplierOrder
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, SupplierOrderCreateSerializer)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer

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
