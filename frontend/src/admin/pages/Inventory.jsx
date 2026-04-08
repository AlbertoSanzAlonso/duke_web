import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem } from '../../services/api';
import Toast from '../components/Toast';
import { Edit2, Save, X, Trash2, Search } from 'lucide-react';
import './Accounting.css';

function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit state
    const [editingItemId, setEditingItemId] = useState(null);
    const [editQuantity, setEditQuantity] = useState('');
    const [editMinStock, setEditMinStock] = useState('');

    // Form inputs state
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('unidades');
    const [minStock, setMinStock] = useState('0');

    const defaultCategories = ['Carne', 'Verdura', 'Quesos', 'Pan', 'Bebidas', 'Salsas', 'Desechables'];
    const existingCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
    const categories = [...new Set([...defaultCategories, ...existingCategories])];

    useEffect(() => {
        loadInventory();

        const handleRefresh = () => {
            console.log("Real-time: Data update detected, refreshing inventory...");
            loadInventory();
        };

        window.addEventListener('new-order-received', handleRefresh);
        return () => window.removeEventListener('new-order-received', handleRefresh);
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await fetchInventory();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name || !category) return;
        
        try {
            await createInventoryItem({
                name,
                category,
                quantity: parseFloat(quantity) || 0,
                unit,
                min_stock: parseFloat(minStock) || 0
            });
            setName('');
            setCategory('');
            setQuantity('');
            setMinStock('0');
            loadInventory();
            setToast({ message: "Artículo añadido al inventario", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleUpdateRow = async (id) => {
        try {
            await updateInventoryItem(id, { 
                quantity: parseFloat(editQuantity) || 0,
                min_stock: parseFloat(editMinStock) || 0 
            });
            setEditingItemId(null);
            setEditQuantity('');
            setEditMinStock('');
            loadInventory();
            setToast({ message: "Item actualizado con éxito", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrarlo del inventario?")) return;
        try {
            await deleteInventoryItem(id);
            loadInventory();
            setToast({ message: "Artículo eliminado", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Inventario de Almacén</h2>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar artículo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%', background: '#fff' }}
                    />
                </div>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'flex-end', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>NUEVO ARTÍCULO</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Tomate, Carne..." 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>
                
                <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>CATEGORÍA</label>
                    <input 
                        list="inventory-categories"
                        placeholder="Elegir o escribir..."
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                    <datalist id="inventory-categories">
                        {categories.map(cat => (
                            <option key={cat} value={cat} />
                        ))}
                    </datalist>
                </div>

                <div style={{ flex: '1 1 100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>INICIAL</label>
                    <input 
                        type="number" 
                        step="any" 
                        placeholder="Cantidad" 
                        value={quantity} 
                        onChange={e => setQuantity(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ flex: '1 1 100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>UNIDAD</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                        <option value="unidades">Unidades</option>
                        <option value="kg">KG</option>
                        <option value="litros">Litros</option>
                        <option value="packs">Packs</option>
                        <option value="cajas">Cajas</option>
                    </select>
                </div>

                <div style={{ flex: '1 1 100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>MÍNIMO</label>
                    <input 
                        type="number" 
                        step="any" 
                        value={minStock} 
                        onChange={e => setMinStock(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                <button type="submit" className="main-button" style={{ 
                    flex: '1 1 150px', 
                    padding: '12px 24px', 
                    background: 'var(--admin-primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    REGISTRAR
                </button>
            </form>

            <div className="accounting-table-container">
                {loading ? <p>Cargando inventario...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table className="accounting-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '15px' }}>Artículo</th>
                                <th style={{ padding: '15px' }}>Categoría</th>
                                <th style={{ padding: '15px' }}>Stock Actual</th>
                                <th style={{ padding: '15px' }}>Mínimo</th>
                                <th style={{ padding: '15px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en el inventario.</td>
                                </tr>
                            ) : (
                                items.filter(item => 
                                    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(item => {
                                    const outOfStock = parseFloat(item.quantity) <= parseFloat(item.min_stock);
                                    const isEditing = editingItemId === item.id;
                                    
                                    return (
                                        <tr key={item.id} style={{ backgroundColor: outOfStock ? '#fff5f5' : 'transparent' }}>
                                            <td data-label="Artículo">
                                                <strong>{item.name}</strong>
                                                {outOfStock && <span style={{ marginLeft: '10px', color: 'white', fontSize: '9px', background: '#e03131', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'}}>BAJO STOCK</span>}
                                            </td>
                                            <td data-label="Categoría" style={{ color: '#666' }}>{item.category || '-'}</td>
                                            <td data-label="Stock Actual">
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        <input 
                                                            type="number" 
                                                            step="any"
                                                            value={editQuantity} 
                                                            onChange={e => setEditQuantity(e.target.value)} 
                                                            style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                            autoFocus
                                                        />
                                                        <span style={{ fontSize: '0.8rem' }}>{item.unit}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontWeight: 'bold' }}>{item.quantity} {item.unit}</span>
                                                )}
                                            </td>
                                            <td data-label="Mínimo">
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={editMinStock} 
                                                        onChange={e => setEditMinStock(e.target.value)} 
                                                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                    />
                                                ) : (
                                                    <span style={{ color: '#888' }}>{item.min_stock} {item.unit}</span>
                                                )}
                                            </td>
                                            <td data-label="Acciones">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {isEditing ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateRow(item.id)} 
                                                                style={{ padding: '6px', background: '#2f9e44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Guardar"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingItemId(null)} 
                                                                style={{ padding: '6px', background: '#868e96', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Cancelar"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingItemId(item.id);
                                                                    setEditQuantity(item.quantity);
                                                                    setEditMinStock(item.min_stock);
                                                                }} 
                                                                style={{ padding: '6px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Editar Stock"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(item.id)} 
                                                                style={{ padding: '6px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Inventory;
