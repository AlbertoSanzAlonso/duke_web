from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from .models import (Product, MenuEntry, Sale, Expense, InventoryItem, 
                     SupplierOrder, GlobalSetting, GalleryImage, OpeningHour, DeliverySetting)
from .serializers import (ProductSerializer, MenuEntrySerializer, SaleSerializer, 
                          SaleCreateSerializer, ExpenseSerializer,
                          InventoryItemSerializer, SupplierOrderSerializer, 
                          SupplierOrderCreateSerializer, GlobalSettingSerializer, 
                          GalleryImageSerializer, OpeningHourSerializer, 
                          DeliverySettingSerializer, UserSerializer)
from .models import UserProfile

@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
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
            
            # Handle avatar if provided
            if 'avatar' in request.FILES:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.avatar = request.FILES['avatar']
                profile.save()
            
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=400)
from django.http import StreamingHttpResponse
import asyncio
import json
from asgiref.sync import sync_to_async
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from django.core import management

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def AdminSetupView(request):
    # Run migrations to ensure UserProfile and other new tables exist
    management.call_command('migrate')
    
    """
    Temporary view to setup admin users on the database (Supabase).
    """
    users = [
        ('albertosanzdev@gmail.com', 'Albertito_23'),
        ('dukeburger2025@gmail.com', 'Angeldalma2025')
    ]
    created = []
    skipped = []
    
    for username, password in users:
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username, username, password)
            created.append(username)
        else:
            skipped.append(username)

    # 2. Setup Default Opening Hours
    hours_created = 0
    for i in range(1, 8):
        obj, created = OpeningHour.objects.get_or_create(day=i, defaults={
            'opening_time': '20:00',
            'closing_time': '00:00',
            'is_open': True
        })
        if created:
            hours_created += 1

    # 3. Setup Default Delivery Rates
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
        # Get the current max ID at start
        @sync_to_async
        def get_max_id():
            return Sale.objects.order_by('-id').first()
        
        last_seen_sale = await get_max_id()
        last_seen_id = last_seen_sale.id if last_seen_sale else 0

        while True:
            # Check for new sales
            @sync_to_async
            def get_new_sales(since_id):
                return list(Sale.objects.filter(id__gt=since_id).order_by('id'))

            new_sales = await get_new_sales(last_seen_id)
            
            for sale in new_sales:
                data = {
                    'type': 'new_order',
                    'id': sale.id,
                    'customer': sale.customer_name or 'Cliente Anonimo',
                    'total': str(sale.total_amount)
                }
                yield f"data: {json.dumps(data)}\n\n"
                last_seen_id = sale.id

            # Heartbeat & Sleep
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(5)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response
