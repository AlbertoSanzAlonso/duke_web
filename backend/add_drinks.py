
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Product, MenuEntry

def add_drinks():
    drinks = [
        {"name": "Coca-Cola 500ml", "description": "Gaseosa clásica.", "price": 2500},
        {"name": "Cerveza Quilmes", "description": "Lata 473ml.", "price": 3200},
        {"name": "Agua Mineral", "description": "Con o sin gas.", "price": 1800},
        {"name": "Sprite 500ml", "description": "Gaseosa de lima-limón.", "price": 2500},
    ]

    for drink in drinks:
        prod, created = Product.objects.get_or_create(
            name=drink['name'],
            defaults={'description': drink['description']}
        )
        MenuEntry.objects.get_or_create(
            product=prod,
            category="Bebidas",
            defaults={'price': drink['price'], 'is_available': True}
        )
        print(f"Bebida '{drink['name']}' añadida/verificada.")

if __name__ == "__main__":
    add_drinks()
