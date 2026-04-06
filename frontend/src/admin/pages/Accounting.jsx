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
import { Trash2, Edit2, Save, X } from 'lucide-react';

const Accounting = () => {
    const [sales, setSales] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [manualExpenses, setManualExpenses] = useState([]);
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

    const totalIncome = sales.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
    const totalSupplierDebt = supplierOrders.reduce((acc, o) => acc + parseFloat(o.total_cost), 0);
    const totalManualExpenses = manualExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
    const totalExpenses = totalSupplierDebt + totalManualExpenses;
    const balance = totalIncome - totalExpenses;

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content accounting-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <header className="accounting-header">
                <h2>Balance General</h2>
                <p>Resumen financiero de Duke Burger</p>
            </header>

            <div className="accounting-summary-grid">
                <div className="summary-card income">
                    <h3>Ingresos</h3>
                    <p className="amount">+${Math.round(totalIncome).toLocaleString('es-AR')}</p>
                    <span>Ventas finalizadas</span>
                </div>
                <div className="summary-card expenses">
                    <h3>Gastos</h3>
                    <p className="amount">-${Math.round(totalExpenses).toLocaleString('es-AR')}</p>
                    <span>Proveedores + Gastos manuales</span>
                </div>
                <div className="summary-card balance">
                    <h3>Beneficio Neto</h3>
                    <p className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                        ${Math.round(balance).toLocaleString('es-AR')}
                    </p>
                    <span>Balance total</span>
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
                                        <option value="Suministros">Suministros</option>
                                        <option value="Alquiler">Alquiler</option>
                                        <option value="Personal">Personal</option>
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
                                    {manualExpenses.map(e => {
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
                                                            <option value="Suministros">Suministros</option>
                                                            <option value="Alquiler">Alquiler</option>
                                                            <option value="Personal">Personal</option>
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
                                    {supplierOrders.map(o => {
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
                                    {sales.slice(0, 50).map(s => {
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
