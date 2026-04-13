import os
from django.db import models
from django.contrib.auth.models import User
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.FileField(upload_to='avatars/', null=True, blank=True)
    
    can_use_tpv = models.BooleanField(default=False)
    can_use_accounting = models.BooleanField(default=False)
    can_use_menu = models.BooleanField(default=False)
    can_use_inventory = models.BooleanField(default=False)
    can_use_promos = models.BooleanField(default=False)
    can_use_gallery = models.BooleanField(default=False)
    can_use_settings = models.BooleanField(default=False)
    can_use_kitchen = models.BooleanField(default=False)
    can_use_webmail = models.BooleanField(default=False)
    is_admin_manager = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.avatar:
            name, extension = os.path.splitext(self.avatar.name)
            if extension.lower() != '.webp':
                try:
                    im = Image.open(self.avatar)
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGBA")
                    else:
                        im = im.convert("RGB")
                    
                    output = BytesIO()
                    im.save(output, format='WEBP', quality=80)
                    output.seek(0)
                    
                    safe_name = "".join([c if (c.isalnum() or c in ("_", "-")) else "_" for c in name])
                    self.avatar = ContentFile(output.read(), name=f"{safe_name}.webp")
                except Exception as e:
                    print(f"Error processing avatar {name}: {e}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil de {self.user.username}"
