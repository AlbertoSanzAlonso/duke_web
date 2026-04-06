import React, { useState, useEffect } from 'react';
import { 
    fetchSales, fetchSupplierOrders, createSupplierOrder, 
    fetchExpenses, createExpense, deleteExpense, 
    deleteSale, deleteSupplierOrder, updateExpense, 
    updateSupplierOrder, updateSale 
} from '../../services/api';
import './Accounting.css';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Save, X, Trash2, Edit2, Search, Filter, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

const Accounting = () => {
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

    // Edit states
    const [editingId, setEditingId] = useState(null); // format: 'type-id' e.g. 'exp-1'
    const [editForm, setEditForm] = useState({ description: '', amount: '', category: '' });

    // ... (rest of form states)
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Otros');

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

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!desc || !amount) return;
        setIsSaving(true);
        try {
            await createExpense({
                description: desc,
                amount: parseFloat(amount),
                category: category
            });
            setDesc('');
            setAmount('');
            setToast({ message: "Gasto registrado correctamente", type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al registrar el gasto", type: 'error' });
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
        if (!window.confirm("¿Eliminar este gasto?")) return;
        try {
            await deleteExpense(id);
            setToast({ message: "Gasto eliminado", type: 'success' });
            loadData();
        } catch (error) {
            setToast({ message: "Error al eliminar", type: 'error' });
        }
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
                    <button onClick={() => handleUpdate(type, item.id)} className="save-btn" title="Guardar"><Save size={18} /></button>
                    <button onClick={() => setEditingId(null)} className="cancel-btn" title="Cancelar"><X size={18} /></button>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => startEditing(type, item)} className="edit-btn" title="Editar"><Edit2 size={18} /></button>
                <button onClick={() => {
                    if (type === 'exp') handleDeleteExpense(item.id);
                    else if (type === 'ord') {
                        if(window.confirm(`¿Eliminar pedido de ${item.supplier_name}?`)) {
                            deleteSupplierOrder(item.id).then(() => { setToast({message:"Pedido eliminado", type:'success'}); loadData(); });
                        }
                    } else if (type === 'sal') {
                        if(window.confirm(`¿Eliminar registro de venta #${item.id}?`)) {
                            deleteSale(item.id).then(() => { setToast({message:"Venta eliminada", type:'success'}); loadData(); });
                        }
                    }
                }} className="delete-btn" title="Eliminar"><Trash2 size={18} /></button>
            </div>
        );
    };

    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'

    const filterItems = (items) => {
        const now = new Date();
        return items.filter(item => {
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

            // 2. CATEGORY FILTER
            if (selectedCategory !== 'ALL') {
                if (item.category !== selectedCategory) return false;
            }

            // 3. SEARCH FILTER (Keyword)
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const description = (item.description || item.customer_name || item.supplier_name || "").toLowerCase();
            const amount = item.amount || item.total_amount || item.total_cost || "";
            const matchesSearch = description.includes(term) || amount.toString().includes(term);
            
            return matchesSearch;
        });
    };

    const filteredSales = (selectedType === 'ALL' || selectedType === 'INCOME') ? filterItems(sales) : [];
    const filteredSupplierOrders = (selectedType === 'ALL' || selectedType === 'EXPENSE') ? filterItems(supplierOrders) : [];
    const filteredExpenses = (selectedType === 'ALL' || selectedType === 'EXPENSE') ? filterItems(manualExpenses) : [];

    const totalIncome = filteredSales.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
    const totalSupplierDebt = filteredSupplierOrders.reduce((acc, o) => acc + parseFloat(o.total_cost), 0);
    const totalManualExpenses = filteredExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
    const totalExpenses = totalSupplierDebt + totalManualExpenses;
    const balance = totalIncome - totalExpenses;

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content accounting-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <header className="accounting-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2>Contabilidad Duke</h2>
                        <p>Análisis financiero detallado</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="search-bar" style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', minWidth: '180px', fontSize: '0.9rem', width: '100%' }}
                                />
                            </div>
                            <button 
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: showAdvancedFilters ? '#333' : '#fff', color: showAdvancedFilters ? '#ffffff' : '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                <Filter size={18} style={{ color: showAdvancedFilters ? '#ffffff' : '#333' }} />
                                <span className="hide-mobile" style={{ color: showAdvancedFilters ? '#ffffff' : '#333' }}>Filtros</span>
                            </button>
                        </div>
                        <div className="period-toggle">
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

            <div className="accounting-main-layout">
                <div className="accounting-forms">
                    <div className="admin-card">
                        <h3>Gasto Fijo / Varios</h3>
                        <form onSubmit={handleAddExpense} className="accounting-form">
                            <div className="form-group">
                                <label>Descripción del Gasto</label>
                                <input 
                                    type="text" 
                                    value={desc} 
                                    onChange={e => setDesc(e.target.value)} 
                                    placeholder="Ej: Luz, Alquiler, Sueldos..."
                                    required/ >
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Importe ($)</label>
                                    <input 
                                        type="number"
                                        step="100" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        placeholder="0"
                                        required/ >
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="Local">Local / Suministros</option>
                                        <option value="Sueldos">Sueldos / Personal</option>
                                        <option value="Mercadería">Mercadería</option>
                                        <option value="Publicidad">Publicidad</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="main-button" disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Registrar Gasto"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="accounting-history">
                    <div className="admin-card">
                        <h3>Historial de Movimientos</h3>
                        <div className="accounting-table-container">
                            <table className="accounting-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Descripción / Origen</th>
                                        <th>Categoría</th>
                                        <th className="txt-right">Importe</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(e => {
                                        const isEditing = editingId === `exp-${e.id}`;
                                        return (
                                            <tr key={`me-${e.id}`}>
                                                <td data-label="Fecha">{new Date(e.date).toLocaleDateString()}</td>
                                                <td data-label="Tipo"><span className="badge badge-manual">Gasto</span></td>
                                                <td data-label="Descripción">
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editForm.description} 
                                                            onChange={val => setEditForm({...editForm, description: val.target.value})}
                                                            className="inline-edit-input"
                                                        />
                                                    ) : e.description}
                                                </td>
                                                <td data-label="Categoría">
                                                    {isEditing ? (
                                                        <select 
                                                            value={editForm.category} 
                                                            onChange={val => setEditForm({...editForm, category: val.target.value})}
                                                            className="inline-edit-input"
                                                        >
                                                            <option value="Local">Local / Suministros</option>
                                                            <option value="Sueldos">Sueldos / Personal</option>
                                                            <option value="Mercadería">Mercadería</option>
                                                            <option value="Publicidad">Publicidad</option>
                                                            <option value="Otros">Otros</option>
                                                        </select>
                                                    ) : e.category}
                                                </td>
                                                <td data-label="Importe" className="txt-right negative">
                                                    {isEditing ? (
                                                        <input 
                                                            type="number" 
                                                            value={editForm.amount} 
                                                            onChange={val => setEditForm({...editForm, amount: val.target.value})}
                                                            className="inline-edit-input txt-right"
                                                            style={{ width: '100px' }}
                                                        />
                                                    ) : `-$${Math.round(parseFloat(e.amount)).toLocaleString('es-AR')}`}
                                                </td>
                                                <td data-label="Acción">
                                                    {renderActionButtons('exp', e)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredSupplierOrders.map(o => {
                                        const isEditing = editingId === `ord-${o.id}`;
                                        return (
                                            <tr key={`so-${o.id}`}>
                                                <td data-label="Fecha">{new Date(o.date).toLocaleDateString()}</td>
                                                <td data-label="Tipo"><span className="badge badge-order">Proveedor</span></td>
                                                <td data-label="Descripción">
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editForm.description} 
                                                            onChange={val => setEditForm({...editForm, description: val.target.value})}
                                                            className="inline-edit-input"
                                                        />
                                                    ) : `${o.supplier_name} (Pedido #${o.id})`}
                                                </td>
                                                <td data-label="Categoría">Materia Prima</td>
                                                <td data-label="Importe" className="txt-right negative">
                                                    {isEditing ? (
                                                        <input 
                                                            type="number" 
                                                            value={editForm.amount} 
                                                            onChange={val => setEditForm({...editForm, amount: val.target.value})}
                                                            className="inline-edit-input txt-right"
                                                            style={{ width: '100px' }}
                                                        />
                                                    ) : `-$${Math.round(parseFloat(o.total_cost)).toLocaleString('es-AR')}`}
                                                </td>
                                                <td data-label="Acción">
                                                    {renderActionButtons('ord', o)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredSales.slice(0, 50).map(s => {
                                        const isEditing = editingId === `sal-${s.id}`;
                                        return (
                                            <tr key={`s-${s.id}`}>
                                                <td data-label="Fecha">{new Date(s.date).toLocaleDateString()}</td>
                                                <td data-label="Tipo"><span className="badge badge-income">Ingreso</span></td>
                                                <td data-label="Descripción">
                                                    {isEditing ? (
                                                        <input 
                                                            type="text" 
                                                            value={editForm.description} 
                                                            onChange={val => setEditForm({...editForm, description: val.target.value})}
                                                            className="inline-edit-input"
                                                        />
                                                    ) : `Venta #${s.id} ${s.customer_name ? `(${s.customer_name})` : ''}`}
                                                </td>
                                                <td data-label="Categoría">Venta TPV</td>
                                                <td data-label="Importe" className="txt-right positive">
                                                    {isEditing ? (
                                                        <input 
                                                            type="number" 
                                                            value={editForm.amount} 
                                                            onChange={val => setEditForm({...editForm, amount: val.target.value})}
                                                            className="inline-edit-input txt-right"
                                                            style={{ width: '100px' }}
                                                        />
                                                    ) : `+$${Math.round(parseFloat(s.total_amount)).toLocaleString('es-AR')}`}
                                                </td>
                                                <td data-label="Acción">
                                                    {renderActionButtons('sal', s)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accounting;
