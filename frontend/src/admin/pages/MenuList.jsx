import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, updateMenuEntry, fetchProducts } from '../../services/api';
import Toast from '../components/Toast';

function MenuList() {
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Burgers');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');

    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [hoveredId, setHoveredId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // entry id

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
        setConfirmDelete(id);
    };

    const executeDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteMenuEntry(confirmDelete);
            setToast({ message: "Producto retirado de la carta.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setConfirmDelete(null);
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

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Modal de Confirmación Premium */}
            {confirmDelete && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ color: '#f03e3e', fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '800' }}>¿RETIRAR DE LA CARTA?</h3>
                            <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '25px', fontSize: '0.95rem' }}>
                                El producto dejará de ser visible para los clientes en la web, 
                                pero <strong style={{ color: '#333' }}>seguirá existiendo en tu catálogo</strong> de productos para usarlo después.
                            </p>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={() => setConfirmDelete(null)} style={cancelBtnStyle}>CANCELAR</button>
                                <button onClick={executeDelete} style={confirmBtnStyle}>SÍ, RETIRAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2>Gestión de la Carta Pública</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Elíge productos del catálogo y dales un precio de venta al público para hacerlos visibles en tu menú online.</p>
                
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar en la carta..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%' }}
                    />
                </div>
            </div>

            <form onSubmit={handleCreate} style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '30px', 
                flexWrap: 'wrap', 
                alignItems: 'center',
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid #eee'
            }}>
                <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    style={{ ...formFieldStyle, flex: 2, minWidth: '220px' }}
                >
                    <option value="" style={{ color: '#000' }}>-- Seleccionar producto del catálogo --</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.name}</option>
                    ))}
                </select>
                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                    style={{ ...formFieldStyle, flex: 1, minWidth: '130px' }}
                >
                    <option value="Burgers" style={{ color: '#000' }}>Burgers</option>
                    <option value="Pachatas" style={{ color: '#000' }}>Pachatas</option>
                    <option value="Pizzas" style={{ color: '#000' }}>Pizzas</option>
                    <option value="Bebidas" style={{ color: '#000' }}>Bebidas</option>
                    <option value="Promos" style={{ color: '#000' }}>Promos</option>
                </select>
                <div style={{ position: 'relative', width: '130px' }}>
                    <span style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        fontWeight: 'bold', 
                        color: '#333',
                        pointerEvents: 'none' 
                    }}>$</span>
                    <input
                        type="number"
                        step="100"
                        min="0"
                        className="no-arrows-input"
                        placeholder="Precio"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required
                        style={{ ...formFieldStyle, width: '100%', paddingLeft: '35px', fontWeight: 'bold' }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ 
                    ...formFieldStyle,
                    padding: '0 25px', 
                    background: 'var(--admin-primary)', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    width: 'auto',
                    minWidth: '180px',
                    boxShadow: '0 4px 12px rgba(240, 62, 62, 0.2)'
                }}>
                    + AÑADIR A LA CARTA
                </button>
            </form>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {["Todas", "Burgers", "Pachatas", "Pizzas", "Bebidas", "Promos"].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                background: filterCategory === cat ? 'var(--admin-primary)' : '#f1f3f5',
                                color: filterCategory === cat ? 'white' : '#495057',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar en la carta..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...formFieldStyle, width: '100%', paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div style={{ marginTop: '10px' }}>
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
                        {entries.filter(entry => {
                            const matchesSearch = (entry.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  (entry.category || "").toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesCategory = filterCategory === 'Todas' || entry.category === filterCategory;
                            return matchesSearch && matchesCategory;
                        }).map(entry => (
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
                                                step="100"
                                                min="0"
                                                className="no-arrows-input"
                                                autoFocus
                                                value={editPrice}
                                                onChange={e => setEditPrice(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleEditSave(entry.id) }}
                                                style={{ width: '90px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', outline: 'none' }}
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
                                            ${parseInt(entry.price).toLocaleString('es-AR')} ✎
                                        </div>
                                    )}

                                    <div className="badge-text-white" style={{ position: 'absolute', top: '10px', left: '10px', background: '#333', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 2, fontWeight: 'bold' }}>
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

// Styles Locales
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    padding: '20px',
    backdropFilter: 'blur(5px)'
};

const modalStyle = {
    background: '#fff',
    width: '100%',
    maxWidth: '450px',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
    animation: 'modalFadeUp 0.3s ease-out'
};

const formFieldStyle = {
    height: '48px',
    padding: '0 15px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    color: '#333',
    display: 'flex',
    alignItems: 'center'
};

const cancelBtnStyle = {
    flex: 1,
    padding: '14px',
    background: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: '#495057',
    fontFamily: "'Montserrat', sans-serif"
};

const confirmBtnStyle = {
    flex: 1,
    padding: '14px',
    background: '#f03e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(240, 62, 62, 0.3)',
    fontFamily: "'Montserrat', sans-serif"
};

export default MenuList;
