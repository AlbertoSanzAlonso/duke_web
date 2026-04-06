import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem } from '../../services/api';
import Toast from '../components/Toast';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Edit state
    const [editingItemId, setEditingItemId] = useState(null);
    const [editQuantity, setEditQuantity] = useState('');

    // Form inputs state
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('unidades');
    const [minStock, setMinStock] = useState('0');

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategory, setNewCategory] = useState('');

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
        const finalCategory = showNewCategoryInput ? newCategory : category;
        if (!name || (showNewCategoryInput && !newCategory)) return;
        
        try {
            await createInventoryItem({
                name,
                category: finalCategory,
                quantity: parseFloat(quantity) || 0,
                unit,
                min_stock: parseFloat(minStock) || 0
            });
            setName('');
            setCategory('');
            setNewCategory('');
            setShowNewCategoryInput(false);
            setQuantity('');
            setMinStock('0');
            loadInventory();
            setToast({ message: "Artículo añadido al inventario", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleUpdateQuantity = async (id) => {
        if (!editQuantity || isNaN(editQuantity)) return;
        try {
            await updateInventoryItem(id, { quantity: parseFloat(editQuantity) });
            setEditingItemId(null);
            setEditQuantity('');
            loadInventory();
            setToast({ message: "Stock actualizado con éxito", type: 'success' });
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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Inventario de Almacén
            </h2>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>NUEVO ARTÍCULO</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Tomate, Carne..." 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                </div>
                
                <div style={{ minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>CATEGORÍA</label>
                    {!showNewCategoryInput ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setShowNewCategoryInput(true)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>+</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input 
                                type="text" 
                                placeholder="Nueva categoría" 
                                value={newCategory} 
                                onChange={e => setNewCategory(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                            />
                            <button type="button" onClick={() => setShowNewCategoryInput(false)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>X</button>
                        </div>
                    )}
                </div>

                <div style={{ width: '100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>INICIAL</label>
                    <input 
                        type="number" 
                        step="any" 
                        placeholder="Cantidad" 
                        value={quantity} 
                        onChange={e => setQuantity(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ width: '100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>UNIDAD</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <option value="unidades">Unidades</option>
                        <option value="kg">KG</option>
                        <option value="litros">Litros</option>
                        <option value="packs">Packs</option>
                        <option value="cajas">Cajas</option>
                    </select>
                </div>

                <div style={{ width: '100px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>MÍNIMO</label>
                    <input 
                        type="number" 
                        step="any" 
                        value={minStock} 
                        onChange={e => setMinStock(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                </div>

                <button type="submit" className="main-button" style={{ padding: '12px 24px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-end', fontWeight: 'bold' }}>
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
                                <th style={{ padding: '15px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en el inventario.</td>
                                </tr>
                            ) : (
                                items.map(item => {
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
                                                            value={editQuantity} 
                                                            onChange={e => setEditQuantity(e.target.value)} 
                                                            style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                            autoFocus
                                                        />
                                                        <span>{item.unit}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontWeight: 'bold' }}>{item.quantity} {item.unit}</span>
                                                )}
                                            </td>
                                            <td data-label="Acciones">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {isEditing ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateQuantity(item.id)} 
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
