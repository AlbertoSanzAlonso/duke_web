import React, { useState, useEffect } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem, fetchInventoryMovements } from '../../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
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

    // Movements UI state
    const [movSearchTerm, setMovSearchTerm] = useState('');
    const [movStartDate, setMovStartDate] = useState('');
    const [movEndDate, setMovEndDate] = useState('');
    const [movPage, setMovPage] = useState(1);
    const movPerPage = 10;

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

    const [hasWeight, setHasWeight] = useState(false);
    const [weightPerUnit, setWeightPerUnit] = useState('1000');
    const [weightUnit, setWeightUnit] = useState('g');
    
    // Sub-unit state
    const [useSubUnits, setUseSubUnits] = useState(false);
    const [subUnitName, setSubUnitName] = useState('unidades');
    const [subUnitsPerUnit, setSubUnitsPerUnit] = useState('1');

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

    // Global Edit Modal State (Full Detail Edit)
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [modalData, setModalData] = useState({
        name: '', category: '', quantity: '', min_stock: '', unit: '',
        hasPack: false, packName: '', unitsPerPack: '',
        hasWeight: false, weightPerUnit: '', weightUnit: '',
        useSubUnits: false, subUnitName: '', subUnitsPerUnit: ''
    });

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
                fetchInventoryMovements(30) // fetch last 30 days by default for better history view
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
                has_weight: hasWeight,
                weight_per_unit: hasWeight ? (parseFloat(weightPerUnit) || 0) : 0,
                weight_unit: hasWeight ? weightUnit : 'g',
                use_sub_units: useSubUnits,
                sub_unit_name: subUnitName,
                sub_units_per_unit: useSubUnits ? (parseFloat(subUnitsPerUnit) || 1) : 1,
                min_stock: parseFloat(minStock) || 0
            });
            setName('');
            setCategory('');
            setQuantity('');
            setMinStock('0');
            setHasPack(false);
            setPackName('cajas');
            setUnitsPerPack('10');
            setHasWeight(false);
            setWeightPerUnit('1000');
            setWeightUnit('g');
            setUseSubUnits(false);
            setSubUnitName('unidades');
            setSubUnitsPerUnit('1');
            loadInventory();
            setToast({ message: "Artículo añadido al inventario", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleOpenEdit = (item) => {
        setItemToEdit(item);
        setModalData({
            name: item.name,
            category: item.category || '',
            quantity: item.quantity,
            min_stock: item.min_stock,
            unit: item.unit,
            hasPack: !!item.pack_name,
            packName: item.pack_name || 'cajas',
            unitsPerPack: item.units_per_pack || '10',
            hasWeight: item.has_weight,
            weightPerUnit: item.weight_per_unit || '1000',
            weightUnit: item.weight_unit || 'g',
            useSubUnits: item.use_sub_units,
            subUnitName: item.sub_unit_name || 'unidades',
            subUnitsPerUnit: item.sub_units_per_unit || '1'
        });
        setShowEditModal(true);
    };

    const handleUpdateFullItem = async () => {
        if (!itemToEdit) return;
        try {
            await updateInventoryItem(itemToEdit.id, { 
                name: modalData.name,
                category: modalData.category,
                quantity: parseFloat(modalData.quantity) || 0,
                min_stock: parseFloat(modalData.min_stock) || 0,
                unit: modalData.unit,
                pack_name: modalData.hasPack ? modalData.packName : null,
                units_per_pack: modalData.hasPack ? (parseFloat(modalData.unitsPerPack) || 1) : 1,
                has_weight: modalData.hasWeight,
                weight_per_unit: modalData.hasWeight ? (parseFloat(modalData.weightPerUnit) || 0) : 0,
                weight_unit: modalData.hasWeight ? modalData.weightUnit : 'g',
                use_sub_units: modalData.useSubUnits,
                sub_unit_name: modalData.subUnitName,
                sub_units_per_unit: modalData.useSubUnits ? (parseFloat(modalData.subUnitsPerUnit) || 1) : 1
            });
            setShowEditModal(false);
            setItemToEdit(null);
            loadInventory();
            setToast({ message: "Item actualizado con éxito", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleDelete = (id) => {
        const item = items.find(i => i.id === id);
        setConfirmConfig({
            isOpen: true,
            title: '¿Eliminar Artículo?',
            message: `¿Estás seguro de que deseas eliminar "${item?.name}" del inventario? Esta acción no se puede deshacer.`,
            onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id) => {
        try {
            await deleteInventoryItem(id);
            loadInventory();
            setToast({ message: "Artículo quitado del inventario", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setConfirmConfig({ ...confirmConfig, isOpen: false });
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

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaeaea', marginTop: '5px', width: '100%' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                        <input type="checkbox" checked={hasWeight} onChange={e => setHasWeight(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                        ¿Cada unidad base posee un peso fijo (ej. 1 Pollo = 1.5kg)?
                    </label>

                    {hasWeight && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Cada {unit} pesa/mide:</span>
                            <input 
                                type="number" 
                                step="any" 
                                value={weightPerUnit} 
                                onChange={e => setWeightPerUnit(e.target.value)}
                                style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}>
                                <option value="g">Gramos (g)</option>
                                <option value="kg">Kilos (kg)</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="l">Litros (l)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaeaea', marginTop: '5px', width: '100%' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                        <input type="checkbox" checked={useSubUnits} onChange={e => setUseSubUnits(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                        ¿Dividir la unidad para recetas (ej. 1 Paquete = 50 Fetas)?
                    </label>

                    {useSubUnits && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Se divide en:</span>
                            <input 
                                type="text" 
                                placeholder="Ej: fetas" 
                                value={subUnitName} 
                                onChange={e => setSubUnitName(e.target.value)}
                                style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>y trae:</span>
                            <input 
                                type="number" 
                                step="any" 
                                value={subUnitsPerUnit} 
                                onChange={e => setSubUnitsPerUnit(e.target.value)}
                                style={{ width: '60px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#444' }}>{subUnitName || 'unidades'} por {unit}</span>
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

            <div className="accounting-table-container accounting-desktop-only">
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
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay registros en el inventario.</td>
                                </tr>
                            ) : (
                                items.filter(item => 
                                    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(item => {
                                    const outOfStock = parseFloat(item.quantity) <= parseFloat(item.min_stock);
                                    
                                    const qty = parseFloat(item.quantity) || 0;
                                    const upp = parseFloat(item.units_per_pack) || 1;
                                    let stockDisplay;
                                    let hasPacksDisplay = false;
                                    if (item.pack_name && upp > 1) {
                                        hasPacksDisplay = true;
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
                                                {hasPacksDisplay && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Empaque: {upp} {item.unit} / {item.pack_name}</div>}
                                                {item.has_weight && <div style={{ fontSize: '0.75rem', color: '#0b7285', marginTop: '2px', fontWeight: 'bold' }}>Medida unit.: {Number(item.weight_per_unit)} {item.weight_unit}</div>}
                                            </td>
                                            <td data-label="Categoría" style={{ color: '#666' }}>{item.category || '-'}</td>
                                            <td data-label="Stock Actual">
                                                <span style={{ fontWeight: 'bold', color: hasPacksDisplay ? '#4c6ef5' : '#111' }}>{stockDisplay}</span>
                                            </td>
                                            <td data-label="Mínimo">
                                                <span style={{ color: '#888' }}>{item.min_stock} {item.unit}</span>
                                            </td>
                                            <td data-label="Acciones">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => handleOpenEdit(item)} 
                                                        style={{ padding: '6px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        title="Editar Todo"
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

            {/* Main Inventory - MOBILE VERSION */}
            <div className="accounting-mobile-only">
                {items.filter(item => 
                    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
                ).map(item => {
                    const outOfStock = parseFloat(item.quantity) <= parseFloat(item.min_stock);
                    const qty = parseFloat(item.quantity) || 0;
                    const upp = parseFloat(item.units_per_pack) || 1;
                    let stockDisplay;
                    if (item.pack_name && upp > 1) {
                        const wholePacks = Math.floor(qty / upp);
                        const remainder = qty % upp;
                        stockDisplay = wholePacks > 0 ? `${wholePacks} ${item.pack_name}${remainder > 0 ? ` + ${remainder}` : ''}` : `${qty} ${item.unit}`;
                    } else {
                        stockDisplay = `${qty} ${item.unit}`;
                    }

                    return (
                        <div key={`mob-inv-${item.id}`} className="admin-card" style={{ padding: '15px', marginBottom: '10px', position: 'relative', borderLeft: outOfStock ? '4px solid #e03131' : '4px solid #2f9e44' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.category}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleOpenEdit(item)} style={{ padding: '8px', background: '#333', color: 'white', border: 'none', borderRadius: '6px' }}><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(item.id)} style={{ padding: '8px', background: '#f5f5f5', color: '#e03131', border: 'none', borderRadius: '6px' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 'bold' }}>STOCK ACTUAL</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '900', color: outOfStock ? '#e03131' : '#111' }}>{stockDisplay}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 'bold' }}>MÍNIMO</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.min_stock} {item.unit}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
            
            {/* Historial de Movimientos */}
            <div className="admin-card">
                <div className="accounting-header-main" style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Historial de Consumo / Entradas</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="search-bar" style={{ margin: 0, width: '250px' }}>
                                <Search size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar producto o categoría..." 
                                    value={movSearchTerm}
                                    onChange={e => { setMovSearchTerm(e.target.value); setMovPage(1); }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', width: '100%', background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Desde:</span>
                            <input 
                                type="date" 
                                value={movStartDate} 
                                onChange={e => { setMovStartDate(e.target.value); setMovPage(1); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hasta:</span>
                            <input 
                                type="date" 
                                value={movEndDate} 
                                onChange={e => { setMovEndDate(e.target.value); setMovPage(1); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                            />
                        </div>
                        {(movSearchTerm || movStartDate || movEndDate) && (
                            <button 
                                onClick={() => { setMovSearchTerm(''); setMovStartDate(''); setMovEndDate(''); setMovPage(1); }}
                                style={{ background: '#eee', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="accounting-table-container accounting-desktop-only">
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
                                {(() => {
                                    const filtered = movements.filter(mov => {
                                        const matchSearch = mov.inventory_item_name.toLowerCase().includes(movSearchTerm.toLowerCase()) ||
                                                            (mov.inventory_item_category || "").toLowerCase().includes(movSearchTerm.toLowerCase());
                                        let matchDate = true;
                                        if (movStartDate || movEndDate) {
                                            const movDate = new Date(mov.date);
                                            if (movStartDate) {
                                                const start = new Date(movStartDate);
                                                start.setHours(0,0,0,0);
                                                if (movDate < start) matchDate = false;
                                            }
                                            if (movEndDate) {
                                                const end = new Date(movEndDate);
                                                end.setHours(23,59,59,999);
                                                if (movDate > end) matchDate = false;
                                            }
                                        }
                                        return matchSearch && matchDate;
                                    });
                                    const totalPages = Math.ceil(filtered.length / movPerPage);
                                    const paginated = filtered.slice((movPage - 1) * movPerPage, movPage * movPerPage);
                                    if (filtered.length === 0) return <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay filtros.</td></tr>;
                                    return (
                                        <>
                                            {paginated.map(mov => {
                                                const isOut = mov.direction === 'OUT';
                                                return (
                                                    <tr key={mov.id}>
                                                        <td style={{ fontSize: '0.85rem' }}>{new Date(mov.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                        <td><strong>{mov.inventory_item_name}</strong></td>
                                                        <td>
                                                            <span style={{ color: isOut ? '#e03131' : '#2f9e44', fontWeight: 'bold' }}>
                                                                {isOut ? '-' : '+'}{parseFloat(mov.quantity)} {mov.inventory_item_unit}
                                                            </span>
                                                        </td>
                                                        <td>{mov.reason}</td>
                                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>{mov.description || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                            <tr>
                                                <td colSpan="5">
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '10px' }}>
                                                        <button disabled={movPage === 1} onClick={() => setMovPage(prev => prev - 1)} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: movPage === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
                                                        <span>{movPage} de {totalPages || 1}</span>
                                                        <button disabled={movPage === totalPages || totalPages === 0} onClick={() => setMovPage(prev => prev + 1)} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: (movPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}>Siguiente</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Historial - MOBILE VERSION */}
                <div className="accounting-mobile-only">
                    {(() => {
                        const filtered = movements.filter(mov => {
                            const matchSearch = mov.inventory_item_name.toLowerCase().includes(movSearchTerm.toLowerCase()) ||
                                                (mov.inventory_item_category || "").toLowerCase().includes(movSearchTerm.toLowerCase());
                            let matchDate = true;
                            if (movStartDate || movEndDate) {
                                const movDate = new Date(mov.date);
                                if (movStartDate) {
                                    const start = new Date(movStartDate); start.setHours(0,0,0,0);
                                    if (movDate < start) matchDate = false;
                                }
                                if (movEndDate) {
                                    const end = new Date(movEndDate); end.setHours(23,59,59,999);
                                    if (movDate > end) matchDate = false;
                                }
                            }
                            return matchSearch && matchDate;
                        });
                        const paginated = filtered.slice((movPage - 1) * movPerPage, movPage * movPerPage);
                        if (paginated.length === 0) return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Sin movimientos.</div>;
                        return (
                            <>
                                {paginated.map(mov => {
                                    const isOut = mov.direction === 'OUT';
                                    return (
                                        <div key={`mob-mov-${mov.id}`} style={{ background: '#fff', padding: '12px', borderBottom: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong>{mov.inventory_item_name}</strong>
                                                <span style={{ color: isOut ? '#e03131' : '#2f9e44', fontWeight: 'bold' }}>{isOut ? '-' : '+'}{parseFloat(mov.quantity)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{mov.reason} • {new Date(mov.date).toLocaleDateString()}</div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px' }}>
                                    <button disabled={movPage === 1} onClick={() => setMovPage(prev => prev - 1)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px' }}>Anterior</button>
                                    <button disabled={movPage === Math.ceil(filtered.length / movPerPage) || filtered.length === 0} onClick={() => setMovPage(prev => prev + 1)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px' }}>Siguiente</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {confirmConfig.isOpen && (
                <ConfirmModal 
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                />
            )}

            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            {/* Modal de Edición Completa */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)'
                }}>
                    <div className="admin-card" style={{ 
                        width: '100%', maxWidth: '600px', maxHeight: '95vh', overflowY: 'auto',
                        position: 'relative', border: '1px solid #ddd', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        padding: '30px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: 'var(--admin-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Editar Artículo</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: '#eee', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' }}>Nombre del Producto</label>
                                <input type="text" value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' }}>Categoría</label>
                                <select value={modalData.category} onChange={e => setModalData({...modalData, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' }}>Unidad de Stock</label>
                                <select value={modalData.unit} onChange={e => setModalData({...modalData, unit: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}>
                                    {['unidades', 'kg', 'gramos', 'litros', 'ml', 'paquetes'].map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' }}>Stock Actual ({modalData.unit})</label>
                                <input type="number" step="any" value={modalData.quantity} onChange={e => setModalData({...modalData, quantity: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }} />
                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>* Cambiar esto creará un ajuste manual en el historial.</div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' }}>Stock Mínimo</label>
                                <input type="number" step="any" value={modalData.min_stock} onChange={e => setModalData({...modalData, min_stock: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }} />
                            </div>

                            {/* Configuración de Packs */}
                            <div style={{ gridColumn: '1 / -1', background: '#f8f9ff', padding: '15px', borderRadius: '10px', border: '1px solid #e0e6ff' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', marginBottom: '12px', cursor: 'pointer', color: '#364fc7' }}>
                                    <input type="checkbox" checked={modalData.hasPack} onChange={e => setModalData({...modalData, hasPack: e.target.checked})} style={{ transform: 'scale(1.2)' }} />
                                    ¿Llega en envases / packs?
                                </label>
                                {modalData.hasPack && (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Ej: Cajas" value={modalData.packName} onChange={e => setModalData({...modalData, packName: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                        <span style={{ fontSize: '0.9rem' }}>trae:</span>
                                        <input type="number" value={modalData.unitsPerPack} onChange={e => setModalData({...modalData, unitsPerPack: e.target.value})} style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' }} />
                                        <span style={{ fontSize: '0.9rem' }}>{modalData.unit}</span>
                                    </div>
                                )}
                            </div>

                            {/* Configuración de Peso */}
                            <div style={{ gridColumn: '1 / -1', background: '#f1fbf0', padding: '15px', borderRadius: '10px', border: '1px solid #d3f9d8' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', marginBottom: '12px', cursor: 'pointer', color: '#2b8a3e' }}>
                                    <input type="checkbox" checked={modalData.hasWeight} onChange={e => setModalData({...modalData, hasWeight: e.target.checked})} style={{ transform: 'scale(1.2)' }} />
                                    ¿Tiene peso/volumen fijo por unidad?
                                </label>
                                {modalData.hasWeight && (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="number" step="any" value={modalData.weightPerUnit} onChange={e => setModalData({...modalData, weightPerUnit: e.target.value})} style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center' }} />
                                        <select value={modalData.weightUnit} onChange={e => setModalData({...modalData, weightUnit: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                            <option value="g">Gramos (g)</option><option value="kg">Kilos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option>
                                        </select>
                                        <span style={{ fontSize: '0.85rem' }}>por cada {modalData.unit}</span>
                                    </div>
                                )}
                            </div>

                             {/* Configuración de Sub-unidades */}
                             <div style={{ gridColumn: '1 / -1', background: '#fff5f5', padding: '15px', borderRadius: '10px', border: '1px solid #ffe3e3' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', marginBottom: '12px', cursor: 'pointer', color: '#c92a2a' }}>
                                    <input type="checkbox" checked={modalData.useSubUnits} onChange={e => setModalData({...modalData, useSubUnits: e.target.checked})} style={{ transform: 'scale(1.2)' }} />
                                    ¿Configurar desglose interno (ej. fetas)?
                                </label>
                                {modalData.useSubUnits && (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Nombre (ej: fetas)" value={modalData.subUnitName} onChange={e => setModalData({...modalData, subUnitName: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                        <span style={{ fontSize: '0.9rem' }}>trae:</span>
                                        <input type="number" step="any" value={modalData.subUnitsPerUnit} onChange={e => setModalData({...modalData, subUnitsPerUnit: e.target.value})} style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center' }} />
                                        <span style={{ fontSize: '0.9rem' }}>uds por {modalData.unit}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                            <button onClick={handleUpdateFullItem} className="main-button" style={{ flex: 1, padding: '18px', fontSize: '1rem', background: 'var(--admin-primary)' }}>GUARDAR TODOS LOS CAMBIOS</button>
                            <button onClick={() => setShowEditModal(false)} style={{ padding: '18px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#555', fontWeight: 'bold' }}>CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Inventory;
