import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import GlobalSetting

keys = ['imap_server', 'imap_user', 'imap_password']
for k in keys:
    s = GlobalSetting.objects.filter(key=k).first()
    if s:
        print(f"{k}: {s.value}")
    else:
        print(f"{k}: MISSING")
