from rest_framework import viewsets, permissions, parsers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.core import management

from ..models import UserProfile, ActionLog, log_action, GlobalSetting, OpeningHour, DeliverySetting
from ..serializers import UserSerializer, ActionLogSerializer
from ..permissions import IsAdminManager

@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def MeView(request):
    user = request.user
    if request.method == 'GET':
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
    permission_classes = [permissions.IsAuthenticated]

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def AdminSetupView(request):
    """Setup inicial de administradores y configuraciones por defecto."""
    try:
        management.call_command('migrate', interactive=False)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
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

    users_to_setup = [
        ('albertosanzdev@gmail.com', 'Albertito_23'),
        ('dukeburger2025@gmail.com', 'Angeldalma2025')
    ]
    
    for username, password in users_to_setup:
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_superuser(username, username, password)
        else:
            u = User.objects.get(username=username)
        
        profile, _ = UserProfile.objects.get_or_create(user=u)
        profile.is_admin_manager = True
        profile.save()

    # Default settings setup
    for i in range(1, 8):
        OpeningHour.objects.get_or_create(day=i, defaults={'opening_time': '20:00', 'closing_time': '00:00', 'is_open': True})
    
    DeliverySetting.objects.get_or_create(id=1, defaults={'base_price': 1000, 'km_price': 200, 'max_km': 15})
    
    return Response({'status': 'Success', 'message': 'Admin accounts and initial configuration are ready.'})

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
        reset_url = f"{settings.ALLOWED_HOSTS[0]}/reset-password/{uid}/{token}"
        message = f"Hola {user.username},\n\nPara restablecer tu contraseña en Duke Burger, haz clic en: {reset_url}"
        
        send_mail('Restablecer Contraseña - Duke Burger', message, settings.DEFAULT_FROM_EMAIL, [email])
        
    return Response({'message': 'Si el email está registrado, recibirás un enlace pronto.'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def PasswordResetConfirmView(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except:
        return Response({'error': 'Enlace inválido'}, status=400)
    
    if default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Contraseña actualizada con éxito.'})
    return Response({'error': 'Token inválido o expirado'}, status=400)
