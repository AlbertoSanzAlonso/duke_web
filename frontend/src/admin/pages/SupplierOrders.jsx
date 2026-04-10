import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { fetchSupplierOrders, createSupplierOrder, fetchInventory, createInventoryItem, deleteSupplierOrder, updateSupplierOrder } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { Truck, Plus, History, Trash2, ShoppingCart, Search, X, Download, FileText, CheckSquare, Square, Edit2, Save, Filter } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import './Accounting.css';

const SupplierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewMode, setViewMode] = useState('monthly'); // 'daily', 'weekly', 'monthly'
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Order draft state
    const [supplierName, setSupplierName] = useState('');
    const [orderItems, setOrderItems] = useState([]); // Array of { item_id, quantity, cost, name }

    // Manual item add state
    const [selectedItemId, setSelectedItemId] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemCost, setItemCost] = useState('');

    // New Item Flow
    const [isAddingNewItem, setIsAddingNewItem] = useState(false);
    const [newItemData, setNewItemData] = useState({ name: '', unit: 'unidades', category: 'Otros' });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showMinStockModal, setShowMinStockModal] = useState(false);
    const [minStockValue, setMinStockValue] = useState('0');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Selection & Actions
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ supplier_name: '', total_cost: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, inventoryData] = await Promise.all([
                fetchSupplierOrders(),
                fetchInventory()
            ]);
            setOrders(ordersData);
            setInventoryItems(inventoryData);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const addItemToOrder = async () => {
        if (isAddingNewItem) {
            if (!newItemData.name || !itemQty || !itemCost) return;
            setShowMinStockModal(true);
            return;
        } else {
            if (!selectedItemId || !itemQty || !itemCost) return;
            
            const invItem = inventoryItems.find(i => i.id === parseInt(selectedItemId));
            if (!invItem) return;

            setOrderItems([...orderItems, {
                item: invItem.id,
                name: invItem.name,
                quantity: parseFloat(itemQty),
                cost: parseFloat(itemCost)
            }]);
        }

        // Reset common fields
        setSelectedItemId('');
        setItemQty('');
        setItemCost('');
    };

    const removeItemFromOrder = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const totalCalculatedCost = orderItems.reduce((acc, current) => acc + current.cost, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supplierName || orderItems.length === 0) {
            setToast({ message: "Debes añadir al menos un artículo", type: 'error' });
            return;
        }
        
        setIsSaving(true);
        try {
            await createSupplierOrder({
                supplier_name: supplierName,
                total_cost: totalCalculatedCost,
                status: 'DELIVERED',
                items: orderItems
            });
            
            // Success
            setSupplierName('');
            setOrderItems([]);
            setToast({ message: "Pedido registrado y stock actualizado", type: 'success' });
            
            // DISPATCH GLOBAL REFRESH EVENT
            window.dispatchEvent(new CustomEvent('new-order-received'));
            
            setIsCreateModalOpen(false);
            loadData();
        } catch (error) {
            setToast({ message: "Error al registrar pedido", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmNewItem = async () => {
        setIsSaving(true);
        try {
            // 1. Create the item in inventory with min_stock
            const created = await createInventoryItem({
                name: newItemData.name,
                unit: newItemData.unit,
                category: newItemData.category,
                quantity: 0,
                min_stock: parseFloat(minStockValue) || 0
            });
            
            // 2. Add to order list
            setOrderItems([...orderItems, {
                item: created.id,
                name: created.name,
                quantity: parseFloat(itemQty),
                cost: parseFloat(itemCost)
            }]);
            
            // 3. Reset and refresh
            const invData = await fetchInventory();
            setInventoryItems(invData);
            setNewItemData({ name: '', unit: 'unidades', category: 'Otros' });
            setIsAddingNewItem(false);
            setShowMinStockModal(false);
            setMinStockValue('0');
            
            // Clear current input fields
            setSelectedItemId('');
            setItemQty('');
            setItemCost('');
        } catch (err) {
            setToast({ message: `Error: ${err.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredOrders = useMemo(() => {
        const now = new Date();
        let filtered = orders.filter(item => {
            const itemDate = new Date(item.date);
            
            // 1. DATE RANGE / PERIOD FILTER
            let dateMatch = true;
            if (startDate || endDate) {
                if (startDate) {
                    const sDate = new Date(startDate);
                    sDate.setHours(0,0,0,0);
                    if (itemDate < sDate) dateMatch = false;
                }
                if (endDate) {
                    const eDate = new Date(endDate);
                    eDate.setHours(23,59,59,999);
                    if (itemDate > eDate) dateMatch = false;
                }
            } else {
                // Default Period Filter
                if (viewMode === 'daily') {
                    dateMatch = itemDate.toDateString() === now.toDateString();
                } else if (viewMode === 'weekly') {
                    const diffTime = Math.abs(now - itemDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    dateMatch = diffDays <= 7;
                } else if (viewMode === 'monthly') {
                    dateMatch = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                }
            }
            if (!dateMatch) return false;

            // 2. SEARCH FILTER (Keyword)
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                (item.supplier_name || "").toLowerCase().includes(term) ||
                item.id.toString().includes(term) ||
                (item.items && item.items.some(oi => (oi.item_name || "").toLowerCase().includes(term)));
            
            return matchesSearch;
        });

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [orders, searchTerm, startDate, endDate, viewMode]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(start, start + itemsPerPage);
    }, [filteredOrders, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, viewMode]);

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === paginatedOrders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedOrders.map(o => o.id)));
        }
    };

    const handleDelete = (order) => {
        setConfirmConfig({
            isOpen: true,
            title: '¿ELIMINAR PEDIDO?',
            message: `¿Estás seguro de eliminar el pedido #${order.id} de ${order.supplier_name}? Esto no revertirá automáticamente el stock sumado al inventario.`,
            onConfirm: async () => {
                try {
                    await deleteSupplierOrder(order.id);
                    setToast({ message: "Pedido eliminado", type: 'success' });
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    loadData();
                } catch (error) {
                    setToast({ message: "Error al eliminar", type: 'error' });
                }
            }
        });
    };

    const handleBulkDelete = () => {
        setConfirmConfig({
            isOpen: true,
            title: `¿ELIMINAR ${selectedIds.size} PEDIDOS?`,
            message: 'Se eliminarán permanentemente todos los pedidos seleccionados.',
            onConfirm: async () => {
                const ids = Array.from(selectedIds);
                let count = 0;
                for (const id of ids) {
                    try {
                        await deleteSupplierOrder(id);
                        count++;
                    } catch (e) { console.error(e); }
                }
                setToast({ message: `Se eliminaron ${count} pedidos`, type: 'success' });
                setSelectedIds(new Set());
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                loadData();
            }
        });
    };

    const startEditing = (order) => {
        setEditingId(order.id);
        setEditForm({ supplier_name: order.supplier_name, total_cost: order.total_cost });
    };

    const handleUpdate = async (id) => {
        setIsSaving(true);
        try {
            await updateSupplierOrder(id, {
                supplier_name: editForm.supplier_name,
                total_cost: parseFloat(editForm.total_cost)
            });
            setEditingId(null);
            setToast({ message: "Pedido actualizado", type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al actualizar", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportExcel = () => {
        const data = filteredOrders.map(o => ({
            ID: o.id,
            Fecha: new Date(o.date).toLocaleString('es-AR'),
            Proveedor: o.supplier_name,
            Total: `$${parseFloat(o.total_cost).toLocaleString('es-AR')}`,
            Productos: o.items?.length || 0
        }));
        exportToExcel(data, `Compras_Proveedores_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'ID', dataKey: 'ID' },
            { header: 'Fecha', dataKey: 'Fecha' },
            { header: 'Proveedor', dataKey: 'Proveedor' },
            { header: 'Total', dataKey: 'Total' },
            { header: 'Productos', dataKey: 'Productos' }
        ];
        const data = filteredOrders.map(o => ({
            ID: `#${o.id}`,
            Fecha: new Date(o.date).toLocaleString('es-AR'),
            Proveedor: o.supplier_name,
            Total: `$${parseFloat(o.total_cost).toLocaleString('es-AR')}`,
            Productos: o.items?.length || 0
        }));
        const total = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total_cost), 0);
        exportToPDF(data, columns, `Compras_Proveedores_${new Date().toISOString().split('T')[0]}`, 'Reporte de Compras a Proveedores', { label: 'Inversión Total', value: `$${total.toLocaleString('es-AR')}` });
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <Truck size={32} color="#f03e3e" /> Compras al Proveedor
                    </h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Suministros que incrementan automáticamente el stock del inventario.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="main-button"
                    style={{ background: '#333', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
                >
                    <Plus size={20} /> NUEVA COMPRA
                </button>
            </header>

            <div className="admin-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <History size={20} color="#f03e3e" /> Historial de Compras
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="period-selector" style={{ display: 'flex', background: '#f1f3f5', padding: '4px', borderRadius: '10px' }}>
                                {['daily', 'weekly', 'monthly'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => { setViewMode(mode); setStartDate(''); setEndDate(''); }}
                                        style={{ 
                                            padding: '6px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                                            background: viewMode === mode && !startDate && !endDate ? '#333' : 'transparent',
                                            color: viewMode === mode && !startDate && !endDate ? '#fff' : '#666'
                                        }}
                                    >
                                        {mode === 'daily' ? 'Diario' : mode === 'weekly' ? 'Semanal' : 'Mensual'}
                                    </button>
                                ))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={handleExportExcel} className="icon-btn" title="Excel" style={{ padding: '8px', background: '#2b8a3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Download size={16} /></button>
                                <button onClick={handleExportPDF} className="icon-btn" title="PDF" style={{ padding: '8px', background: '#f03e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><FileText size={16} /></button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="search-bar" style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar proveedor o ID..." 
                                defaultValue={searchTerm}
                                onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                                style={{ padding: '12px 15px 12px 40px', borderRadius: '10px', border: '1px solid #ddd', width: '100%', fontSize: '0.9rem' }}
                            />
                        </div>
                        
                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            style={{ 
                                padding: '10px 15px', borderRadius: '10px', border: '1px solid #ddd', 
                                background: showAdvancedFilters ? '#333' : '#fff', color: showAdvancedFilters ? '#fff' : '#333', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold'
                            }}
                        >
                            <Filter size={18} /> Filtros {showAdvancedFilters ? '▲' : '▼'}
                        </button>
                    </div>

                    {showAdvancedFilters && (
                        <div style={{ 
                            display: 'flex', gap: '15px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', 
                            border: '1px solid #eee', flexWrap: 'wrap', animation: 'slideDown 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>DESDE</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>HASTA</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    style={{ alignSelf: 'flex-end', padding: '10px', background: '#fff', color: '#e03131', border: '1px solid #e03131', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    LIMPIAR FECHAS
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="accounting-table-container">
                    <table className="accounting-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        {selectedIds.size === paginatedOrders.length && paginatedOrders.length > 0 ? <CheckSquare size={18} color="var(--admin-primary)" /> : <Square size={18} color="#999" />}
                                    </button>
                                </th>
                                <th>Fecha</th>
                                <th>Proveedor</th>
                                <th className="txt-right">Importe</th>
                                <th>Detalles</th>
                                <th className="txt-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>{searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'No hay pedidos registrados.'}</td></tr>
                            ) : (
                                paginatedOrders.map(order => {
                                    const isEditing = editingId === order.id;
                                    return (
                                        <tr 
                                            key={order.id} 
                                            onClick={() => !editingId && setSelectedOrder(order)}
                                            style={{ cursor: 'pointer' }}
                                            className={`hover-row ${selectedIds.has(order.id) ? 'selected-row' : ''}`}
                                        >
                                            <td onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedIds.has(order.id) ? <CheckSquare size={18} color="var(--admin-primary)" /> : <Square size={18} color="#ddd" />}
                                                </div>
                                            </td>
                                            <td data-label="Fecha">
                                                {new Date(order.date).toLocaleDateString('es-AR')}
                                                <br/><small style={{color: '#999'}}>{new Date(order.date).toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}</small>
                                            </td>
                                            <td data-label="Proveedor">
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.supplier_name}
                                                        onChange={e => setEditForm({...editForm, supplier_name: e.target.value})}
                                                        onClick={e => e.stopPropagation()}
                                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                                                    />
                                                ) : <strong>{order.supplier_name}</strong>}
                                            </td>
                                            <td data-label="Importe" className="txt-right negative">
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        value={editForm.total_cost}
                                                        onChange={e => setEditForm({...editForm, total_cost: e.target.value})}
                                                        onClick={e => e.stopPropagation()}
                                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd', width: '100px', textAlign: 'right' }}
                                                    />
                                                ) : `-$${parseFloat(order.total_cost).toLocaleString('es-AR')}`}
                                            </td>
                                            <td data-label="Detalles" style={{ fontSize: '0.75rem', color: '#888' }}>
                                                {order.items?.length || 0} prod.
                                            </td>
                                            <td data-label="Acciones">
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleUpdate(order.id); }} className="save-btn" title="Guardar"><Save size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="cancel-btn" title="Cancelar"><X size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); startEditing(order); }} className="edit-btn" title="Editar"><Edit2 size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(order); }} className="delete-btn" title="Eliminar"><Trash2 size={16} /></button>
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
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedIds.size > 0 && (
                    <div className="bulk-toolbar" style={{
                        position: 'fixed',
                        bottom: '30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1a1a1a',
                        padding: '15px 30px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        zIndex: 4000,
                        border: '1px solid #333',
                        animation: 'slideInUp 0.3s ease-out'
                    }}>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{selectedIds.size} seleccionados</div>
                        <div style={{ width: '1px', height: '20px', background: '#444' }} />
                        <button onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e03131', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}><Trash2 size={18} /> ELIMINAR</button>
                        <button onClick={() => setSelectedIds(new Set())} style={{ background: 'transparent', color: '#888', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                    </div>
                )}

                <ConfirmModal 
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                />
                
                <style>{`
                    .selected-row { background-color: #fff9db !important; }
                    .save-btn, .cancel-btn, .edit-btn, .delete-btn {
                        background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: all 0.2s;
                    }
                    .save-btn { color: #2b8a3e; } .save-btn:hover { background: #ebfbee; }
                    .cancel-btn { color: #888; } .cancel-btn:hover { background: #f1f3f5; }
                    .edit-btn { color: #228be6; } .edit-btn:hover { background: #e7f5ff; }
                    .delete-btn { color: #fa5252; } .delete-btn:hover { background: #fff5f5; }
                `}</style>

                {totalPages > 1 && (
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '10px' }}>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: currentPage === 1 ? '#eee' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
                        >
                            Anterior
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: currentPage === totalPages ? '#eee' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Nueva Compra */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <Plus size={24} color="#f03e3e" /> Registrar Nueva Compra
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>Nombre del Proveedor</label>
                                <input 
                                    type="text" 
                                    value={supplierName} 
                                    onChange={e => setSupplierName(e.target.value)} 
                                    placeholder="Ej: Distribuidora de Carne, Coca Cola..."
                                    required 
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '1rem' }}
                                />
                            </div>

                            {/* Selector de Artículos */}
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                        {isAddingNewItem ? "REGISTRAR PRODUCTO NUEVO" : "Añadir del Inventario"}
                                    </h4>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                                        style={{ background: isAddingNewItem ? '#f03e3e' : '#fff', color: isAddingNewItem ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '900' }}
                                    >
                                        {isAddingNewItem ? "CANCELAR" : "+ PRODUCTO NUEVO"}
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {isAddingNewItem ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Nombre del producto nuevo..." 
                                                value={newItemData.name}
                                                onChange={e => setNewItemData({...newItemData, name: e.target.value})}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                <select 
                                                    value={newItemData.unit}
                                                    onChange={e => setNewItemData({...newItemData, unit: e.target.value})}
                                                    style={{ flex: '1 1 120px', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                                >
                                                    <option value="unidades">Unidades</option>
                                                    <option value="kg">Kilogramos</option>
                                                    <option value="litros">Litros</option>
                                                    <option value="gramos">Gramos</option>
                                                    <option value="paquetes">Paquetes</option>
                                                </select>
                                                <select 
                                                    value={newItemData.category}
                                                    onChange={e => setNewItemData({...newItemData, category: e.target.value})}
                                                    style={{ flex: '1 1 120px', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                                >
                                                    <option value="Mercadería">Mercadería</option>
                                                    <option value="Materia Prima">Materia Prima</option>
                                                    <option value="Bebidas">Bebidas</option>
                                                    <option value="Limpieza">Limpieza</option>
                                                    <option value="Otros">Otros</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <select 
                                            value={selectedItemId} 
                                            onChange={e => setSelectedItemId(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                        >
                                            <option value="">Seleccionar del Inventario...</option>
                                            {inventoryItems.map(i => (
                                                <option key={i.id} value={i.id} style={{ color: '#000' }}>{i.name} ({i.category})</option>
                                            ))}
                                        </select>
                                    )}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column' }}>
                                            <input 
                                                type="number" 
                                                placeholder="Cant." 
                                                step="0.1"
                                                value={itemQty} 
                                                onChange={e => setItemQty(e.target.value)} 
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                                            <input 
                                                type="number" 
                                                placeholder="Costo total ($)" 
                                                value={itemCost} 
                                                onChange={e => setItemCost(e.target.value)} 
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem' }}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={addItemToOrder}
                                        disabled={isSaving}
                                        style={{ background: '#333', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                                    >
                                        {isAddingNewItem ? "CREAR Y AÑADIR" : "AÑADIR AL LISTADO"}
                                    </button>
                                </div>
                            </div>

                            {/* Listado de items en el ticket */}
                            {orderItems.length > 0 && (
                                <div className="accounting-table-container" style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table className="accounting-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Cant.</th>
                                                <th className="txt-right">Costo</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map((oi, index) => (
                                                <tr key={index}>
                                                    <td data-label="Item">{oi.name}</td>
                                                    <td data-label="Cant.">{oi.quantity}</td>
                                                    <td data-label="Costo" className="txt-right">${oi.cost.toLocaleString('es-AR')}</td>
                                                    <td data-label="Acción" style={{ textAlign: 'center' }}>
                                                        <button type="button" onClick={() => removeItemFromOrder(index)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ padding: '15px', background: '#fff5f5', textAlign: 'right', fontWeight: 'bold', fontSize: '1.5rem', color: '#f03e3e' }}>
                                        Total: ${totalCalculatedCost.toLocaleString('es-AR')}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isSaving || orderItems.length === 0}
                                className="main-button"
                                style={{ 
                                    background: orderItems.length > 0 ? '#f03e3e' : '#ccc', 
                                    color: 'white', border: 'none', padding: '15px', 
                                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
                                    fontSize: '1.1rem'
                                }}
                            >
                                <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                                {isSaving ? "PROCESANDO COMPRA..." : "REGISTRAR EN ALMACÉN"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal para detalle de pedido */}
            {selectedOrder && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setSelectedOrder(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 3000
                    }}
                >
                    <div 
                        className="admin-card" 
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '90%', maxWidth: '600px', maxHeight: '80vh',
                            overflowY: 'auto', border: '1px solid #f03e3e',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#f03e3e' }}>TICKET DE COMPRA</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>
                                    {new Date(selectedOrder.date).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </header>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase' }}>Proveedor</label>
                            <p style={{ margin: '5px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedOrder.supplier_name}</p>
                        </div>
                        
                        <div className="accounting-table-container">
                            <table className="accounting-table" style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>Artículo</th>
                                        <th>Cant.</th>
                                        <th className="txt-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map(item => (
                                        <tr key={item.id}>
                                            <td data-label="Artículo">{item.item_name}</td>
                                            <td data-label="Cant.">{item.quantity}</td>
                                            <td data-label="Subtotal" className="txt-right">
                                                ${parseFloat(item.cost).toLocaleString('es-AR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style={{ textAlign: 'right', marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', borderTop: '2px solid #f03e3e' }}>
                            <p style={{ margin: 0, color: '#333', fontSize: '0.85rem', fontWeight: '800' }}>TOTAL DE COMPRA</p>
                            <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: '#f03e3e' }}>
                                ${parseFloat(selectedOrder.total_cost).toLocaleString('es-AR')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal para Límite Mínimo de Almacén */}
            {showMinStockModal && (
                <div 
                    className="modal-overlay" 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 6000
                    }}
                >
                    <div 
                        className="admin-card" 
                        style={{
                            width: '100%', maxWidth: '400px', padding: '30px',
                            textAlign: 'center', border: '1px solid var(--admin-primary)'
                        }}
                    >
                        <ShoppingCart size={40} color="var(--admin-primary)" style={{ marginBottom: '15px' }} />
                        <h3 style={{ margin: '0 0 10px 0' }}>Límite de Stock Mínimo</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
                            ¿Cuál es la cantidad mínima de <strong>{newItemData.name}</strong> que deberías tener siempre en almacén?
                        </p>
                        
                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'left' }}>
                                STOCK MÍNIMO ({newItemData.unit})
                            </label>
                            <input 
                                type="number" 
                                step="any"
                                value={minStockValue} 
                                onChange={e => setMinStockValue(e.target.value)} 
                                autoFocus
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '1.2rem', textAlign: 'center' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setShowMinStockModal(false)}
                                style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={confirmNewItem}
                                style={{ flex: 1, padding: '12px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                DEFINIR Y CREAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierOrders;
