import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem, fetchInventoryMovements } from '../../services/api';
import Toast from '../components/Toast';
import { Edit2, Save, X, Trash2, Search, Download, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import './Accounting.css';

function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

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
    
    // Pack state
    const [hasPack, setHasPack] = useState(false);
    const [packName, setPackName] = useState('cajas');
    const [unitsPerPack, setUnitsPerPack] = useState('10');

    const defaultCategories = ['Carne', 'Verdura', 'Quesos', 'Pan', 'Bebidas', 'Salsas', 'Desechables'];
    const existingCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
    const categories = [...new Set([...defaultCategories, ...existingCategories])];

    useEffect(() => {
        loadInventory();

        const handleRefresh = () => {
            console.log("Real-time: Data update detected, refreshing inventory...");
            loadInventory(true); // silent=true: no flash
        };

        window.addEventListener('new-order-received', handleRefresh);
        return () => window.removeEventListener('new-order-received', handleRefresh);
    }, []);

    const loadInventory = async (silent = false) => {
        try {
            if (!silent) { setLoading(true); setLoadingMovements(true); }
            const [data, movs] = await Promise.all([
                fetchInventory(),
                fetchInventoryMovements(7) // fetch last 7 days by default to keep it lightweight
            ]);
            setItems(data);
            setMovements(movs);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!silent) { setLoading(false); setLoadingMovements(false); }
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
                pack_name: hasPack ? packName : null,
                units_per_pack: hasPack ? (parseFloat(unitsPerPack) || 1) : 1,
                min_stock: parseFloat(minStock) || 0
            });
            setName('');
            setCategory('');
            setQuantity('');
            setMinStock('0');
            setHasPack(false);
            setPackName('cajas');
            setUnitsPerPack('10');
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

    const handleExportExcel = () => {
        const filtered = items.filter(item => 
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        const data = filtered.map(item => ({
            Artículo: item.name,
            Categoría: item.category || '-',
            Stock: `${item.quantity} ${item.unit}`,
            Stock_Mínimo: `${item.min_stock} ${item.unit}`,
            Estado: parseFloat(item.quantity) <= parseFloat(item.min_stock) ? 'BAJO STOCK' : 'OK'
        }));
        exportToExcel(data, `Inventario_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const filtered = items.filter(item => 
            (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        const columns = [
            { header: 'Artículo', dataKey: 'Art' },
            { header: 'Categoría', dataKey: 'Cat' },
            { header: 'Stock Actual', dataKey: 'Stock' },
            { header: 'Stock Mínimo', dataKey: 'Min' }
        ];
        const data = filtered.map(item => ({
            Art: item.name,
            Cat: item.category || '-',
            Stock: `${item.quantity} ${item.unit}`,
            Min: `${item.min_stock} ${item.unit}`
        }));
        const lowStockCount = filtered.filter(i => parseFloat(i.quantity) <= parseFloat(i.min_stock)).length;
        exportToPDF(data, columns, `Inventario_${new Date().toISOString().split('T')[0]}`, 'Reporte de Inventario de Almacén', { label: 'Artículos con Bajo Stock', value: lowStockCount });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="accounting-header-main" style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Inventario de Almacén</h2>
                <div className="header-controls">
                    <div className="controls-row">
                        <div className="search-bar" style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar artículo..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%', background: '#fff' }}
                            />
                        </div>
                        <div className="export-actions">
                            <button onClick={handleExportExcel} className="export-btn excel" title="Excel"><Download size={20} /></button>
                            <button onClick={handleExportPDF} className="export-btn pdf" title="PDF"><FileText size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexDirection: 'column', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>NUEVO ARTÍCULO</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Tomate, Carne..." 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '0.9rem', height: '38px' }}
                        />
                    </div>
                    
                    <div style={{ flex: '1 1 180px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>CATEGORÍA</label>
                        <input 
                            list="inventory-categories"
                            placeholder="Elegir o escribir..."
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '0.9rem', height: '38px' }}
                        />
                        <datalist id="inventory-categories">
                            {categories.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Inicial (En Uds/Base)</label>
                        <input 
                            type="number" 
                            step="any" 
                            placeholder="Cant." 
                            value={quantity} 
                            onChange={e => setQuantity(e.target.value)} 
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '0.95rem', textAlign: 'center', fontWeight: '800', height: '38px' }}
                        />
                    </div>

                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>UNIDAD BASE</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '0 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '0.9rem', height: '38px' }}>
                            <option value="unidades">Unidades</option>
                            <option value="kg">KG</option>
                            <option value="litros">Litros</option>
                        </select>
                    </div>

                    <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>MÍNIMO (En Uds/Base)</label>
                        <input 
                            type="number" 
                            step="any" 
                            value={minStock} 
                            onChange={e => setMinStock(e.target.value)} 
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '0.95rem', textAlign: 'center', fontWeight: '800', height: '38px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaeaea', marginTop: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                        <input type="checkbox" checked={hasPack} onChange={e => setHasPack(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                        ¿Este artículo llega agrupado en cajas o packs?
                    </label>

                    {hasPack && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginLeft: 'auto' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '2px', color: '#666' }}>TIPO DE ENVASE</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Cajas, Packs..." 
                                    value={packName} 
                                    onChange={e => setPackName(e.target.value)}
                                    style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>Cada {packName || 'pack'} trae:</span>
                                <input 
                                    type="number" 
                                    step="any" 
                                    value={unitsPerPack} 
                                    onChange={e => setUnitsPerPack(e.target.value)}
                                    style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}
                                />
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>{unit}</span>
                            </div>
                        </div>
                    )}
                </div>

                <button type="submit" className="main-button" style={{ 
                    padding: '12px 24px', 
                    background: 'var(--admin-primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '900',
                    fontSize: '0.8rem',
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease',
                    marginTop: '5px',
                    alignSelf: 'flex-end'
                }}>
                    AÑADIR AL INVENTARIO
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
                                    
                                    // PACK DISPLAY LOGIC
                                    const qty = parseFloat(item.quantity) || 0;
                                    const upp = parseFloat(item.units_per_pack) || 1;
                                    let stockDisplay;
                                    let hasPacks = false;
                                    if (item.pack_name && upp > 1) {
                                        hasPacks = true;
                                        const wholePacks = Math.floor(qty / upp);
                                        const remainder = qty % upp;
                                        if (wholePacks > 0 && remainder > 0) {
                                            stockDisplay = `${wholePacks} ${item.pack_name} + ${Number.isInteger(remainder) ? remainder : remainder.toFixed(2)} ${item.unit}`;
                                        } else if (wholePacks > 0) {
                                            stockDisplay = `${wholePacks} ${item.pack_name}`;
                                        } else {
                                            stockDisplay = `${Number.isInteger(qty) ? qty : qty.toFixed(2)} ${item.unit}`;
                                        }
                                    } else {
                                        stockDisplay = `${Number.isInteger(qty) ? qty : qty.toFixed(2)} ${item.unit}`;
                                    }

                                    return (
                                        <tr key={item.id} style={{ backgroundColor: outOfStock ? '#fff5f5' : 'transparent' }}>
                                            <td data-label="Artículo">
                                                <strong>{item.name}</strong>
                                                {outOfStock && <span style={{ marginLeft: '10px', color: 'white', fontSize: '9px', background: '#e03131', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'}}>BAJO STOCK</span>}
                                                {hasPacks && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Empaque: {upp} {item.unit} / {item.pack_name}</div>}
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
                                                            style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-primary)', outline: 'none', fontWeight: '800', fontSize: '1.1rem', textAlign: 'center', fontFamily: 'inherit' }}
                                                            autoFocus
                                                        />
                                                        <span style={{ fontSize: '0.8rem' }}>{item.unit} (base)</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontWeight: 'bold', color: hasPacks ? '#4c6ef5' : '#111' }}>{stockDisplay}</span>
                                                )}
                                            </td>
                                            <td data-label="Mínimo">
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={editMinStock} 
                                                        onChange={e => setEditMinStock(e.target.value)} 
                                                        style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-primary)', outline: 'none', fontWeight: '800', fontSize: '1.1rem', textAlign: 'center', fontFamily: 'inherit' }}
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
            
            {/* Historial de Movimientos */}
            <div className="admin-card">
                <div className="accounting-header-main" style={{ marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Historial de Consumo / Entradas (Últimos 7 días)</h2>
                </div>
                
                <div className="accounting-table-container">
                    {loadingMovements ? <p>Cargando historial...</p> : (
                        <table className="accounting-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '15px' }}>Fecha</th>
                                    <th style={{ padding: '15px' }}>Artículo</th>
                                    <th style={{ padding: '15px' }}>Movimiento</th>
                                    <th style={{ padding: '15px' }}>Razón</th>
                                    <th style={{ padding: '15px' }}>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay movimientos recientes.</td>
                                    </tr>
                                ) : (
                                    movements.map(mov => {
                                        const isOut = mov.direction === 'OUT';
                                        return (
                                            <tr key={mov.id}>
                                                <td data-label="Fecha" style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {new Date(mov.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td data-label="Artículo"><strong>{mov.inventory_item_name}</strong></td>
                                                <td data-label="Movimiento">
                                                    <span style={{ 
                                                        color: isOut ? '#e03131' : '#2f9e44', 
                                                        fontWeight: 'bold',
                                                        background: isOut ? '#fff5f5' : '#ebfbee',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {isOut ? '-' : '+'}{parseFloat(mov.quantity)} {mov.inventory_item_unit}
                                                    </span>
                                                </td>
                                                <td data-label="Razón" style={{ fontSize: '0.9rem' }}>{mov.reason}</td>
                                                <td data-label="Detalles" style={{ fontSize: '0.85rem', color: '#666' }}>{mov.description || '-'}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );

}

export default Inventory;
