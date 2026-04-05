import React, { useState, useEffect } from 'react';
import { fetchSales, fetchSupplierOrders, fetchExpenses, createExpense, deleteExpense } from '../../services/api';
import './Accounting.css';

const Accounting = () => {
    const [sales, setSales] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [manualExpenses, setManualExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Manual expense form
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Otros');
    const [isSaving, setIsSaving] = useState(false);

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
            loadData();
        } catch (error) {
            alert("Error al registrar el gasto");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("¿Eliminar este gasto?")) return;
        try {
            await deleteExpense(id);
            loadData();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const totalIncome = sales.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
    const totalSupplierDebt = supplierOrders.reduce((acc, o) => acc + parseFloat(o.total_cost), 0);
    const totalManualExpenses = manualExpenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
    const totalExpenses = totalSupplierDebt + totalManualExpenses;
    const balance = totalIncome - totalExpenses;

    if (loading) return <div className="admin-content">Cargando contabilidad...</div>;

    return (
        <div className="admin-content accounting-page">
            <header className="accounting-header">
                <h2>Balance General</h2>
                <p>Resumen financiero de Duke Burgers</p>
            </header>

            <div className="accounting-summary-grid">
                <div className="summary-card income">
                    <h3>Ingresos</h3>
                    <p className="amount">+{totalIncome.toFixed(2)}€</p>
                    <span>Ventas finalizadas</span>
                </div>
                <div className="summary-card expenses">
                    <h3>Gastos</h3>
                    <p className="amount">-{totalExpenses.toFixed(2)}€</p>
                    <span>Proveedores + Gastos manuales</span>
                </div>
                <div className="summary-card balance">
                    <h3>Beneficio Neto</h3>
                    <p className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                        {balance.toFixed(2)}€
                    </p>
                    <span>Balance total</span>
                </div>
            </div>

            <div className="accounting-main-layout">
                <div className="accounting-forms">
                    <div className="admin-card">
                        <h3>Añadir Gasto Manual</h3>
                        <form onSubmit={handleAddExpense} className="accounting-form">
                            <div className="form-group">
                                <label>Descripción</label>
                                <input 
                                    type="text" 
                                    value={desc} 
                                    onChange={e => setDesc(e.target.value)} 
                                    placeholder="Ej: Recibo de luz, Alquiler..."
                                    required/ >
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Importe (€)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        placeholder="0.00"
                                        required/ >
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="Suministros">Suministros (Luz, Agua)</option>
                                        <option value="Alquiler">Alquiler</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Marketing">Marketing</option>
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
                                    {manualExpenses.map(e => (
                                        <tr key={`me-${e.id}`}>
                                            <td>{new Date(e.date).toLocaleDateString()}</td>
                                            <td><span className="badge badge-manual">Gasto</span></td>
                                            <td>{e.description}</td>
                                            <td>{e.category}</td>
                                            <td className="txt-right negative">-{parseFloat(e.amount).toFixed(2)}€</td>
                                            <td>
                                                <button onClick={() => handleDeleteExpense(e.id)} className="delete-btn">×</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {supplierOrders.map(o => (
                                        <tr key={`so-${o.id}`}>
                                            <td>{new Date(o.date).toLocaleDateString()}</td>
                                            <td><span className="badge badge-order">Proveedor</span></td>
                                            <td>{o.supplier_name} (Pedido #{o.id})</td>
                                            <td>Materia Prima</td>
                                            <td className="txt-right negative">-{parseFloat(o.total_cost).toFixed(2)}€</td>
                                            <td>-</td>
                                        </tr>
                                    ))}
                                    {sales.slice(0, 50).map(s => (
                                        <tr key={`s-${s.id}`}>
                                            <td>{new Date(s.date).toLocaleDateString()}</td>
                                            <td><span className="badge badge-income">Ingreso</span></td>
                                            <td>Venta #{s.id} {s.customer_name ? `(${s.customer_name})` : ''}</td>
                                            <td>Venta TPV</td>
                                            <td className="txt-right positive">+{parseFloat(s.total_amount).toFixed(2)}€</td>
                                            <td>-</td>
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
