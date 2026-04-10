import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    fetchSales, fetchSupplierOrders, createSupplierOrder, 
    fetchExpenses, createExpense, deleteExpense, 
    deleteSale, deleteSupplierOrder, updateExpense, 
    updateSupplierOrder, updateSale 
} from '../../services/api';
import './Accounting.css';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { Save, X, Trash2, Edit2, Search, Filter, Calendar as CalendarIcon, ChevronDown, ChevronUp, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Plus, CheckSquare, Square } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const Accounting = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [sales, setSales] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [manualExpenses, setManualExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedType, setSelectedType] = useState('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); 
    
    const [isSaving, setIsSaving] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form and Modal states for NEW movements
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [movementType, setMovementType] = useState('EXPENSE'); // 'EXPENSE' or 'INCOME'
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Otros');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'new') {
            setIsAddModalOpen(true);
        }
    }, [location]);

    // Edit states
    const [editingId, setEditingId] = useState(null); // format: 'type-id' e.g. 'exp-1'
    const [editForm, setEditForm] = useState({ description: '', amount: '', category: '' });
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    
    // Confirm Modal state
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    
    // Detail Modal state
    const [detailItem, setDetailItem] = useState(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, ordersData, expensesData] = await Promise.all([
                fetchSales(),
                fetchSupplierOrders(),
                fetchExpenses()
            ]);
            
            // Only consider completed sales for income
            setSales(salesData.filter(s => s.status === 'COMPLETED'));
            // Only consider delivered orders for real expenses
            setSupplierOrders(ordersData.filter(o => o.status === 'DELIVERED'));
            setManualExpenses(expensesData);
        } catch (error) {
            console.error("Error loading accounting data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMovement = async (e) => {
        e.preventDefault();
        if (!desc || !amount) return;
        setIsSaving(true);
        try {
            // For Income, we use a specific category or flag
            const finalCategory = movementType === 'INCOME' ? 'Ingreso Manual' : category;
            
            await createExpense({
                description: desc,
                amount: parseFloat(amount),
                category: finalCategory
            });
            
            setDesc('');
            setAmount('');
            setIsAddModalOpen(false);
            setToast({ message: `${movementType === 'INCOME' ? 'Ingreso' : 'Gasto'} registrado correctamente`, type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al registrar el movimiento", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSupplierOrder = async (e) => {
        e.preventDefault();
        if (!supplierName || !supplierCost) return;
        setIsSaving(true);
        try {
            await createSupplierOrder({
                supplier_name: supplierName,
                total_cost: parseFloat(supplierCost),
                status: 'DELIVERED',
                items: [] // Simple order without per-item tracking for accounting
            });
            setSupplierName('');
            setSupplierCost('');
            setToast({ message: "Pago a proveedor registrado", type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al registrar pedido", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        setConfirmConfig({
            isOpen: true,
            title: '¿ELIMINAR GASTO?',
            message: 'Esta acción no se puede deshacer y afectará al balance contable.',
            onConfirm: async () => {
                try {
                    await deleteExpense(id);
                    setToast({ message: "Gasto eliminado", type: 'success' });
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    loadData();
                } catch (error) {
                    setToast({ message: "Error al eliminar", type: 'error' });
                }
            }
        });
    };

    const handleUpdate = async (type, id) => {
        setIsSaving(true);
        try {
            const data = {
                description: editForm.description,
                amount: parseFloat(editForm.amount),
                total_cost: parseFloat(editForm.amount), // for orders
                total_amount: parseFloat(editForm.amount), // for sales
                customer_name: editForm.description, // for sales
                supplier_name: editForm.description, // for orders
                category: editForm.category
            };

            if (type === 'exp') await updateExpense(id, data);
            else if (type === 'ord') await updateSupplierOrder(id, data);
            else if (type === 'sal') await updateSale(id, data);

            setEditingId(null);
            setToast({ message: "Registro actualizado", type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al actualizar", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (type, item) => {
        setEditingId(`${type}-${item.id}`);
        setEditForm({
            description: type === 'exp' ? item.description : type === 'ord' ? item.supplier_name : item.customer_name || `Venta #${item.id}`,
            amount: type === 'exp' ? item.amount : type === 'ord' ? item.total_cost : item.total_amount,
            category: item.category || ''
        });
    };

    const renderActionButtons = (type, item) => {
        const isEditing = editingId === `${type}-${item.id}`;
        if (isEditing) {
            return (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleUpdate(type, item.id); }} className="save-btn" title="Guardar"><Save size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="cancel-btn" title="Cancelar"><X size={18} /></button>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {type === 'sal' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`/ticket/${item.id}`, '_blank'); }} 
                        className="edit-btn" 
                        title="Ver Ticket"
                        style={{ color: '#7950f2' }}
                    >
                        <FileText size={18} />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); startEditing(type, item); }} className="edit-btn" title="Editar"><Edit2 size={18} /></button>
                <button onClick={(e) => {
                    e.stopPropagation();
                    if (type === 'exp') handleDeleteExpense(item.id);
                    else if (type === 'ord') {
                        setConfirmConfig({
                            isOpen: true,
                            title: '¿ELIMINAR PEDIDO?',
                            message: `¿Estás seguro de eliminar el pedido de ${item.supplier_name}?`,
                            onConfirm: async () => {
                                await deleteSupplierOrder(item.id);
                                setToast({message:"Pedido eliminado", type:'success'});
                                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                loadData();
                            }
                        });
                    } else if (type === 'sal') {
                        setConfirmConfig({
                            isOpen: true,
                            title: '¿ELIMINAR VENTA?',
                            message: `¿Estás seguro de eliminar el registro de venta #${item.id}? Esto no anula el ticket físico pero sí el registro contable.`,
                            onConfirm: async () => {
                                await deleteSale(item.id);
                                setToast({message:"Venta eliminada", type:'success'});
                                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                loadData();
                            }
                        });
                    }
                }} className="delete-btn" title="Eliminar"><Trash2 size={18} /></button>
            </div>
        );
    };

    const toggleSelect = (type, id) => {
        const key = `${type}-${id}`;
        const newSelected = new Set(selectedIds);
        if (newSelected.has(key)) newSelected.delete(key);
        else newSelected.add(key);
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === paginatedItems.length) {
            setSelectedIds(new Set());
        } else {
            const keys = paginatedItems.map(item => `${item.typeIndicator}-${item.id}`);
            setSelectedIds(new Set(keys));
        }
    };

    const handleBulkDelete = () => {
        setConfirmConfig({
            isOpen: true,
            title: `¿ELIMINAR ${selectedIds.size} REGISTROS?`,
            message: 'Se eliminarán permanentemente todos los registros seleccionados. Esta operación puede tardar unos segundos.',
            onConfirm: async () => {
                const idsArray = Array.from(selectedIds);
                let deletedCount = 0;
                
                for (const key of idsArray) {
                    const [type, id] = key.split('-');
                    try {
                        if (type === 'exp') await deleteExpense(id);
                        else if (type === 'ord') await deleteSupplierOrder(id);
                        else if (type === 'sal') await deleteSale(id);
                        deletedCount++;
                    } catch (e) {
                        console.error(`Error deleting ${key}:`, e);
                    }
                }
                
                setToast({ message: `Se han eliminado ${deletedCount} registros correctamente`, type: 'success' });
                setSelectedIds(new Set());
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                loadData();
            }
        });
    };

    const [viewMode, setViewMode] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'

    const filterItems = useCallback((items, currentSearch, currentCategory, currentView, currentStart, currentEnd) => {
        const now = new Date();
        return items.filter(item => {
            if (!item.date) return false;
            // Safari/Mobile fix: Ensure ISO format by replacing the space with 'T' if necessary
            const dateStr = item.date.includes('T') ? item.date : item.date.replace(' ', 'T');
            const itemDate = new Date(dateStr);
            
            // Check if date is valid before filtering
            if (isNaN(itemDate.getTime())) return false;
            
            // 1. DATE RANGE / PERIOD FILTER
            let dateMatch = true;
            if (currentStart || currentEnd) {
                if (currentStart) {
                    const sDate = new Date(currentStart);
                    sDate.setHours(0,0,0,0);
                    if (itemDate < sDate) dateMatch = false;
                }
                if (currentEnd) {
                    const eDate = new Date(currentEnd);
                    eDate.setHours(23,59,59,999);
                    if (itemDate > eDate) dateMatch = false;
                }
            } else {
                // Default Period Filter
                if (currentView === 'daily') {
                    dateMatch = itemDate.toDateString() === now.toDateString();
                } else if (currentView === 'weekly') {
                    const diffTime = Math.abs(now - itemDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    dateMatch = diffDays <= 7;
                } else if (currentView === 'monthly') {
                    dateMatch = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                }
            }
            if (!dateMatch) return false;

            // 2. CATEGORY FILTER
            if (currentCategory !== 'ALL') {
                if (item.category !== currentCategory) return false;
            }

            // 3. SEARCH FILTER (Keyword)
            if (!currentSearch) return true;
            const term = currentSearch.toLowerCase();
            const description = (item.description || item.customer_name || item.supplier_name || "").toLowerCase();
            const amount = item.amount || item.total_amount || item.total_cost || "";
            const matchesSearch = description.includes(term) || amount.toString().includes(term);
            
            return matchesSearch;
        });
    }, []);

    const { 
        filteredSales, filteredSupplierOrders, filteredExpenses, 
        totalIncome, totalExpenses, balance, mergedItems, totalPages 
    } = useMemo(() => {
        const fSales = (selectedType === 'ALL' || selectedType === 'INCOME') 
            ? filterItems(sales, searchTerm, selectedCategory, viewMode, startDate, endDate) 
            : [];
        const fOrders = (selectedType === 'ALL' || selectedType === 'EXPENSE') 
            ? filterItems(supplierOrders, searchTerm, selectedCategory, viewMode, startDate, endDate) 
            : [];
        const fExpenses = (selectedType === 'ALL' || selectedType === 'EXPENSE') 
            ? filterItems(manualExpenses, searchTerm, selectedCategory, viewMode, startDate, endDate) 
            : [];

        const income = fSales.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
        const debt = fOrders.reduce((acc, o) => acc + parseFloat(o.total_cost), 0);
        const manual = fExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
        const exp = debt + manual;
        
        const merged = [
            ...fExpenses.map(e => ({ ...e, typeIndicator: 'exp' })),
            ...fOrders.map(o => ({ ...o, typeIndicator: 'ord' })),
            ...fSales.map(s => ({ ...s, typeIndicator: 'sal' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
            filteredSales: fSales,
            filteredSupplierOrders: fOrders,
            filteredExpenses: fExpenses,
            totalIncome: income,
            totalExpenses: exp,
            balance: income - exp,
            mergedItems: merged,
            totalPages: Math.ceil(merged.length / itemsPerPage)
        };
    }, [sales, supplierOrders, manualExpenses, searchTerm, selectedCategory, viewMode, startDate, endDate, selectedType, filterItems]);

    const paginatedItems = useMemo(() => mergedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [mergedItems, currentPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, selectedCategory, selectedType, viewMode]);

    const getPageNumbers = () => {
        const pages = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleExportExcel = () => {
        const data = mergedItems.map(item => ({
            Fecha: new Date(item.date).toLocaleString('es-AR'),
            Tipo: item.typeIndicator === 'sal' ? 'Ingreso' : 'Egreso',
            Descripción: item.typeIndicator === 'exp' ? item.description : 
                        item.typeIndicator === 'ord' ? item.supplier_name : 
                        `Venta #${item.id}`,
            Categoría: item.typeIndicator === 'exp' ? item.category : 
                       item.typeIndicator === 'ord' ? 'Materia Prima' : 'Venta TPV',
            Importe: parseFloat(item.total_amount || item.total_cost || item.amount) * (item.typeIndicator === 'sal' ? 1 : -1)
        }));
        exportToExcel(data, `Contabilidad_${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Fecha', dataKey: 'Fecha' },
            { header: 'Tipo', dataKey: 'Tipo' },
            { header: 'Descripción', dataKey: 'Desc' },
            { header: 'Categoría', dataKey: 'Cat' },
            { header: 'Importe', dataKey: 'Imp' }
        ];
        const data = mergedItems.map(item => ({
            Fecha: new Date(item.date).toLocaleDateString('es-AR'),
            Tipo: item.typeIndicator === 'sal' ? 'Ingreso' : 'Egreso',
            Desc: item.typeIndicator === 'exp' ? item.description : 
                  item.typeIndicator === 'ord' ? item.supplier_name : 
                  `Venta #${item.id}`,
            Cat: item.typeIndicator === 'exp' ? item.category : 
                 item.typeIndicator === 'ord' ? 'Materia Prima' : 'Venta TPV',
            Imp: `${item.typeIndicator === 'sal' ? '+' : '-'}$${Math.round(parseFloat(item.total_amount || item.total_cost || item.amount)).toLocaleString('es-AR')}`
        }));
        exportToPDF(data, columns, `Contabilidad_${new Date().toISOString().split('T')[0]}`, 'Reporte Contable Duke', { label: 'Balance de Periodo', value: `$${Math.round(balance).toLocaleString('es-AR')}` });
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content accounting-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <header className="accounting-header">
                <div className="accounting-header-main">
                    <div className="header-info">
                        <h2>Contabilidad Duke</h2>
                        <p>Análisis financiero detallado</p>
                    </div>
                    <div className="header-controls">
                        <div className="controls-row">
                            <div className="search-bar" style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    defaultValue={searchTerm}
                                    onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                                    style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', minWidth: '150px', fontSize: '0.9rem', width: '100%' }}
                                />
                            </div>
                            <button 
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="filter-toggle-btn"
                                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: showAdvancedFilters ? '#333' : '#fff', color: showAdvancedFilters ? '#ffffff' : '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                <Filter size={18} style={{ color: showAdvancedFilters ? '#ffffff' : '#333' }} />
                                <span className="hide-mobile" style={{ color: showAdvancedFilters ? '#ffffff' : '#333' }}>Filtros</span>
                            </button>
                            <div className="export-actions">
                                <button onClick={handleExportExcel} className="export-btn excel" title="Excel"><Download size={18} /></button>
                                <button onClick={handleExportPDF} className="export-btn pdf" title="PDF"><FileText size={18} /></button>
                            </div>
                            <button 
                                onClick={() => { setMovementType('EXPENSE'); setIsAddModalOpen(true); }}
                                className="add-movement-btn"
                            >
                                <Plus size={18} /> <span className="btn-text">NUEVO MOVIMIENTO</span>
                            </button>
                        </div>
                        <div className="period-toggle">
                            <button className={viewMode === 'all' && !startDate && !endDate ? 'active' : ''} onClick={() => { setViewMode('all'); setStartDate(''); setEndDate(''); }}>TODOS</button>
                            <button className={viewMode === 'daily' && !startDate && !endDate ? 'active' : ''} onClick={() => { setViewMode('daily'); setStartDate(''); setEndDate(''); }}>DIARIO</button>
                            <button className={viewMode === 'weekly' && !startDate && !endDate ? 'active' : ''} onClick={() => { setViewMode('weekly'); setStartDate(''); setEndDate(''); }}>SEMANAL</button>
                            <button className={viewMode === 'monthly' && !startDate && !endDate ? 'active' : ''} onClick={() => { setViewMode('monthly'); setStartDate(''); setEndDate(''); }}>MENSUAL</button>
                        </div>
                    </div>
                </div>

                {showAdvancedFilters && (
                    <div className="advanced-filters-panel" style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', animation: 'slideDown 0.3s ease' }}>
                        <div className="filter-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>Desde</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                        </div>
                        <div className="filter-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>Hasta</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                        </div>
                        <div className="filter-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>Categoría</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                <option value="ALL">Todas las categorías</option>
                                <option value="Venta TPV">Ventas (TPV)</option>
                                <option value="Materia Prima">Materia Prima (Proveedores)</option>
                                <option value="Local">Local / Suministros</option>
                                <option value="Sueldos">Sueldos / Personal</option>
                                <option value="Mercadería">Mercadería</option>
                                <option value="Publicidad">Publicidad</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>Tipo</label>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                <option value="ALL">Ingresos y Gastos</option>
                                <option value="INCOME">Solo Ingresos</option>
                                <option value="EXPENSE">Solo Gastos</option>
                            </select>
                        </div>
                        <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); setSelectedCategory('ALL'); setSelectedType('ALL'); setSearchTerm(''); }}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <div className="accounting-summary-grid">
                <div className="summary-card income">
                    <h3>Ingresos</h3>
                    <p className="amount">+${Math.round(totalIncome).toLocaleString('es-AR')}</p>
                    <span>{filteredSales.length} movimientos {startDate || endDate ? 'en el rango seleccionado' : viewMode === 'daily' ? 'de hoy' : viewMode === 'weekly' ? 'esta semana' : 'del mes'}</span>
                </div>
                <div className="summary-card expenses">
                    <h3>Gastos</h3>
                    <p className="amount">-${Math.round(totalExpenses).toLocaleString('es-AR')}</p>
                    <span>{filteredSupplierOrders.length + filteredExpenses.length} movimientos de salida</span>
                </div>
                <div className="summary-card balance">
                    <h3>Beneficio Neto</h3>
                    <p className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                        ${Math.round(balance).toLocaleString('es-AR')}
                    </p>
                    <span>Cuentas del periodo actual filtrado</span>
                </div>
            </div>

            <div className="accounting-main-layout" style={{ gridTemplateColumns: '1fr' }}>
                <div className="accounting-history" style={{ gridColumn: '1 / -1' }}>
                    <div className="admin-card">
                        <h3>Historial de Movimientos</h3>
                        <div className="accounting-table-container">
                            <table className="accounting-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                {selectedIds.size === paginatedItems.length && paginatedItems.length > 0 ? <CheckSquare size={18} color="var(--admin-primary)" /> : <Square size={18} color="#999" />}
                                            </button>
                                        </th>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Descripción / Origen</th>
                                        <th>Categoría</th>
                                        <th className="txt-right">Importe</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {paginatedItems.length > 0 ? paginatedItems.map(item => {
                                    const type = item.typeIndicator;
                                    const isEditing = editingId === `${type}-${item.id}`;
                                    // Safari/Mobile fix: handle non-ISO space-separated dates with safety check
                                    const dStr = (item.date || "").includes('T') ? item.date : (item.date || "").replace(' ', 'T');
                                    const dateObj = new Date(dStr);
                                    
                                    // Detect amounts based on type
                                    const amountVal = type === 'exp' ? item.amount : type === 'ord' ? item.total_cost : item.total_amount;
                                    const description = type === 'exp' ? item.description : type === 'ord' ? `${item.supplier_name} (Pedido #${item.id})` : `Venta #${item.id} ${item.customer_name ? `(${item.customer_name})` : ''}`;
                                    const categoryLabel = type === 'exp' ? item.category : type === 'ord' ? 'Materia Prima' : 'Venta TPV';
                                    const badgeClass = type === 'exp' ? 'badge-manual' : type === 'ord' ? 'badge-order' : 'badge-income';
                                    const badgeLabel = type === 'exp' ? 'Gasto' : type === 'ord' ? 'Proveedor' : 'Ingreso';
                                    const isPositive = type === 'sal';

                                    return (
                                        <tr 
                                            key={`${type}-${item.id}`} 
                                            className={`${isPositive ? 'row-income' : 'row-expense'} clickable-row ${selectedIds.has(`${type}-${item.id}`) ? 'selected-row' : ''}`}
                                            onClick={() => !editingId && setDetailItem(item)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td onClick={(e) => { e.stopPropagation(); toggleSelect(type, item.id); }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedIds.has(`${type}-${item.id}`) ? <CheckSquare size={18} color="var(--admin-primary)" /> : <Square size={18} color="#ddd" />}
                                                </div>
                                            </td>
                                            <td data-label="Fecha">
                                                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                                    <strong>{dateObj.toLocaleDateString('es-AR')}</strong>
                                                    <small style={{ color: '#888' }}>{dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</small>
                                                </div>
                                            </td>
                                            <td data-label="Tipo"><span className={`badge ${badgeClass}`}>{badgeLabel}</span></td>
                                            <td data-label="Descripción">
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.description} 
                                                        onChange={val => setEditForm({...editForm, description: val.target.value})}
                                                        className="inline-edit-input"
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : description}
                                            </td>
                                            <td data-label="Categoría">
                                                {isEditing ? (
                                                    <select 
                                                        value={editForm.category} 
                                                        onChange={val => setEditForm({...editForm, category: val.target.value})}
                                                        className="inline-edit-input"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <option value="Local">Local / Suministros</option>
                                                        <option value="Sueldos">Sueldos / Personal</option>
                                                        <option value="Mercadería">Mercadería</option>
                                                        <option value="Publicidad">Publicidad</option>
                                                        <option value="Venta TPV">Venta TPV</option>
                                                        <option value="Materia Prima">Materia Prima</option>
                                                        <option value="Otros">Otros</option>
                                                    </select>
                                                ) : categoryLabel}
                                            </td>
                                            <td data-label="Importe" className={`txt-right ${isPositive ? 'positive' : 'negative'}`}>
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        value={editForm.amount} 
                                                        onChange={val => setEditForm({...editForm, amount: val.target.value})}
                                                        className="inline-edit-input txt-right"
                                                        style={{ width: '140px' }}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : `${isPositive ? '+' : '-'}$${Math.round(parseFloat(amountVal)).toLocaleString('es-AR')}`}
                                            </td>
                                            <td data-label="Acción">
                                                {renderActionButtons(type, item)}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                                <Filter size={48} opacity={0.3} />
                                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No se encontraron movimientos</p>
                                                <p style={{ fontSize: '0.9rem' }}>Prueba a cambiar los filtros o el periodo seleccionado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '25px', padding: '10px' }}>
                                <button 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={currentPage === 1}
                                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#ccc' : '#333' }}
                                >
                                    <ChevronsLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                    disabled={currentPage === 1}
                                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#ccc' : '#333' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {getPageNumbers().map(num => (
                                        <button 
                                            key={num} 
                                            onClick={() => setCurrentPage(num)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                background: currentPage === num ? '#333' : '#fff',
                                                color: currentPage === num ? '#fff' : '#333',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                minWidth: '40px'
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                                    disabled={currentPage === totalPages}
                                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#ccc' : '#333' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(totalPages)} 
                                    disabled={currentPage === totalPages}
                                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#ccc' : '#333' }}
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {detailItem && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '20px' }}
                    onClick={() => setDetailItem(null)}
                >
                    <div 
                        style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '15px', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Detalle de {detailItem.typeIndicator === 'sal' ? 'Venta' : 'Operación'}</h3>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                    {new Date(detailItem.date).toLocaleDateString('es-AR')} - {new Date(detailItem.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                </div>
                            </div>
                            <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#888' }}>×</button>
                        </div>
                        
                        <div style={{ padding: '25px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>
                                    Descripción / Origen
                                </label>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                    {detailItem.typeIndicator === 'exp' ? detailItem.description : 
                                     detailItem.typeIndicator === 'ord' ? `${detailItem.supplier_name} (Pedido #${detailItem.id})` : 
                                     `Venta #${detailItem.id} ${detailItem.customer_name ? `(${detailItem.customer_name})` : ''}`}
                                </div>
                            </div>

                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>
                                {detailItem.items?.length > 0 ? 'Artículos' : 'Notas / Categoría'}
                            </label>
                            
                            <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#fcfcfc', borderRadius: '10px', border: '1px solid #f1f3f5', padding: '10px' }}>
                                {detailItem.items && detailItem.items.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {detailItem.items.map((it, idx) => {
                                            const itemName = it.item_name || it.entry_name || it.product_name || 'Producto';
                                            const isOrder = it.cost !== undefined;
                                            
                                            let lineTotal, unitPrice;
                                            if (isOrder) {
                                                lineTotal = parseFloat(it.cost || 0);
                                                unitPrice = it.quantity > 0 ? lineTotal / it.quantity : 0;
                                            } else {
                                                unitPrice = parseFloat(it.price_at_sale || it.price || 0);
                                                lineTotal = unitPrice * it.quantity;
                                            }

                                            return (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx === detailItem.items.length -1 ? 'none' : '1px solid #eee', paddingBottom: '8px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{itemName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                            {parseFloat(it.quantity).toLocaleString('es-AR')} x ${Math.round(unitPrice).toLocaleString('es-AR')}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: 'bold' }}>
                                                        ${Math.round(lineTotal).toLocaleString('es-AR')}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ padding: '10px', color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                        {detailItem.notes || `Categoría: ${detailItem.category || 'Otros'}`}
                                    </div>
                                )}
                            </div>
                            
                            {/* ADICIONALES (ENVIO / DESCUENTO) */}
                            {detailItem.typeIndicator === 'sal' && (
                                <div style={{ marginTop: '15px' }}>
                                    {parseFloat(detailItem.delivery_cost || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ae3ec9', marginBottom: '4px' }}>
                                            <span>Cargo de Envío:</span>
                                            <strong>+${parseFloat(detailItem.delivery_cost).toLocaleString('es-AR')}</strong>
                                        </div>
                                    )}
                                    {(() => {
                                        const subtotalItems = (detailItem.items || []).reduce((acc, it) => acc + (parseFloat(it.price_at_sale || it.price || 0) * it.quantity), 0);
                                        const expectedTotal = subtotalItems + parseFloat(detailItem.delivery_cost || 0);
                                        const discount = expectedTotal - parseFloat(detailItem.total_amount || 0);
                                        if (discount > 1) { 
                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#f03e3e', padding: '4px 0' }}>
                                                    <span style={{ fontWeight: '600' }}>Descuento aplicado:</span>
                                                    <strong style={{ fontWeight: '900' }}>−${Math.round(discount).toLocaleString('es-AR')}</strong>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}

                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase' }}>Total {detailItem.typeIndicator === 'sal' ? 'Cobrado' : 'Gasto'}</span>
                                <span style={{ fontSize: '1.6rem', fontWeight: '900', color: detailItem.typeIndicator === 'sal' ? '#2b8a3e' : '#f03e3e' }}>
                                    {detailItem.typeIndicator === 'sal' ? '+' : '-'}${Math.round(parseFloat(detailItem.total_amount || detailItem.total_cost || detailItem.amount)).toLocaleString('es-AR')}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '15px 20px', background: '#f8f9fa', display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setDetailItem(null)} 
                                style={{ flex: 1, padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                CERRAR
                            </button>
                            {detailItem.typeIndicator === 'sal' && (
                                <button 
                                    onClick={() => window.open(`/ticket/${detailItem.id}`, '_blank')}
                                    style={{ flex: 1, padding: '12px', background: '#333', color: '#fff !important', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    VER TICKET COMPLETO
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Add Movement Modal */}
            {isAddModalOpen && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6500, padding: '20px', backdropFilter: 'blur(5px)' }}
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div 
                        style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', animation: 'modalFadeUp 0.3s ease-out' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase' }}>Registrar Movimiento</h3>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#888' }}>×</button>
                        </div>
                        
                        <div style={{ padding: '30px' }}>
                            {/* Toggle Type */}
                            <div style={{ display: 'flex', background: '#f1f3f5', borderRadius: '15px', padding: '6px', marginBottom: '30px', border: '1px solid #e9ecef' }}>
                                <button 
                                    onClick={() => setMovementType('EXPENSE')}
                                    style={{ flex: 1, padding: '12px 10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: movementType === 'EXPENSE' ? '#f03e3e' : 'transparent', color: movementType === 'EXPENSE' ? '#fff' : '#495057', transition: 'all 0.2s', fontSize: '0.85rem' }}
                                >
                                    GASTO (EGRESO)
                                </button>
                                <button 
                                    onClick={() => setMovementType('INCOME')}
                                    style={{ flex: 1, padding: '12px 10px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: movementType === 'INCOME' ? '#2b8a3e' : 'transparent', color: movementType === 'INCOME' ? '#fff' : '#495057', transition: 'all 0.2s', fontSize: '0.85rem' }}
                                >
                                    INGRESO MANUAL
                                </button>
                            </div>

                            <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</label>
                                    <input 
                                        type="text" 
                                        value={desc} 
                                        onChange={e => setDesc(e.target.value)} 
                                        placeholder={movementType === 'EXPENSE' ? "Ej: Pago de Luz Abril" : "Ej: Cobro evento privado"}
                                        required 
                                        className="modal-input-premium"
                                        style={{ padding: '16px', borderRadius: '14px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', background: '#fdfdfd' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Importe ($)</label>
                                        <input 
                                            type="number" 
                                            step="100"
                                            value={amount} 
                                            onChange={e => setAmount(e.target.value)} 
                                            placeholder="0"
                                            required 
                                            style={{ padding: '16px', borderRadius: '14px', border: '1px solid #ddd', fontSize: '1rem', fontWeight: 'bold', outline: 'none', background: '#fdfdfd' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</label>
                                        {movementType === 'EXPENSE' ? (
                                            <select 
                                                value={category} 
                                                onChange={e => setCategory(e.target.value)}
                                                style={{ padding: '16px', borderRadius: '14px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', cursor: 'pointer', background: 'white' }}
                                            >
                                                <option value="Local">Local / Suministros</option>
                                                <option value="Sueldos">Sueldos / Personal</option>
                                                <option value="Mercadería">Mercadería</option>
                                                <option value="Publicidad">Publicidad</option>
                                                <option value="Varios">Varios</option>
                                                <option value="Otros">Otros</option>
                                            </select>
                                        ) : (
                                            <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #e1f0e5', background: '#f1f8f3', color: '#2b8a3e', fontWeight: '900', fontSize: '0.9rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Ingreso Extra
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    style={{ 
                                        marginTop: '15px', padding: '18px', borderRadius: '14px', border: 'none', 
                                        background: movementType === 'EXPENSE' ? '#f03e3e' : '#2b8a3e', 
                                        color: 'white', fontWeight: '900', fontSize: '1.05rem', cursor: 'pointer',
                                        boxShadow: `0 10px 25px ${movementType === 'EXPENSE' ? 'rgba(240, 62, 62, 0.4)' : 'rgba(43, 138, 62, 0.4)'}`,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {isSaving ? "PROCESANDO..." : `CONFIRMAR ${movementType === 'EXPENSE' ? 'EGRESO' : 'INGRESO'}`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounting;
