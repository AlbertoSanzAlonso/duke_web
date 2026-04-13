import React, { useState, useEffect, useMemo } from 'react';
import { fetchInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem, fetchInventoryMovements, fetchInventoryDailyConsumption } from '../../services/api';
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
    const [dailyConsumptions, setDailyConsumptions] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    // Movements UI state
    const [movSearchTerm, setMovSearchTerm] = useState('');
    const [movStartDate, setMovStartDate] = useState('');
    const [movEndDate, setMovEndDate] = useState('');
    const [movPage, setMovPage] = useState(1);
    const movPerPage = 10;

    // Consumption Summary state
    const [summaryPeriod, setSummaryPeriod] = useState('all'); // daily, weekly, monthly, all
    const [summarySearch, setSummarySearch] = useState('');
    const [summaryStartDate, setSummaryStartDate] = useState('');
    const [summaryEndDate, setSummaryEndDate] = useState('');

    // Inventory Filtering & Pagination
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [invPage, setInvPage] = useState(1);
    const invPerPage = 10;

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
            const [data, movs, cons] = await Promise.all([
                fetchInventory(),
                fetchInventoryMovements(30),
                fetchInventoryDailyConsumption(30)
            ]);
            setItems(data);
            setMovements(movs);
            setDailyConsumptions(cons);
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
            setIsCreateModalOpen(false);
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

    const consumptionTotals = useMemo(() => {
        let filteredCons = [...dailyConsumptions];
        
        if (summaryPeriod === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            filteredCons = filteredCons.filter(c => c.date === today);
        } else if (summaryPeriod === 'weekly') {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            filteredCons = filteredCons.filter(c => new Date(c.date) >= start);
        } else if (summaryPeriod === 'monthly') {
            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            filteredCons = filteredCons.filter(c => new Date(c.date) >= start);
        } else if (summaryStartDate || summaryEndDate) {
            if (summaryStartDate) {
                const s = new Date(summaryStartDate);
                filteredCons = filteredCons.filter(c => new Date(c.date) >= s);
            }
            if (summaryEndDate) {
                const e = new Date(summaryEndDate);
                filteredCons = filteredCons.filter(c => new Date(c.date) <= e);
            }
        }

        const totals = {};
        filteredCons.forEach(c => {
            const name = c.inventory_item_name;
            if (!totals[name]) {
                totals[name] = { 
                    name, 
                    amount: 0, 
                    unit: c.inventory_item_unit, 
                    category: c.inventory_item_category 
                };
            }
            totals[name].amount += parseFloat(c.quantity);
        });

        return Object.values(totals).filter(t => 
            t.name.toLowerCase().includes(summarySearch.toLowerCase())
        ).sort((a, b) => b.amount - a.amount);
    }, [dailyConsumptions, summaryPeriod, summarySearch, summaryStartDate, summaryEndDate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="accounting-header-main" style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0 }}>Inventario de Almacén</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="add-movement-btn"
                            style={{ background: 'var(--admin-primary)', height: '44px' }}
                        >
                            + NUEVO ARTÍCULO
                        </button>
                        <div className="export-actions">
                            <button onClick={handleExportExcel} className="export-btn excel" title="Excel"><Download size={20} /></button>
                            <button onClick={handleExportPDF} className="export-btn pdf" title="PDF"><FileText size={20} /></button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', width: '100%', background: '#f8f9fa', padding: '12px', borderRadius: '8px', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: '1 1 250px' }}>
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar artículo..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setInvPage(1); }}
                        />
                    </div>

                    <select 
                        value={filterCategory} 
                        onChange={e => { setFilterCategory(e.target.value); setInvPage(1); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', color: filterLowStock ? '#e03131' : '#666' }}>
                        <input type="checkbox" checked={filterLowStock} onChange={e => { setFilterLowStock(e.target.checked); setInvPage(1); }} />
                        Solo Stock Bajo
                    </label>

                    {(searchTerm || filterCategory !== 'all' || filterLowStock) && (
                        <button 
                            onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterLowStock(false); setInvPage(1); }}
                            style={{ background: '#eee', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>
            
            {isCreateModalOpen && (
                <div className="modal-overlay users-modal-overlay">
                    <div className="modal-content" style={{ 
                        maxWidth: '700px', 
                        width: '95%', 
                        background: '#fff', 
                        color: '#333', 
                        padding: '25px', 
                        borderRadius: '16px', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
                        position: 'relative',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Añadir Nuevo Artículo</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCreate} style={{ margin: '0', flex: 1, overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>NOMBRE DEL ARTÍCULO</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Tomate, Carne..." 
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                        required 
                                        style={{ padding: '12px', borderRadius: '10px', border: '2px solid #f1f3f5', fontSize: '1rem' }}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>CATEGORÍA</label>
                                    <input 
                                        list="inventory-categories-modal"
                                        placeholder="Elegir o escribir..."
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '10px', border: '2px solid #f1f3f5', fontSize: '1rem' }}
                                    />
                                    <datalist id="inventory-categories-modal">
                                        {categories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>STOCK INICIAL (Unidades Base)</label>
                                    <input 
                                        type="number" 
                                        step="any" 
                                        value={quantity} 
                                        onChange={e => setQuantity(e.target.value)} 
                                        style={{ padding: '12px', borderRadius: '10px', border: '2px solid #f1f3f5', fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>UNIDAD BASE</label>
                                    <select value={unit} onChange={e => setUnit(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '2px solid #f1f3f5', fontSize: '1rem' }}>
                                        <option value="unidades">Unidades</option>
                                        <option value="kg">KG</option>
                                        <option value="litros">Litros</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#444' }}>STOCK MÍNIMO</label>
                                    <input 
                                        type="number" 
                                        step="any" 
                                        value={minStock} 
                                        onChange={e => setMinStock(e.target.value)} 
                                        style={{ padding: '12px', borderRadius: '10px', border: '2px solid #f1f3f5', fontSize: '1rem', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>

                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', marginBottom: hasPack ? '15px' : '0' }}>
                                    <input type="checkbox" checked={hasPack} onChange={e => setHasPack(e.target.checked)} />
                                    ¿Llega en cajas/packs?
                                </label>
                                {hasPack && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>TIPO DE ENVASE</label>
                                            <input type="text" value={packName} onChange={e => setPackName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>CANTIDAD POR {packName.toUpperCase()}</label>
                                            <input type="number" step="any" value={unitsPerPack} onChange={e => setUnitsPerPack(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', marginBottom: hasWeight ? '15px' : '0' }}>
                                    <input type="checkbox" checked={hasWeight} onChange={e => setHasWeight(e.target.checked)} />
                                    ¿Tiene peso/medida fija por unidad?
                                </label>
                                {hasWeight && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>CANTIDAD/PESO</label>
                                            <input type="number" step="any" value={weightPerUnit} onChange={e => setWeightPerUnit(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>UNIDAD DE MEDIDA</label>
                                            <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                                <option value="g">Gramos (g)</option>
                                                <option value="kg">Kilos (kg)</option>
                                                <option value="ml">Mililitros (ml)</option>
                                                <option value="l">Litros (l)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', marginBottom: useSubUnits ? '15px' : '0' }}>
                                    <input type="checkbox" checked={useSubUnits} onChange={e => setUseSubUnits(e.target.checked)} />
                                    ¿Dividir en sub-unidades para recetas?
                                </label>
                                {useSubUnits && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>NOMBRE SUB-UNIDAD</label>
                                            <input type="text" value={subUnitName} onChange={e => setSubUnitName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>CANTIDAD POR {unit.toUpperCase()}</label>
                                            <input type="number" step="any" value={subUnitsPerUnit} onChange={e => setSubUnitsPerUnit(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: '#f1f3f5', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                                <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', background: 'var(--admin-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>AÑADIR ARTÍCULO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            {(() => {
                                const filtered = items.filter(item => {
                                    const matchSearch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchCat = filterCategory === 'all' || item.category === filterCategory;
                                    const matchLow = !filterLowStock || (parseFloat(item.quantity) <= parseFloat(item.min_stock));
                                    return matchSearch && matchCat && matchLow;
                                });
                                
                                const totalPages = Math.ceil(filtered.length / invPerPage);
                                const paginated = filtered.slice((invPage - 1) * invPerPage, invPage * invPerPage);

                                if (filtered.length === 0) return <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No se encontraron artículos.</td></tr>;
                                
                                return (
                                    <>
                                        {paginated.map(item => {
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
                                                            <button onClick={() => handleOpenEdit(item)} style={{ padding: '6px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Editar Todo"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDelete(item.id)} style={{ padding: '6px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Eliminar"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {totalPages > 1 && (
                                            <tr>
                                                <td colSpan="5">
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '15px' }}>
                                                        <button disabled={invPage === 1} onClick={() => setInvPage(prev => prev - 1)} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: invPage === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Página {invPage} de {totalPages}</span>
                                                        <button disabled={invPage === totalPages} onClick={() => setInvPage(prev => prev + 1)} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: invPage === totalPages ? 'not-allowed' : 'pointer' }}>Siguiente</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Main Inventory - MOBILE VERSION */}
            <div className="accounting-mobile-only">
                {(() => {
                    const filtered = items.filter(item => {
                        const matchSearch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase());
                        const matchCat = filterCategory === 'all' || item.category === filterCategory;
                        const matchLow = !filterLowStock || (parseFloat(item.quantity) <= parseFloat(item.min_stock));
                        return matchSearch && matchCat && matchLow;
                    });
                    const paginated = filtered.slice((invPage - 1) * invPerPage, invPage * invPerPage);
                    if (paginated.length === 0) return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No se encontraron artículos.</div>;
                    
                    return (
                        <>
                            {paginated.map(item => {
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
                            {Math.ceil(filtered.length / invPerPage) > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px' }}>
                                    <button disabled={invPage === 1} onClick={() => setInvPage(prev => prev - 1)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px' }}>Anterior</button>
                                    <button disabled={invPage === Math.ceil(filtered.length / invPerPage)} onClick={() => setInvPage(prev => prev + 1)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px' }}>Siguiente</button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
            </div>
            
            {/* Resumen de Consumo Acumulado */}
            <div className="admin-card">
                <div className="accounting-header-main" style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#e03131' }}>Resumen de Consumo (Acumulados)</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', width: '100%', background: '#f8f9fa', padding: '15px', borderRadius: '12px', alignItems: 'center' }}>
                        <div className="search-bar" style={{ flex: '1 1 200px' }}>
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Filtrar por material..." 
                                value={summarySearch}
                                onChange={e => setSummarySearch(e.target.value)}
                            />
                        </div>

                        <div className="period-selector" style={{ display: 'flex', gap: '5px', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #ddd' }}>
                            {[
                                { id: 'all', label: 'TODOS' },
                                { id: 'daily', label: 'DIARIO' },
                                { id: 'weekly', label: 'SEMANAL' },
                                { id: 'monthly', label: 'MENSUAL' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => { setSummaryPeriod(p.id); setSummaryStartDate(''); setSummaryEndDate(''); }}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        background: summaryPeriod === p.id && !summaryStartDate ? '#333' : 'transparent',
                                        color: summaryPeriod === p.id && !summaryStartDate ? '#fff' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="date" 
                                value={summaryStartDate} 
                                onChange={e => { setSummaryStartDate(e.target.value); setSummaryPeriod(''); }}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>→</span>
                            <input 
                                type="date" 
                                value={summaryEndDate} 
                                onChange={e => { setSummaryEndDate(e.target.value); setSummaryPeriod(''); }}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="summary-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '12px',
                    padding: '5px'
                }}>
                    {consumptionTotals.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', fontSize: '0.9rem' }}>
                            No hay consumo registrado en este periodo.
                        </div>
                    ) : (
                        consumptionTotals.map(t => (
                            <div key={`sum-${t.name}`} style={{ 
                                background: '#fff', 
                                padding: '15px', 
                                borderRadius: '15px', 
                                border: '1px solid #eee',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t.category || 'Varios'}</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333', marginBottom: '8px', lineHeight: '1.2' }}>{t.name}</span>
                                <div style={{ 
                                    background: '#fff5f5', 
                                    color: '#e03131', 
                                    padding: '6px 12px', 
                                    borderRadius: '10px',
                                    fontSize: '1.1rem',
                                    fontWeight: '900',
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    letterSpacing: '0.5px'
                                }}>
                                    {t.amount % 1 === 0 ? t.amount : t.amount.toFixed(2)} <small style={{ fontSize: '0.7rem', fontWeight: '500' }}>{t.unit}</small>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {confirmConfig.isOpen && (
                <ConfirmModal 
                    isOpen={true}
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
