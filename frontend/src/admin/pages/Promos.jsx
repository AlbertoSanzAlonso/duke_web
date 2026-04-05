import { useState, useEffect } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, updateMenuEntry, fetchProducts } from '../../services/api';
import Toast from '../components/Toast';
import { Star } from 'lucide-react';

function Promos() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    
    // Fixed category for this page
    const category = 'Promos';

    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const menuData = await fetchMenuEntries();
            const productData = await fetchProducts();
            // Filter only Promos for this view
            const promoEntries = menuData.filter(e => e.category === 'Promos');
            setEntries(promoEntries);
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
            setToast({ message: "Promoción añadida correctamente.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: "Error al crear la promoción.", type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Retirar esta promoción de la web?")) return;
        try {
            await deleteMenuEntry(id);
            setToast({ message: "Promoción retirada.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleEditSave = async (id) => {
        try {
            await updateMenuEntry(id, { price: parseFloat(editPrice) });
            setEditingId(null);
            setToast({ message: "Precio de promo actualizado.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <Star size={32} color="var(--admin-primary)" fill="var(--admin-primary)" />
                <h2 style={{ margin: 0 }}>Gestión de Promociones</h2>
            </div>
            <p style={{ color: '#666', marginBottom: '30px' }}>Crea combos o promociones especiales. Estos productos aparecerán destacados en la sección PROMOS de la web.</p>

            <form onSubmit={handleCreate} style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '30px', 
                padding: '20px', 
                background: '#fff5f5', 
                borderRadius: '12px',
                border: '1px dashed var(--admin-primary)',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>PRODUCTO DEL CATÁLOGO</label>
                    <select 
                        value={selectedProductId} 
                        onChange={e => setSelectedProductId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        <option value="">-- Seleccionar --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ width: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>PRECIO PROMO ($)</label>
                    <input 
                        type="number" 
                        step="1"
                        placeholder="Ej: 5000" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ 
                    marginTop: '20px',
                    padding: '12px 25px', 
                    background: 'var(--admin-primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: 'bold',
                    cursor: 'pointer' 
                }}>
                    + PUBLICAR PROMO
                </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? <p>Cargando promos...</p> : entries.length === 0 ? (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>No hay promociones activas actualmente.</p>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} style={{ 
                            background: 'white', 
                            borderRadius: '12px', 
                            border: '1px solid #eee',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                             <div style={{ height: '150px', background: '#eee', position: 'relative' }}>
                                {entry.product?.image ? (
                                    <img src={entry.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎁</div>}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--admin-primary)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    ${parseInt(entry.price).toLocaleString('es-AR')}
                                </div>
                             </div>
                             <div style={{ padding: '15px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>{entry.product?.name}</h3>
                                <button 
                                    onClick={() => handleDelete(entry.id)}
                                    style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '6px', fontWeight: 'bold' }}
                                >
                                    Eliminar Promo
                                </button>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Promos;
