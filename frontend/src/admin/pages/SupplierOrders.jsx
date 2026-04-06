import React, { useState, useEffect } from 'react';
import { fetchSupplierOrders, createSupplierOrder } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Truck, Plus, History } from 'lucide-react';
import './Accounting.css';

const SupplierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [supplierName, setSupplierName] = useState('');
    const [totalCost, setTotalCost] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await fetchSupplierOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supplierName || !totalCost) return;
        
        setIsSaving(true);
        try {
            await createSupplierOrder({
                supplier_name: supplierName,
                total_cost: parseFloat(totalCost),
                status: 'DELIVERED',
                items: [] // Simplified for now
            });
            setSupplierName('');
            setTotalCost('');
            setToast({ message: "Pedido registrado con éxito", type: 'success' });
            loadOrders();
        } catch (error) {
            setToast({ message: "Error al registrar pedido", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <header style={{ marginBottom: '30px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Truck size={32} color="#f03e3e" /> Pedidos al Proveedor
                </h2>
                <p style={{ color: '#666' }}>Gestiona las compras de materia prima y suministros.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }} className="promo-form-grid">
                {/* Formulario */}
                <div className="admin-card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <Plus size={20} color="#f03e3e" /> Nuevo Pedido
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Proveedor / Concepto</label>
                            <input 
                                type="text" 
                                value={supplierName} 
                                onChange={e => setSupplierName(e.target.value)} 
                                placeholder="Ej: Panadería El Sol, Mercado Central..."
                                required 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Costo Total ($)</label>
                            <input 
                                type="number" 
                                step="100" 
                                value={totalCost} 
                                onChange={e => setTotalCost(e.target.value)} 
                                placeholder="0"
                                required 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem', fontWeight: 'bold' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            style={{ 
                                background: '#f03e3e', color: 'white', border: 'none', padding: '15px', 
                                borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
                            }}
                        >
                            {isSaving ? "GUARDANDO..." : "REGISTRAR COMPRA"}
                        </button>
                    </form>
                </div>

                {/* Historial */}
                <div className="admin-card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <History size={20} color="#f03e3e" /> Historial Reciente
                    </h3>
                    <div className="accounting-table-container">
                        <table className="accounting-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Proveedor</th>
                                    <th className="txt-right">Importe</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No hay pedidos registrados.</td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{new Date(order.date).toLocaleDateString()}</td>
                                            <td>{order.supplier_name}</td>
                                            <td className="txt-right negative">-${parseInt(order.total_cost).toLocaleString('es-AR')}</td>
                                            <td><span className="badge badge-order" style={{ background: '#e7f5ff', color: '#1c7ed6' }}>Entregado</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierOrders;
