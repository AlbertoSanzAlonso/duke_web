import React, { useState, useEffect } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, fetchProducts } from '../../services/api';

function MenuList() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Burgers');

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
                {loading ? <p>Cargando menú...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px', width: '60px' }}>Foto</th>
                                <th style={{ padding: '10px' }}>Plato</th>
                                <th style={{ padding: '10px' }}>Categoría</th>
                                <th style={{ padding: '10px' }}>Precio</th>
                                <th style={{ padding: '10px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay platos en la carta a la vista del público.</td>
                                </tr>
                            ) : (
                                entries.map(entry => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            {entry.product?.image ? (
                                                <img src={entry.product.image} alt={entry.product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <strong>{entry.product?.name}</strong>
                                            <div style={{ fontSize: '0.8rem', color: '#777' }}>{entry.product?.description}</div>
                                        </td>
                                        <td style={{ padding: '10px' }}>{entry.category}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>${entry.price}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button onClick={() => handleDelete(entry.id)} style={{ padding: '6px 12px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retirar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MenuList;
