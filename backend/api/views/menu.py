from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.core.cache import cache

from ..models import Product, MenuEntry, ProductIngredient, GalleryImage, log_action
from ..serializers import (ProductSerializer, MenuEntrySerializer, 
                           ProductIngredientSerializer, GalleryImageSerializer)
from ..permissions import HasMenuPermission, HasGalleryPermission

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.prefetch_related('ingredients_list', 'ingredients_list__inventory_item').all().order_by('-id')
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasMenuPermission()]

    def perform_create(self, serializer):
        product = serializer.save()
        log_action(self.request.user, 'PRODUCTOS', 'CREATE', f'Creado nuevo producto: {product.name}')
        cache.delete("menu_list_public")

    def perform_update(self, serializer):
        product = serializer.save()
        log_action(self.request.user, 'PRODUCTOS', 'UPDATE', f'Editado producto: {product.name}')
        cache.delete("menu_list_public")

    def perform_destroy(self, instance):
        log_action(self.request.user, 'PRODUCTOS', 'DELETE', f'Eliminado producto: {instance.name}')
        instance.delete()
        cache.delete("menu_list_public")

class ProductIngredientViewSet(viewsets.ModelViewSet):
    serializer_class = ProductIngredientSerializer
    permission_classes = [permissions.IsAuthenticated, HasMenuPermission]

    def get_queryset(self):
        return ProductIngredient.objects.select_related('inventory_item').all()

    def perform_create(self, serializer):
        ingredient = serializer.save()
        log_action(self.request.user, 'PRODUCTOS', 'UPDATE', f'Añadida materia prima "{ingredient.inventory_item.name}" al producto "{ingredient.product.name}"')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'PRODUCTOS', 'UPDATE', f'Eliminada materia prima "{instance.inventory_item.name}" del producto "{instance.product.name}"')
        instance.delete()

class MenuEntryViewSet(viewsets.ModelViewSet):
    queryset = MenuEntry.objects.select_related('product').all().order_by('product__name')
    serializer_class = MenuEntrySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasMenuPermission()]

    def list(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        
        cache_key = "menu_list_public"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60 * 10)
        return response

    def perform_create(self, serializer):
        serializer.save()
        cache.delete("menu_list_public")

    def perform_update(self, serializer):
        serializer.save()
        cache.delete("menu_list_public")

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete("menu_list_public")

class GalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryImageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasGalleryPermission()]

    def list(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        
        cache_key = "gallery_list_public"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60 * 15)
        return response

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return GalleryImage.objects.all().order_by('order', '-id')
        return GalleryImage.objects.filter(is_active=True).order_by('order', '-id')

    def perform_create(self, serializer):
        serializer.save()
        cache.delete("gallery_list_public")

    def perform_update(self, serializer):
        serializer.save()
        cache.delete("gallery_list_public")

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete("gallery_list_public")
