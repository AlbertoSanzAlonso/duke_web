from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Q, F, Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import (Product, MenuEntry, Sale, SaleItem, Expense, InventoryItem, 
                     SupplierOrder, GlobalSetting, GalleryImage, OpeningHour, DeliverySetting, 
                     UserProfile, ActionLog, log_action)
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, 
                          SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, 
                          SupplierOrderCreateSerializer, GlobalSettingSerializer, 
                          GalleryImageSerializer, OpeningHourSerializer, 
                          DeliverySettingSerializer, UserSerializer, ActionLogSerializer)

from .permissions import (IsAdminManager, HasTPVPermission, HasAccountingPermission,
                         HasMenuPermission, HasInventoryPermission, HasGalleryPermission, HasKitchenPermission)

from django.utils.decorators import method_decorator
import json
import os
import urllib.request
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.http import StreamingHttpResponse, HttpResponse
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

@api_view(['GET'])
@permission_classes([AllowAny])
def HealthCheckView(request):
    """
    Internal health check endpoint for Traefik/Coolify/Docker.
    """
    return Response({"status": "healthy", "timestamp": timezone.now()}, status=200)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def MailTestView(request):
    """
    Test IMAP connection with provided credentials.
    """
    from .mail_utils import get_unread_mail_count
    server = request.data.get('server')
    user = request.data.get('user')
    password = request.data.get('password')
    
    if not all([server, user, password]):
        return Response({'error': 'Todos los campos son obligatorios para la prueba'}, status=400)
    
    # We pass use_cache=False to force a real check
    # Let's modify mail_utils first or just use it as is (it caches by user)
    # Actually, we can just call it.
    count = get_unread_mail_count(server, user, password)
    
    if count == -1:
        return Response({'success': False, 'message': 'Fallo la conexión. Revisa servidor, usuario y contraseña.'}, status=400)
    
    return Response({
        'success': True, 
        'message': f'¡Conexión exitosa! Tienes {count} correos sin leer.',
        'unread_count': count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def MailCheckView(request):
    """
    Endpoint to check corporate mail unread count.
    Prioritizes settings.py (Environment) then GlobalSetting (DB).
    """
    from .mail_utils import get_unread_mail_count
    
    # 1. Try from Settings (Environment)
    s_host = getattr(settings, 'IMAP_SERVER', None)
    s_user = getattr(settings, 'IMAP_USER', None)
    s_pass = getattr(settings, 'IMAP_PASSWORD', None)

    # 2. Try from Database
    db_server = GlobalSetting.objects.filter(key='imap_server').first()
    db_user = GlobalSetting.objects.filter(key='imap_user').first()
    db_pass = GlobalSetting.objects.filter(key='imap_password').first()

    # Determine final values
    final_host = s_host
    final_user = s_user
    final_pass = s_pass

    # Database settings take priority ONLY IF they are specifically set and not dummy ones
    if db_server and db_server.value and db_server.value != 'imap.dondominio.com':
        final_host = db_server.value
    if db_user and db_user.value and db_user.value != 'admin@dukeburger-sj.com':
        final_user = db_user.value
    if db_pass and db_pass.value and db_pass.value != 'password_aqui' and db_pass.value != '':
        final_pass = db_pass.value

    # More permissive validation: If we have a password that isn't the dummy one, assume it's configured
    is_configured = (
        final_host and final_user and final_pass and 
        final_pass != 'password_aqui' and final_pass != ''
    )
    
    if not is_configured:
        return Response({'unread_count': 0, 'configured': False})
        
    count = get_unread_mail_count(final_host, final_user, final_pass)
    return Response({
        'unread_count': count, 
        'configured': True,
        'error': count == -1
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def DashboardInsightsView(request):
    """
    Unified performance endpoint to reduce Dashboard roundtrips (from 6 separate calls to 1).
    """
    from .mail_utils import get_unread_mail_count
    # Use localtime to respect America/Argentina/Buenos_Aires
    now = timezone.localtime()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Profile
    user_data = UserSerializer(request.user).data
    
    # 2. Sales (Optimized)
    sales_qs = Sale.objects.filter(date__gte=today_start)
    today_sales_count = sales_qs.count()
    pending_today = sales_qs.filter(status='PENDING').count()
    completed_today = sales_qs.filter(status='COMPLETED').count()
    
    # Kitchen stats: Independent of payment status (can be PENDING or COMPLETED)
    kitchen_pending_qs = sales_qs.filter(is_prepared=False)
    kitchen_pending = kitchen_pending_qs.count()
    
    kitchen_ready_qs = sales_qs.filter(is_prepared=True, is_delivered=False)
    kitchen_ready_count = kitchen_ready_qs.count()
    
    kitchen_delivered_qs = sales_qs.filter(is_prepared=True, is_delivered=True)
    kitchen_delivered_count = kitchen_delivered_qs.count()
    
    # Serialized summaries for dashboard modals
    kitchen_pending_list = [{
        "id": s.id, 
        "customer": s.customer_name or "Particular", 
        "total": float(s.total_amount), 
        "is_prepared": s.is_prepared,
        "is_delivered": s.is_delivered,
        "created_at": s.date.isoformat(),
        "updated_at": s.updated_at.isoformat()
    } for s in kitchen_pending_qs]
    
    kitchen_ready_list = [{
        "id": s.id, 
        "customer": s.customer_name or "Particular", 
        "total": float(s.total_amount), 
        "is_prepared": s.is_prepared,
        "is_delivered": s.is_delivered,
        "created_at": s.date.isoformat(),
        "updated_at": s.updated_at.isoformat()
    } for s in kitchen_ready_qs]

    kitchen_delivered_list = [{
        "id": s.id, 
        "customer": s.customer_name or "Particular", 
        "total": float(s.total_amount), 
        "is_prepared": s.is_prepared,
        "is_delivered": s.is_delivered,
        "created_at": s.date.isoformat(),
        "updated_at": s.updated_at.isoformat()
    } for s in kitchen_delivered_qs]
    
    # 3. Stats Mensuales ( IA / RAG Context Ready )
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_sales = Sale.objects.filter(date__gte=month_start, status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or 0
    monthly_expenses = Expense.objects.filter(date__gte=month_start).aggregate(total=Sum('amount'))['total'] or 0
    
    # 4. Promos
    active_promos = MenuEntry.objects.filter(product__category='Promos', is_available=True).count()
    
    # 5. Inventory (Low Stock Alert)
    low_stock = InventoryItemSerializer(
        InventoryItem.objects.filter(quantity__lte=F('min_stock')), 
        many=True
    ).data
    
    # 6. Opening Hours Today
    # Correct mapping: 0=Monday (1), 6=Sunday (7)
    day_map = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7}
    db_day = day_map[now.weekday()]
    today_hours = OpeningHourSerializer(OpeningHour.objects.filter(day=db_day).first()).data
    
    # 7. Mail (Cached via mail_utils)
    mail_host = getattr(settings, 'IMAP_SERVER', None)
    mail_user = getattr(settings, 'IMAP_USER', None)
    mail_pass = getattr(settings, 'IMAP_PASSWORD', None)
    
    mail_count = 0
    if all([mail_host, mail_user, mail_pass]):
        mail_count = get_unread_mail_count(mail_host, mail_user, mail_pass)
        
    return Response({
        'profile': user_data,
        'today_sales': {
            'total_count': today_sales_count,
            'pending': pending_today,
            'completed': completed_today,
            'kitchen_pending': kitchen_pending,
            'kitchen_ready': kitchen_ready_count,
            'kitchen_delivered': kitchen_delivered_count,
            'kitchen_pending_list': kitchen_pending_list,
            'kitchen_ready_list': kitchen_ready_list,
            'kitchen_delivered_list': kitchen_delivered_list
        },
        'monthly_stats': {
            'total_sales': float(monthly_sales),
            'total_expenses': float(monthly_expenses),
            'net': float(monthly_sales - monthly_expenses)
        },
        'active_promos': active_promos,
        'low_stock': low_stock,
        'today_hours': today_hours,
        'unread_mail': mail_count
    })

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
        profile.can_use_kitchen = True
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
        profile.can_use_kitchen = True
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
    
    # 6. Setup IMAP defaults
    imap_defaults = [
        {'key': 'imap_server', 'value': 'imap.dondominio.com', 'description': 'Servidor IMAP'},
        {'key': 'imap_user', 'value': 'admin@dukeburger-sj.com', 'description': 'Usuario IMAP'},
        {'key': 'imap_password', 'value': 'password_aqui', 'description': 'Contraseña IMAP'}
    ]
    for d in imap_defaults:
        GlobalSetting.objects.get_or_create(key=d['key'], defaults={'value': d['value'], 'description': d['description']})
            
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
    # Safety fallback to -id until all migrations are applied
    queryset = Product.objects.all().order_by('-id')
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
        if self.action in ['create', 'update', 'partial_update']:
            return SaleCreateSerializer
        return SaleSerializer

    def get_permissions(self):
        if self.action in ['create', 'retrieve']:
            return [permissions.AllowAny()]
        # Fallback to IsAuthenticated for kitchen actions to avoid potential bitwise permission errors
        if self.action in ['mark_prepared', 'mark_delivered', 'revert_prepared', 'revert_delivery']:
            return [permissions.IsAuthenticated()]
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
        
    @action(detail=True, methods=['post'], url_path='mark-prepared')
    def mark_prepared(self, request, pk=None):
        from django.utils import timezone
        sale = self.get_object()
        sale.is_prepared = True
        sale.prepared_at = timezone.now()
        sale.save()
        log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} marcado como PREPARADO')
        return Response({'message': f'Pedido #{sale.id} enviado a listo.'})

    @action(detail=True, methods=['post'], url_path='mark-delivered')
    def mark_delivered(self, request, pk=None):
        from .models import Sale, log_action
        try:
            sale = self.get_object()
            sale.is_delivered = True
            sale.delivered_at = timezone.now()
            # As per user request: marking as delivered also removes it from pending list in TPV
            sale.status = 'COMPLETED'
            sale.save()
            log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} recogido y completado automáticamente')
            return Response({'message': f'Pedido #{sale.id} archivado como recogido y completado.'})
        except Exception as e:
            import traceback
            print(traceback.format_exc()) # Log to server console
            return Response({'error': str(e), 'traceback': 'Logged to console'}, status=500)

    @action(detail=True, methods=['post'], url_path='revert-delivery')
    def revert_delivery(self, request, pk=None):
        sale = self.get_object()
        sale.is_delivered = False
        sale.delivered_at = None
        sale.save()
        log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} devuelto a LISTO (revertir entrega)')
        return Response({'message': f'Pedido #{sale.id} devuelto a la lista de listos.'})

    @action(detail=True, methods=['post'], url_path='revert-prepared')
    def revert_prepared(self, request, pk=None):
        sale = self.get_object()
        sale.is_prepared = False
        sale.is_delivered = False
        sale.prepared_at = None
        sale.delivered_at = None
        sale.save()
        log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} devuelto a PENDIENTE (cocinando)')
        return Response({'message': f'Pedido #{sale.id} devuelto a pendiente de cocción.'})

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
    # Order by -id to ensure stability even if created_at migration is pending
    queryset = InventoryItem.objects.all().order_by('-id')
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
            {'key': 'marquee_text', 'value': 'BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN - ', 'description': 'Texto en movimiento del banner principal'},
            {'key': 'imap_server', 'value': 'imap.dondominio.com', 'description': 'Servidor IMAP de correo corporativo'},
            {'key': 'imap_user', 'value': 'admin@dukeburger-sj.com', 'description': 'Usuario/Email del correo corporativo'},
            {'key': 'imap_password', 'value': 'password_aqui', 'description': 'Contraseña del correo corporativo (SSL Puerto 993)'}
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
def OrderStreamView(request):
    """
    Server-Sent Events (SSE) for real-time order notifications.
    Thread-based sync version for maximum stability with Gunicorn gthread workers.
    """
    origin = request.headers.get('Origin') or 'https://dukeburger-sj.com'
    
    try:
        # 1. CORS Preflight
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Requested-With'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'
            return response

        # 2. Authentication
        from rest_framework.authtoken.models import Token
        token_key = request.GET.get('token')
        
        if not token_key and 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Token '):
                token_key = auth_header.split('Token ')[1]

        try:
            if not token_key or not Token.objects.filter(key=token_key.strip()).exists():
                response = HttpResponse(json.dumps({'error': 'Invalid or missing token'}), status=401, content_type='application/json')
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
                return response
        except:
            return HttpResponse(status=401)

        # 3. Stream Generator (Sync)
        def event_stream():
            try:
                # Critical for Caddy/Traefik: yield a ready event
                yield f"data: {json.dumps({'type': 'connection_ready', 'status': 'connected'})}\n\n"
                
                last_seen_id = 0
                last_check_time = timezone.now()
                last_sale = Sale.objects.order_by('-id').first()
                if last_sale:
                    last_seen_id = last_sale.id

                while True:
                    current_time = timezone.now()
                    
                    # 1. New Orders
                    new_sales = list(Sale.objects.filter(id__gt=last_seen_id).order_by('id'))
                    for sale in new_sales:
                        data = {
                            'type': 'new_order',
                            'id': sale.id,
                            'customer': sale.customer_name or 'Cliente Anónimo',
                            'total': str(sale.total_amount),
                            'is_prepared': sale.is_prepared,
                            'is_delivered': sale.is_delivered
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                        last_seen_id = sale.id

                    # 2. Updated Orders (e.g. marked as prepared)
                    # Checking orders updated since last check, excluding the ones we just sent as "new"
                    updated_sales = list(Sale.objects.filter(updated_at__gt=last_check_time, id__lte=last_seen_id).order_by('updated_at'))
                    for sale in updated_sales:
                        data = {
                            'type': 'order_updated',
                            'id': sale.id,
                            'customer': sale.customer_name or 'Cliente Anónimo',
                            'total': str(sale.total_amount),
                            'status': sale.status,
                            'is_prepared': sale.is_prepared,
                            'is_delivered': sale.is_delivered
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                    
                    last_check_time = current_time

                    # Keep-alive
                    yield ": ping\n\n"
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                    time.sleep(15) # Balancing real-time vs DB load
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['X-Accel-Buffering'] = 'no'      # For Nginx
        response['Cache-Control'] = 'no-cache'   # Avoid proxy caching
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    except Exception as e:
        response = HttpResponse(json.dumps({'error': str(e)}), status=500, content_type='application/json')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def AIHelpView(request):
    question = request.data.get('question')
    if not question:
        return Response({'error': 'Pregunta requerida'}, status=400)
    
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return Response({
            'answer': 'Lo siento, el asistente de IA no está configurado (falta GROQ_API_KEY en el servidor). '
                      'Soy un experto en Duke Burger: puedo enseñarte a usar el TPV, el Inventario, la Contabilidad y los Pedidos.'
        })

    # 1. Read static Manual context
    manual_content = ""
    try:
        manual_path = os.path.join(settings.BASE_DIR, '..', 'docs', 'manual_admin.md')
        if os.path.exists(manual_path):
            with open(manual_path, 'r', encoding='utf-8') as f:
                manual_content = f.read()
    except Exception as e:
        print(f"Error reading manual: {e}")

    # 2. Fetch Dynamic Live Context from DB
    live_context = ""
    try:
        now = timezone.localtime()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # --- VENTAS (SÍNTESIS) ---
        sales_today = Sale.objects.filter(date__gte=today_start, status='COMPLETED')
        total_sales = sales_today.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        count_sales = sales_today.count()
        
        # Pedidos TPV Pendientes
        pending_sales = Sale.objects.filter(status='PENDING').count()
        
        # --- CONTABILIDAD ---
        expenses_today = Expense.objects.filter(date__gte=today_start)
        total_expenses = expenses_today.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # --- INVENTARIO Y COMPRAS ---
        all_inventory = InventoryItem.objects.all().order_by('name')
        inventory_summary = "\n".join([f"- {i.name}: {i.quantity} {i.unit} (Stock min: {i.min_stock})" for i in all_inventory])
        
        critical_items = InventoryItem.objects.filter(quantity__lte=F('min_stock'))
        stock_critical_info = ", ".join([f"{i.name}" for i in critical_items]) if critical_items.exists() else "Todo en orden"
        
        pending_supplier_orders = SupplierOrder.objects.filter(status='PENDING').count()

        # --- RECIENTES (Últimos 5 logs de acción) ---
        recent_logs = ActionLog.objects.select_related('user').all()[:5]
        logs_text = "\n".join([f"- {log.timestamp.strftime('%H:%M')} {log.user.username if log.user else 'Sis'}: {log.description}" for log in recent_logs])

        # --- MENU ---
        categories = MenuEntry.objects.values_list('product__category', flat=True).distinct()
        total_products = Product.objects.count()

        # --- HISTORIAL DIARIO (Últimos 30 días) ---
        history_start = today_start - timedelta(days=30)
        daily_sales = Sale.objects.filter(date__gte=history_start, status='COMPLETED')\
            .annotate(day=TruncDate('date'))\
            .values('day')\
            .annotate(total=Sum('total_amount'), count=Count('id'))\
            .order_by('-day')
            
        daily_expenses = Expense.objects.filter(date__gte=history_start)\
            .annotate(day=TruncDate('date'))\
            .values('day')\
            .annotate(total=Sum('amount'))\
            .order_by('-day')

        # Combinar ventas y gastos en un diccionario por día para el prompt
        history_map = {}
        for s in daily_sales:
            day_str = s['day'].strftime('%d/%m/%Y')
            history_map[day_str] = {'sales': s['total'], 'count': s['count'], 'expenses': 0}
        for e in daily_expenses:
            day_str = e['day'].strftime('%d/%m/%Y')
            if day_str not in history_map:
                history_map[day_str] = {'sales': 0, 'count': 0, 'expenses': e['total']}
            else:
                history_map[day_str]['expenses'] = e['total']

        history_lines = [f"- {d}: Ventas ${v['sales']} ({v['count']} tks), Gastos ${v['expenses']}" for d, v in history_map.items()]
        history_text = "\n".join(history_lines[:15]) # Enviamos los últimos 15 días detallados para no saturar

        # --- RESUMEN MENSUAL (Mes actual y anterior) ---
        this_month_start = today_start.replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        def get_month_stats(start, end):
            s = Sale.objects.filter(date__gte=start, date__lte=end, status='COMPLETED').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            e = Expense.objects.filter(date__gte=start, date__lte=end).aggregate(Sum('amount'))['amount__sum'] or 0
            return s, e

        m_sales, m_exp = get_month_stats(this_month_start, now)
        lm_sales, lm_exp = get_month_stats(last_month_start, last_month_end)
        
        # --- RESUMEN SEMANAL (Últimos 7 días) ---
        week_start = today_start - timedelta(days=7)
        w_sales, w_exp = get_month_stats(week_start, now)
        
        # --- TOP PRODUCTOS (Semanal) ---
        top_selling = SaleItem.objects.filter(sale__date__gte=week_start, sale__status='COMPLETED')\
            .values('menu_entry__product__name')\
            .annotate(qty=Sum('quantity'))\
            .order_by('-qty')[:5]
        top_selling_text = ", ".join([f"{p['menu_entry__product__name']} ({p['qty']})" for p in top_selling]) if top_selling.exists() else "Sin ventas registradas"

        # --- COMPARATIVA MENSUAL (6 meses) ---
        monthly_history = Sale.objects.filter(date__gte=now - timedelta(days=180), status='COMPLETED')\
            .annotate(month=TruncMonth('date'))\
            .values('month')\
            .annotate(ventas=Sum('total_amount'))\
            .order_by('-month')
        
        monthly_exp_history = Expense.objects.filter(date__gte=now - timedelta(days=180))\
            .annotate(month=TruncMonth('date'))\
            .values('month')\
            .annotate(gastos=Sum('amount'))\
            .order_by('-month')

        finance_history_map = {}
        for s in monthly_history:
            m_str = s['month'].strftime('%B %Y')
            finance_history_map[m_str] = {'v': s['ventas'], 'g': 0}
        for e in monthly_exp_history:
            m_str = e['month'].strftime('%B %Y')
            if m_str in finance_history_map:
                finance_history_map[m_str]['g'] = e['gastos']
            else:
                finance_history_map[m_str] = {'v': 0, 'g': e['gastos']}
        
        finance_history_text = "\n".join([f"- {m}: Ventas ${data['v']} | Gastos ${data['g']}" for m, data in finance_history_map.items()])

        live_context = (
            f"ESTADO DEL SISTEMA ({now.strftime('%d/%m/%y %H:%M')}):\n\n"
            f"--- PRODUCTOS MÁS VENDIDOS (ESTA SEMANA) ---\n"
            f"{top_selling_text}\n\n"
            f"--- FINANZAS HOY ---\n"
            f"- Ventas Cobradas: ${total_sales} ({count_sales} tickets)\n"
            f"- Gastos: ${total_expenses}\n"
            f"- Balance: ${total_sales - total_expenses}\n\n"
            f"--- RESUMEN SEMANAL (7 días) ---\n"
            f"- Ventas: ${w_sales}, Gastos: ${w_exp}, Neto: ${w_sales - w_exp}\n\n"
            f"--- COMPARATIVA MENSUAL (Historial) ---\n"
            f"{finance_history_text}\n\n"
            f"--- RESUMEN MENSUAL ---\n"
            f"- ESTE MES: Ventas ${m_sales}, Gastos ${m_exp}, Neto ${m_sales - m_exp}\n"
            f"- MES PASADO: Ventas ${lm_sales}, Gastos ${lm_exp}, Neto ${lm_sales - lm_exp}\n\n"
            f"--- HISTORIAL RECIENTE (Últimos días) ---\n"
            f"{history_text}\n\n"
            f"--- OPERACIONES ---\n"
            f"- Pedidos TPV pendientes: {pending_sales}\n"
            f"- Compras a proveedores pendientes: {pending_supplier_orders}\n"
            f"- STOCK CRÍTICO: {stock_critical_info}\n\n"
            f"--- ÚLTIMOS LOGS DE STAFF ---\n"
            f"{logs_text}\n\n"
            f"--- CARTA Y PRODUCTOS ---\n"
            f"- Categorías: {', '.join(categories)}\n"
            f"- Productos: {total_products}\n\n"
            f"--- STOCK COMPLETO ---\n"
            f"{inventory_summary}\n"
        )
    except Exception as e:
        live_context = f"Error al obtener contexto en tiempo real: {str(e)}"

    # 3. Build Final System Instruction
    system_instruction = (
        "Eres el asistente virtual oficial de Duke Burger (San Juan, Argentina). "
        "Tu misión es ayudar al administrador con dudas sobre el funcionamiento y ESTADO ACTUAL del panel. "
        f"\n\n--- MANUAL DE OPERACIÓN ---\n{manual_content}\n"
        f"\n\n--- ESTADO DEL SISTEMA AHORA MISMO ---\n{live_context}\n"
        "\nREGLAS DE RESPUESTA: "
        "1. Usa FORMATO MARKDOWN ENRIQUECIDO (negritas, listas con puntos, tablas si aplica). "
        "2. Usa SALTOS DE LÍNEA constantes para no crear bloques densos de texto. "
        "3. Responde de forma profesional, clara y concisa. "
        "4. Usa los datos precisos del ESTADO DEL SISTEMA para responder. "
        "5. Usa pesos argentinos ($) formateados (ej: $12.900). "
        "6. Si te preguntan '¿qué falta?' o '¿qué tengo que comprar?', prioriza el stock crítico."
        "7. PRINCIPIO DE RELEVANCIA: No ofrezcas toda la información que posees si no se te pide explícitamente. "
        "Si el usuario te saluda o hace una pregunta genérica como '¿cómo va todo?', NO vuelques informes financieros ni de stock de inmediato. "
        "Responde de forma educada, indica que todo está operativo y ofrece opciones breves para profundizar."
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": question}
        ],
        "temperature": 0.4 # Lower temperature for more factual responses
    }

    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'), 
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            answer = res_data['choices'][0]['message']['content']
            return Response({'answer': answer})
    except urllib.error.HTTPError as he:
        err_msg = he.read().decode('utf-8')
        print(f"Groq HTTP Error: {err_msg}")
        return Response({'error': f'Error de la API de Groq: {err_msg}'}, status=502)
    except Exception as e:
        print(f"Groq General Error: {e}")
        return Response({'error': f'Ocurrió un error inesperado al hablar con la IA: {str(e)}'}, status=502)
