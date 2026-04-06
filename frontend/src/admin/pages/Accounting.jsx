import React, { useState, useEffect } from 'react';
import { fetchSales, fetchSupplierOrders, createSupplierOrder, fetchExpenses, createExpense, deleteExpense } from '../../services/api';
import './Accounting.css';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';

const Accounting = () => {
    const [sales, setSales] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [manualExpenses, setManualExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // { message, type }
    
    const [isSaving, setIsSaving] = useState(false);

    // Supplier order form
    const [supplierName, setSupplierName] = useState('');
    const [supplierCost, setSupplierCost] = useState('');

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
                <p>Resumen financiero de Duke Burgers</p>
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
                        <h3>Compra / Pago Proveedor</h3>
                        <form onSubmit={handleAddSupplierOrder} className="accounting-form">
                            <div className="form-group">
                                <label>Concepto (Proveedor/Materia Prima)</label>
                                <input 
                                    type="text" 
                                    value={supplierName} 
                                    onChange={e => setSupplierName(e.target.value)} 
                                    placeholder="Ej: Panadería, Mercado Central..."
                                    required/ >
                            </div>
                            <div className="form-group">
                                <label>Importe Gasto ($)</label>
                                <input 
                                    type="number" 
                                    step="100" 
                                    value={supplierCost} 
                                    onChange={e => setSupplierCost(e.target.value)} 
                                    placeholder="0"
                                    required/ >
                            </div>
                            <button type="submit" className="main-button supplier-btn" disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Registrar Compra"}
                            </button>
                        </form>
                    </div>

                    <div className="admin-card" style={{ marginTop: '20px' }}>
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
                            <button type="submit" className="outline-button" disabled={isSaving}>
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
                                    {manualExpenses.map(e => (
                                        <tr key={`me-${e.id}`}>
                                            <td data-label="Fecha">{new Date(e.date).toLocaleDateString()}</td>
                                            <td data-label="Tipo"><span className="badge badge-manual">Gasto</span></td>
                                            <td data-label="Descripción">{e.description}</td>
                                            <td data-label="Categoría">{e.category}</td>
                                            <td data-label="Importe" className="txt-right negative">-${Math.round(parseFloat(e.amount)).toLocaleString('es-AR')}</td>
                                            <td data-label="Acción">
                                                <button onClick={() => handleDeleteExpense(e.id)} className="delete-btn">×</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {supplierOrders.map(o => (
                                        <tr key={`so-${o.id}`}>
                                            <td data-label="Fecha">{new Date(o.date).toLocaleDateString()}</td>
                                            <td data-label="Tipo"><span className="badge badge-order">Proveedor</span></td>
                                            <td data-label="Descripción">{o.supplier_name} (Pedido #{o.id})</td>
                                            <td data-label="Categoría">Materia Prima</td>
                                            <td data-label="Importe" className="txt-right negative">-${Math.round(parseFloat(o.total_cost)).toLocaleString('es-AR')}</td>
                                            <td data-label="Acción">-</td>
                                        </tr>
                                    ))}
                                    {sales.slice(0, 50).map(s => (
                                        <tr key={`s-${s.id}`}>
                                            <td data-label="Fecha">{new Date(s.date).toLocaleDateString()}</td>
                                            <td data-label="Tipo"><span className="badge badge-income">Ingreso</span></td>
                                            <td data-label="Descripción">Venta #{s.id} {s.customer_name ? `(${s.customer_name})` : ''}</td>
                                            <td data-label="Categoría">Venta TPV</td>
                                            <td data-label="Importe" className="txt-right positive">+${Math.round(parseFloat(s.total_amount)).toLocaleString('es-AR')}</td>
                                            <td data-label="Acción">-</td>
                                        </tr>
                                    ))}
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
