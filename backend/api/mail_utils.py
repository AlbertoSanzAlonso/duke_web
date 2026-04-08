import imaplib
import socket
from django.core.cache import cache

def get_unread_mail_count(server, user, password, port=993):
    """
    Checks unread mail count from an IMAP server.
    Uses caching to avoid saturating the mail server.
    """
    cache_key = f'mail_unread_{user}'
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return cached_val

    if not all([server, user, password]):
        return 0

    try:
        # Use SSL for security
        mail = imaplib.IMAP4_SSL(server, port, timeout=10)
        mail.login(user, password)
        mail.select("INBOX", readonly=True)
        status, response = mail.search(None, 'UNSEEN')
        
        unread_count = 0
        if status == 'OK':
            # response[0] contains a space-separated list of message IDs
            ids = response[0].split()
            unread_count = len(ids)
            
        mail.logout()
        
        # Cache for 2 minutes to keep dashboard snappy but not overwhelm mail server
        cache.set(cache_key, unread_count, 120) 
        return unread_count
    except (imaplib.IMAP4.error, socket.timeout, Exception) as e:
        print(f"IMAP Error for {user}: {e}")
        return -1 # Indicator of error
