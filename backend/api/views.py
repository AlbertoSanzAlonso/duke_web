from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Q
from .models import (Product, MenuEntry, Sale, Expense, InventoryItem, 
                     SupplierOrder, GlobalSetting, GalleryImage, OpeningHour, DeliverySetting, 
                     UserProfile, ActionLog, log_action)
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, 
                          SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, 
                          SupplierOrderCreateSerializer, GlobalSettingSerializer, 
                          GalleryImageSerializer, OpeningHourSerializer, 
                          DeliverySettingSerializer, UserSerializer, ActionLogSerializer)

from .permissions import (IsAdminManager, HasTPVPermission, HasAccountingPermission,
                         HasMenuPermission, HasInventoryPermission, HasGalleryPermission)

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core import management
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from asgiref.sync import sync_to_async

import os
import uuid
import json
import time
import asyncio
from io import BytesIO

@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def MeView(request):
    user = request.user
    if request.method == 'GET':
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=user)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    if request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=400)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminManager]

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request.user, 'USUARIOS', 'CREATE', f'Creado nuevo usuario: {user.username}')

    def perform_update(self, serializer):
        user = serializer.save()
        log_action(self.request.user, 'USUARIOS', 'UPDATE', f'Editado usuario: {user.username} (ajuste de permisos/datos)')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'USUARIOS', 'DELETE', f'Eliminado usuario: {instance.username}')
        instance.delete()

class ActionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActionLog.objects.select_related('user').all().order_by('-timestamp')
    serializer_class = ActionLogSerializer
    permission_classes = [permissions.IsAuthenticated] # Maybe strict later

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def AdminSetupView(request):
    """
    Temporary view to setup admin users and run migrations.
    """
    # 1. Run migrations and catch potential errors
    try:
        management.call_command('migrate', interactive=False)
    except Exception as e:
        return Response({
            'status': 'Error during migration',
            'error': str(e),
            'suggestion': 'Check DATABASE_URL in Coolify/Supabase and ensure the DB is reachable.'
        }, status=500)
    
    # 2. Synchronize all superusers profiles (Safety Fix)
    all_superusers = User.objects.filter(Q(is_superuser=True) | Q(is_staff=True))
    for u in all_superusers:
        profile, _ = UserProfile.objects.get_or_create(user=u)
        profile.can_use_tpv = True
        profile.can_use_accounting = True
        profile.can_use_menu = True
        profile.can_use_inventory = True
        profile.can_use_promos = True
        profile.can_use_gallery = True
        profile.can_use_settings = True
        profile.is_admin_manager = True
        profile.save()

    # 3. Setup Specific Admin Users
    users_to_setup = [
        ('albertosanzdev@gmail.com', 'Albertito_23'),
        ('dukeburger2025@gmail.com', 'Angeldalma2025')
    ]
    created = []
    skipped = []
    
    for username, password in users_to_setup:
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_superuser(username, username, password)
            created.append(username)
        else:
            u = User.objects.get(username=username)
            skipped.append(username)
        
        # Super-ensure their permissions are active
        profile, _ = UserProfile.objects.get_or_create(user=u)
        profile.can_use_tpv = True
        profile.can_use_accounting = True
        profile.can_use_menu = True
        profile.can_use_inventory = True
        profile.can_use_promos = True
        profile.can_use_gallery = True
        profile.can_use_settings = True
        profile.is_admin_manager = True
        profile.save()

    # 4. Setup Opening Hours
    hours_created = 0
    for i in range(1, 8):
        obj, created_h = OpeningHour.objects.get_or_create(day=i, defaults={
            'opening_time': '20:00',
            'closing_time': '00:00',
            'is_open': True
        })
        if created_h:
            hours_created += 1

    # 5. Setup Default Delivery Rates
    delivery_setup = False
    if not DeliverySetting.objects.filter(id=1).exists():
        DeliverySetting.objects.create(id=1, base_price=1000, km_price=200, max_km=15)
        delivery_setup = True
            
    return Response({
        'status': 'Success',
        'auth': {'created': created, 'skipped': skipped},
        'config': {
            'hours_restored': hours_created,
            'delivery_defaults': delivery_setup
        },
        'message': 'Admin accounts and initial configuration are ready on Supabase. Refresh /admin/config'
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def PasswordResetRequestView(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    user = User.objects.filter(email=email).first()
    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # In a real app, this would be a link to your FRONTEND reset page
        reset_url = f"{settings.ALLOWED_HOSTS[0]}/reset-password/{uid}/{token}" # Or the frontend URL
        
        message = f"Hola {user.username},\n\nPara restablcer tu contraseña en Duke Burger, haz clic en el siguiente enlace:\n{reset_url}\n\nSi no solicitaste esto, ignora este correo."
        
        send_mail(
            'Restablecer Contraseña - Duke Burger',
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
    # Always return success to avoid email enum attacks
    return Response({'message': 'Si el email está registrado, recibirás un enlace de recuperación pronto.'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def PasswordResetConfirmView(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([uidb64, token, new_password]):
        return Response({'error': 'UID, Token and New Password are required'}, status=400)
    
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Enlace inválido o expirado'}, status=400)
    
    if default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.'})
    else:
        return Response({'error': 'Token inválido o expirado'}, status=400)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasMenuPermission()]

    def perform_create(self, serializer):
        product = serializer.save()
        log_action(self.request.user, 'PRODUCTOS', 'CREATE', f'Creado nuevo producto: {product.name}')
        from django.core.cache import cache
        cache.delete("menu_list_public")

    def perform_update(self, serializer):
        product = serializer.save()
        log_action(self.request.user, 'PRODUCTOS', 'UPDATE', f'Editado producto: {product.name}')
        from django.core.cache import cache
        cache.delete("menu_list_public")

    def perform_destroy(self, instance):
        log_action(self.request.user, 'PRODUCTOS', 'DELETE', f'Eliminado producto: {instance.name}')
        instance.delete()
        from django.core.cache import cache
        cache.delete("menu_list_public")

class MenuEntryViewSet(viewsets.ModelViewSet):
    queryset = MenuEntry.objects.select_related('product').all().order_by('product__name')
    serializer_class = MenuEntrySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasMenuPermission()]

    def list(self, request, *args, **kwargs):
        from django.core.cache import cache
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        
        cache_key = "menu_list_public"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60 * 10) # 10 min
        return response

    def perform_create(self, serializer):
        serializer.save()
        from django.core.cache import cache
        cache.delete("menu_list_public")

    def perform_update(self, serializer):
        serializer.save()
        from django.core.cache import cache
        cache.delete("menu_list_public")

    def perform_destroy(self, instance):
        instance.delete()
        from django.core.cache import cache
        cache.delete("menu_list_public")

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items', 'items__menu_entry', 'items__menu_entry__product').all().order_by('-date')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

    def get_permissions(self):
        if self.action in ['create', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasTPVPermission()]

    @action(detail=False, methods=['post'], url_path='bulk-actions')
    def bulk_actions(self, request):
        ids = request.data.get('ids', [])
        action_type = request.data.get('action')
        
        if not ids:
            return Response({'error': 'No se seleccionaron tickets'}, status=400)
            
        sales = Sale.objects.filter(id__in=ids, status='PENDING')
        
        if action_type == 'COMPLETE':
            count = sales.update(status='COMPLETED')
            log_action(request.user, 'TPV', 'UPDATE', f'Cobro masivo de {count} tickets')
            return Response({'message': f'{count} tickets cobrados con éxito.'})
        elif action_type == 'DELETE':
            count, _ = sales.delete()
            log_action(request.user, 'TPV', 'DELETE', f'Eliminación masiva de {count} tickets')
            return Response({'message': f'{count} tickets eliminados.'})
            
        return Response({'error': 'Operación no válida'}, status=400)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, HasAccountingPermission]

    def perform_create(self, serializer):
        expense = serializer.save()
        log_action(self.request.user, 'CONTABILIDAD', 'CREATE', f'Nuevo gasto: {expense.description} por ${expense.amount}')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'CONTABILIDAD', 'DELETE', f'Eliminado gasto: {instance.description} de ${instance.amount}')
        instance.delete()

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('-created_at')
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]

    def perform_create(self, serializer):
        item = serializer.save()
        log_action(self.request.user, 'INVENTARIO', 'CREATE', f'Nuevo item de inventario: {item.name} ({item.quantity} {item.unit})')

    def perform_update(self, serializer):
        item = serializer.save()
        log_action(self.request.user, 'INVENTARIO', 'UPDATE', f'Editado item inventario: {item.name}. Stock: {item.quantity}')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'INVENTARIO', 'DELETE', f'Eliminado item inventario: {instance.name}')
        instance.delete()

