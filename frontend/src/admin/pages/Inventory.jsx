import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem } from '../../services/api';

function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            // Clear form
            setName('');
            setCategory('');
            setNewCategory('');
            setShowNewCategoryInput(false);
            setQuantity('');
            setMinStock('0');
            // Reload list
            loadInventory();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrarlo del inventario?")) return;
        try {
            await deleteInventoryItem(id);
            loadInventory();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-card">
            <h2>Inventario de Almacén</h2>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Nombre del ingrediente" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    style={{ padding: '8px', flex: 1, minWidth: '150px' }}
                />
                
                {showNewCategoryInput ? (
                    <div style={{ display: 'flex', gap: '5px', flex: 1, minWidth: '150px' }}>
                        <input 
                            type="text" 
                            placeholder="Nueva categoría" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                            required
                            style={{ padding: '8px', width: '100%' }}
                        />
                        <button type="button" onClick={() => setShowNewCategoryInput(false)} style={{ padding: '0 8px' }}>×</button>
                    </div>
                ) : (
                    <select 
                        value={category} 
                        onChange={e => {
                            if (e.target.value === 'NEW') {
                                setShowNewCategoryInput(true);
                            } else {
                                setCategory(e.target.value);
                            }
                        }}
                        style={{ padding: '8px', flex: 1, minWidth: '150px' }}
                    >
                        <option value="">Seleccionar Categoría</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>+ Añadir nueva...</option>
                    </select>
                )}

                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Stock Actual" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    required 
                    style={{ padding: '8px', width: '100px' }}
                />
                <select value={unit} onChange={e => setUnit(e.target.value)} style={{ padding: '8px' }}>
                    <option value="unidades">Unidades</option>
                    <option value="kg">Kilogramos</option>
                    <option value="g">Gramos</option>
                    <option value="litros">Litros</option>
                    <option value="cajas">Cajas</option>
                </select>
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Stock mínimo" 
                    value={minStock} 
                    onChange={e => setMinStock(e.target.value)} 
                    style={{ padding: '8px', width: '100px' }}
                />
                <button type="submit" className="main-button" style={{ padding: '8px 16px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Registrar
                </button>
            </form>

            <div style={{ marginTop: '30px' }}>
                {loading ? <p>Cargando inventario...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Artículo</th>
                                <th style={{ padding: '10px' }}>Categoría</th>
                                <th style={{ padding: '10px' }}>Stock</th>
                                <th style={{ padding: '10px' }}>Umbral (Min)</th>
                                <th style={{ padding: '10px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en el inventario.</td>
                                </tr>
                            ) : (
                                items.map(item => {
                                    const outOfStock = parseFloat(item.quantity) <= parseFloat(item.min_stock);
                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: outOfStock ? '#fff5f5' : 'transparent' }}>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{item.name}</strong>
                                                {outOfStock && <span style={{ marginLeft: '10px', color: 'red', fontSize: '10px', background: '#ffe3e3', padding: '2px 4px', borderRadius: '3px'}}>BAJO STOCK</span>}
                                            </td>
                                            <td style={{ padding: '10px', color: '#666' }}>{item.category || '-'}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.quantity} {item.unit}</td>
                                            <td style={{ padding: '10px' }}>{item.min_stock}</td>
                                            <td style={{ padding: '10px' }}>
                                                <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
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
