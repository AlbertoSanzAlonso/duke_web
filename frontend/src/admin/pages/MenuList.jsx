import { useState, useEffect } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, updateMenuEntry, fetchProducts, createProduct } from '../../services/api';
import Toast from '../components/Toast';

const DEFAULT_MOCK_DATA = {
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
};

function MenuList() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null); // { message, type }

    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Burgers');

    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const menuData = await fetchMenuEntries();
            const productData = await fetchProducts();
            setEntries(menuData);
            setProducts(productData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedProductId || !price) return;
        
        try {
            await createMenuEntry({
                product_id: parseInt(selectedProductId),
                price: parseFloat(price),
                category,
                is_available: true
            });
            setPrice('');
            setSelectedProductId('');
            setToast({ message: "Producto añadido a la carta correctamente.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: "Error conectando. Verifica precio y producto.", type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres retirar este producto de LA CARTA? (Seguirá en catálogo)")) return;
        try {
            await deleteMenuEntry(id);
            setToast({ message: "Producto retirado de la carta.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleEditStart = (entry) => {
        setEditingId(entry.id);
        setEditPrice(entry.price);
    };

    const handleEditSave = async (id) => {
        try {
            if (!editPrice || isNaN(editPrice)) {
                setToast({ message: "El precio debe ser un número válido", type: 'error' });
                return;
            }
            await updateMenuEntry(id, { price: parseFloat(editPrice) });
            setEditingId(null);
            setToast({ message: "Precio actualizado correctamente.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleSyncDefaults = async () => {
        if (!window.confirm("Se añadirán los 12 productos básicos de Duke Burgers a la carta. ¿Continuar?")) return;
        setLoading(true);
        try {
            // First, check if products exist or create them
            const productsList = await fetchProducts();
            
            for (const category in DEFAULT_MOCK_DATA) {
                for (const item of DEFAULT_MOCK_DATA[category]) {
                    // Find if product already exists by name
                    let prod = productsList.find(p => p.name === item.name);
                    
                    if (!prod) {
                        prod = await createProduct({
                            name: item.name,
                            description: item.description
                        });
                    }
                    
                    // Add to menu entries
                    await createMenuEntry({
                        product_id: prod.id,
                        price: item.price,
                        category: category,
                        is_available: true
                    });
                }
            }
            setToast({ message: "¡Carta restaurada con éxito!", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: "Error sincronizando: " + err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h2>Gestión de la Carta Pública</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Elíge productos del catálogo y dales un precio de venta al público para hacerlos visibles en tu menú online.</p>

            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select 
                    value={selectedProductId} 
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    style={{ padding: '8px', flex: 2, minWidth: '200px' }}
                >
                    <option value="">-- Seleccionar producto del catálogo --</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    required
                    style={{ padding: '8px', flex: 1, minWidth: '120px' }}
                >
                    <option value="Burgers">Burgers</option>
                    <option value="Pachatas">Pachatas</option>
                    <option value="Pizzas">Pizzas</option>
                    <option value="Bebidas">Bebidas</option>
                </select>
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Precio" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    required 
                    style={{ padding: '8px', width: '100px' }}
                />
                <button type="submit" className="main-button" style={{ padding: '8px 16px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    + Añadir a la Carta
                </button>
                <button 
                  type="button" 
                  onClick={handleSyncDefaults} 
                  style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '4px', border: '1px solid #444', background: 'transparent', color: '#444', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ⚙️ Restaurar Mock Data
                </button>
            </form>

            <div style={{ marginTop: '30px' }}>
                {loading ? <p>Cargando menú...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : entries.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
                        No hay platos en la carta a la vista del público.
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {entries.map(entry => (
                            <div 
                                key={entry.id} 
                                onMouseEnter={() => setHoveredId(entry.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{ 
                                background: '#fff', 
                                border: '1px solid #ebebeb', 
                                borderRadius: '12px', 
                                overflow: 'hidden', 
                                boxShadow: hoveredId === entry.id ? '0 12px 30px rgba(0,0,0,0.1)' : '0 4px 15px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            }}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    {entry.product?.image ? (
                                        <img src={entry.product.image} alt={entry.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '0.9rem' }}>Sin Fotografía</span>
                                    )}
                                    
                                    {/* Modal Overlay for Description */}
                                    {hoveredId === entry.id && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', lineHeight: '1.5' }}>{entry.product?.description || 'Sin descripción disponible.'}</p>
                                        </div>
                                    )}

                                    {/* Inline Price Edit / View */}
                                    {editingId === entry.id ? (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', background: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2 }}>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                autoFocus
                                                value={editPrice} 
                                                onChange={e => setEditPrice(e.target.value)} 
                                                onKeyDown={e => { if(e.key === 'Enter') handleEditSave(entry.id) }}
                                                style={{ width: '70px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', outline: 'none' }} 
                                            />
                                            <button 
                                                onClick={() => handleEditSave(entry.id)} 
                                                style={{ padding: '4px 8px', background: '#222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                title="Guardar"
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                onClick={() => setEditingId(null)} 
                                                style={{ padding: '4px 8px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                title="Cancelar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => handleEditStart(entry)}
                                            title="Clic para editar precio"
                                            style={{ 
                                                position: 'absolute', top: '10px', right: '10px', 
                                                background: 'var(--admin-primary)', color: 'white', 
                                                padding: '6px 12px', borderRadius: '20px', 
                                                fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                                cursor: 'pointer', userSelect: 'none', transition: 'transform 0.1s', zIndex: 2
                                            }}
                                            onMouseOver={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                                            onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }}
                                        >
                                            ${entry.price} ✎
                                        </div>
                                    )}

                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 2 }}>
                                        {entry.category}
                                    </div>
                                </div>
                                <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#222' }}>{entry.product?.name}</h3>
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                        <button 
                                            onClick={() => handleDelete(entry.id)} 
                                            style={{ 
                                                flex: 1, padding: '10px 0', background: '#fff', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                                            }}
                                        >
                                            Retirar de Carta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MenuList;
