from api.models import Product, MenuEntry

MENU_DATA = {
  'Burgers': [
    { 'name': 'Duke', 'description': 'Nuestra firma. Doble carne, cheddar, cebolla caramelizada.', 'price': 12900 },
    { 'name': 'Marqués', 'description': 'Para los que saben. Queso de cabra, miel y nueces.', 'price': 13500 },
    { 'name': 'Conde', 'description': 'Elegancia pura. Boletus, aceite de trufa y parmesano.', 'price': 14200 },
    { 'name': 'Plebeyo', 'description': 'La de toda la vida. Lechuga, tomate, cebolla y pepinillo.', 'price': 10900 },
  ],
  'Pachatas': [
    { 'name': 'Provolone', 'description': 'Queso provolone fundido y chimichurri.', 'price': 9500 },
    { 'name': 'BBQ', 'description': 'Salsa barbacoa casera y cebolla frita.', 'price': 9500 },
    { 'name': 'Completa', 'description': 'Jamón, queso, huevo y ensalada.', 'price': 11000 },
    { 'name': 'Especial', 'description': 'Nuestra mezcla secreta de la casa.', 'price': 11500 },
  ],
  'Pizzas': [
    { 'name': 'Mozzarella', 'description': 'Tomate, mozzarella e orégano.', 'price': 9000 },
    { 'name': 'Especial', 'description': 'Jamón York, champiñones y pimiento.', 'price': 11500 },
    { 'name': 'Napolitana', 'description': 'Anchoas, aceitunas negras y alcaparras.', 'price': 12000 },
    { 'name': '4 Quesos', 'description': 'Mozzarella, gorgonzola, parmesano y emmental.', 'price': 13000 },
  ],
}

print("Iniciando población de base de datos...")

for category, items in MENU_DATA.items():
    for item in items:
        # Create or update Product
        product, created = Product.objects.get_or_create(
            name=item['name'],
            defaults={'description': item['description']}
        )
        
        # Create or update MenuEntry
        entry, entry_created = MenuEntry.objects.get_or_create(
            product=product,
            category=category,
            defaults={'price': item['price']}
        )
        
        if entry_created:
            print(f"Creado: {item['name']} en {category} por ${item['price']}")
        else:
            # Update price if it already existed
            entry.price = item['price']
            entry.category = category
            entry.save()
            print(f"Actualizado: {item['name']} - ${item['price']}")

print("Proceso completado.")
