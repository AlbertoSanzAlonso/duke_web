from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'avatar', 'can_use_tpv', 'can_use_accounting', 
            'can_use_menu', 'can_use_inventory', 'can_use_promos', 
            'can_use_gallery', 'can_use_settings', 'can_use_kitchen',
            'can_use_webmail', 'is_admin_manager'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'password', 'avatar', 'is_staff', 'is_active', 'date_joined', 'is_superuser']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        avatar = validated_data.pop('avatar', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        profile = UserProfile.objects.create(user=user, **profile_data)
        if avatar:
            profile.avatar = avatar
            profile.save()
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        avatar = validated_data.pop('avatar', None)
        
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        
        if avatar:
            profile.avatar = avatar
        profile.save()

        if password:
            instance.set_password(password)
            
        return super().update(instance, validated_data)
