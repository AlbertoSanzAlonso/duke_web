import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

print(f"IMAP_SERVER: {getattr(settings, 'IMAP_SERVER', 'UNDEFINED')}")
print(f"IMAP_USER: {getattr(settings, 'IMAP_USER', 'UNDEFINED')}")
print(f"IMAP_PASSWORD_SET: {len(getattr(settings, 'IMAP_PASSWORD', '')) > 0}")
