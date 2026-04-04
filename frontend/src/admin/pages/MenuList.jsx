import React, { useState, useEffect } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, updateMenuEntry, fetchProducts } from '../../services/api';

function MenuList() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Burgers');

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
            loadData();
        } catch (err) {
            alert("Probablemente haya un error conectando. Asegúrate de añadir precio y escoger producto.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres retirar este producto de LA CARTA? (Seguirá en catálogo)")) return;
        try {
            await deleteMenuEntry(id);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditStart = (entry) => {
        setEditingId(entry.id);
        setEditPrice(entry.price);
    };

    const handleEditSave = async (id) => {
        try {
            if (!editPrice || isNaN(editPrice)) return alert("El precio debe ser un número válido");
            await updateMenuEntry(id, { price: parseFloat(editPrice) });
            setEditingId(null);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-card">
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
                            <div key={entry.id} style={{ 
                                background: '#fff', 
                                border: '1px solid #ebebeb', 
                                borderRadius: '12px', 
                                overflow: 'hidden', 
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    {entry.product?.image ? (
                                        <img src={entry.product.image} alt={entry.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '0.9rem' }}>Sin Fotografía</span>
                                    )}
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--admin-primary)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                                        ${entry.price}
                                    </div>
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        {entry.category}
                                    </div>
                                </div>
                                <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#222' }}>{entry.product?.name}</h3>
                                    <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.95rem', lineHeight: '1.4', flex: '1' }}>{entry.product?.description}</p>
                                    
                                    {editingId === entry.id ? (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                value={editPrice} 
                                                onChange={e => setEditPrice(e.target.value)} 
                                                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold' }} 
                                            />
                                            <button 
                                                onClick={() => handleEditSave(entry.id)} 
                                                style={{ padding: '8px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                onClick={() => setEditingId(null)} 
                                                style={{ padding: '8px 12px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => handleEditStart(entry)} 
                                                style={{ 
                                                    flex: 1, padding: '10px 0', background: '#fff', border: '1px solid var(--admin-primary)', color: 'var(--admin-primary)', 
                                                    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                                                }}
                                            >
                                                Cambiar Precio
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(entry.id)} 
                                                style={{ 
                                                    flex: 1, padding: '10px 0', background: '#fff', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                                                }}
                                            >
                                                Retirar
                                            </button>
                                        </div>
                                    )}
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
