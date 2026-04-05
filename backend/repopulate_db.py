from api.models import Product, MenuEntry

# Limpiar tabla para evitar duplicados extraños
MenuEntry.objects.all().delete()
Product.objects.all().delete()

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
    { 'name': 'Mozzarella', 'description': 'Tomate, mozzarella y orégano.', 'price': 9000 },
    { 'name': 'Especial', 'description': 'Jamón York, champiñones y pimiento.', 'price': 11500 },
    { 'name': 'Napolitana', 'description': 'Anchoas, aceitunas negras y alcaparras.', 'price': 12000 },
    { 'name': '4 Quesos', 'description': 'Mozzarella, gorgonzola, parmesano y emmental.', 'price': 13000 },
  ],
}

print("Poblando base de datos con datos mockeados oficiales...")

for category, items in MENU_DATA.items():
    for item in items:
        product = Product.objects.create(
            name=item['name'],
            description=item['description']
        )
        
        entry = MenuEntry.objects.create(
            product=product,
            category=category,
            price=item['price'],
            is_available=True
        )
        print(f"[OK] {product.name} (${entry.price})")

print(f"Total entries: {MenuEntry.objects.count()}")