class SupplierOrderViewSet(viewsets.ModelViewSet):
    queryset = SupplierOrder.objects.prefetch_related('items', 'items__item').all().order_by('-date')
    permission_classes = [permissions.IsAuthenticated, HasInventoryPermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierOrderCreateSerializer
        return SupplierOrderSerializer

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
            {'key': 'delivery_max_km', 'value': '15', 'description': 'Distancia máxima permitida (KM)'},
            {'key': 'opening_days', 'value': '1,2,3,4,5,6,7', 'description': 'Días de apertura (1=Lunes, 7=Domingo)'},
            {'key': 'opening_time', 'value': '20:00', 'description': 'Horario de apertura (HH:MM)'},
            {'key': 'closing_time', 'value': '00:00', 'description': 'Horario de cierre (HH:MM)'},
            {'key': 'marquee_text', 'value': 'BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN - ', 'description': 'Texto en movimiento del banner principal'}
        ]
        created_count = 0
        for d in defaults:
            obj, created = GlobalSetting.objects.get_or_create(key=d['key'], defaults={'value': d['value'], 'description': d['description']})
            if created: created_count += 1
        
        return Response({'message': f'Configuraciones inicializadas. {created_count} nuevas creadas.', 'total': GlobalSetting.objects.count()})

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
        obj, created = DeliverySetting.objects.get_or_create(id=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class GalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryImageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasGalleryPermission()]

    # Solo cacheamos la lista para el público. Los administradores ven tiempo real.
    def list(self, request, *args, **kwargs):
        from django.core.cache import cache
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)
        
        cache_key = "gallery_list_public"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 60 * 15) # 15 min
        return response

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return GalleryImage.objects.all().order_by('order', '-id')
        return GalleryImage.objects.filter(is_active=True).order_by('order', '-id')

    # Al realizar cambios, invalidamos el caché público
    def perform_create(self, serializer):
        serializer.save()
        from django.core.cache import cache
        cache.delete("gallery_list_public")

    def perform_update(self, serializer):
        serializer.save()
        from django.core.cache import cache
        cache.delete("gallery_list_public")

    def perform_destroy(self, instance):
        instance.delete()
        from django.core.cache import cache
        cache.delete("gallery_list_public")

@csrf_exempt
async def OrderStreamView(request):
    async def event_stream():
        # Consultamos el último ID actual de forma asíncrona
        last_seen_id = 0
        if await Sale.objects.aexists():
            last_sale = await Sale.objects.order_by('-id').afirst()
            last_seen_id = last_sale.id

        while True:
            # Consultamos ventas nuevas de forma eficiente usando el motor asíncrono
            # .aiter() permite iterar sin bloquear el thread secundario de Gthread
            new_sales_qs = Sale.objects.filter(id__gt=last_seen_id).order_by('id')
            
            async for sale in new_sales_qs:
                data = {
                    'type': 'new_order',
                    'id': sale.id,
                    'customer': sale.customer_name or 'Cliente Anónimo',
                    'total': str(sale.total_amount)
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_seen_id = sale.id

            # Heartbeat para mantener conexión abierta sin saturar logs
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            
            # Pausa asíncrona obligatoria para ceder el control del worker
            await asyncio.sleep(3) 

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    
    # --- CONFIGURACIÓN CRÍTICA PARA COOLIFY / STREAMING / CORS ---
    response['Content-Type'] = 'text/event-stream'
    response['X-Accel-Buffering'] = 'no'      
    response['Cache-Control'] = 'no-cache'    
    response['Connection'] = 'keep-alive'     
    response['Access-Control-Allow-Origin'] = '*'
    # ------------------------------------------------------------
    
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def PasswordResetRequestView(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Por seguridad no indicamos si el email existe o no
        return Response({"message": "Si el email existe, se ha enviado un enlace de recuperación."})

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # URL del Frontend (Asegurarse que coincide con la ruta en React)
    reset_url = f"{settings.CSRF_TRUSTED_ORIGINS[0]}/reset-password/{uid}/{token}/"
    
    subject = "Recupera tu contraseña - Duke Burger"
    message = f"Hola {user.username},\n\nHemos recibido una solicitud para restablecer tu contraseña en el panel de Duke Burger.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n\n{reset_url}\n\nSi no has solicitado este cambio, por favor ignora este correo.\n\nSaludos,\nEquipo Duke Burger."
    
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
        return Response({"message": "Si el email existe, se ha enviado un enlace de recuperación."})
    except Exception as e:
        return Response({"error": f"Error enviando correo: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def PasswordResetConfirmView(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([uidb64, token, new_password]):
        return Response({"error": "Datos incompletos"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
        
    if user is not None and default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({"message": "Contraseña actualizada con éxito. Ya puedes iniciar sesión."})
    else:
        return Response({"error": "El enlace es inválido o ha expirado."}, status=status.HTTP_400_BAD_REQUEST)
