import React, { useState, useEffect } from 'react';
import { fetchSales } from '../../services/api';
import { Printer, Eye, Calendar, User, Hash } from 'lucide-react';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await fetchSales();
            setOrders(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (order) => {
        window.print();
    };

    if (loading) return <div className="admin-card">Cargando pedidos...</div>;

    return (
        <div className="orders-container">
            <div className="orders-header">
                <h2>Gestión de Pedidos</h2>
                <div className="orders-stats">
                    <div className="stat-card">
                        <span>Total Pedidos</span>
                        <strong>{orders.length}</strong>
                    </div>
                    <div className="stat-card">
                        <span>Ingresos Totales</span>
                        <strong>{orders.reduce((acc, o) => acc + parseFloat(o.total_amount), 0).toFixed(2)}€</strong>
                    </div>
                </div>
            </div>

            <div className="orders-grid">
                <div className="orders-list-card admin-card">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th><Hash size={14} /> ID</th>
                                <th><Calendar size={14} /> Fecha</th>
                                <th><User size={14} /> Cliente / Mesa</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className={selectedOrder?.id === order.id ? 'selected' : ''} onClick={() => setSelectedOrder(order)}>
                                    <td>#{order.id}</td>
                                    <td>
                                        <div className="date-cell">
                                            <span>{new Date(order.date).toLocaleDateString()}</span>
                                            <small>{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="client-cell">
                                            <strong>{order.customer_name || 'Sin nombre'}</strong>
                                            {order.table_number && <span className="table-badge">Mesa {order.table_number}</span>}
                                        </div>
                                    </td>
                                    <td className="total-cell">{parseFloat(order.total_amount).toFixed(2)}€</td>
                                    <td>
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                            {order.status === 'PENDING' ? 'Pendiente' : order.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="icon-btn print" title="Imprimir" onClick={(e) => { e.stopPropagation(); handlePrint(order); }}>
                                                <Printer size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedOrder && (
                    <div className="order-details-card admin-card">
                        <div className="details-header">
                            <h3>Detalle del Pedido #{selectedOrder.id}</h3>
                            <button className="close-details" onClick={() => setSelectedOrder(null)}>×</button>
                        </div>
                        
                        <div className="details-content">
                            <div className="details-meta">
                                <p><strong>Cliente:</strong> {selectedOrder.customer_name || '-'}</p>
                                <p><strong>Mesa:</strong> {selectedOrder.table_number || '-'}</p>
                                <p><strong>Hora:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
                            </div>

                            <div className="items-list">
                                <h4>Productos</h4>
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="detail-item">
                                        <span>{item.quantity} x {item.entry_name}</span>
                                        <span>{(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}€</span>
                                    </div>
                                ))}
                            </div>

                            <div className="details-total">
                                <span>TOTAL</span>
                                <strong>{parseFloat(selectedOrder.total_amount).toFixed(2)}€</strong>
                            </div>

                            <button className="print-full-btn" onClick={() => handlePrint(selectedOrder)}>
                                <Printer size={20} /> IMPRIMIR TICKET FISCAL
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Area de Impresion Oculta */}
            <div id="ticket-print-area" className="print-only">
                {selectedOrder && (
                    <div className="thermal-ticket">
                        <div className="ticket-header-print">
                            <h1>DUKE BURGERS</h1>
                            <p>San Juan, Argentina</p>
                            <div className="ticket-divider"></div>
                        </div>
                        <div className="ticket-info-print">
                            <p>TICKET #{selectedOrder.id}</p>
                            <p>FECHA: {new Date(selectedOrder.date).toLocaleString()}</p>
                            <p>CLIENTE: {selectedOrder.customer_name || 'Particular'}</p>
                            {selectedOrder.table_number && <p>MESA: {selectedOrder.table_number}</p>}
                        </div>
                        <div className="ticket-divider"></div>
                        <div className="ticket-items-print">
                            {selectedOrder.items.map(item => (
                                <div key={item.id} className="ticket-row">
                                    <span>{item.quantity} x {item.entry_name}</span>
                                    <span>{(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}€</span>
                                </div>
                            ))}
                        </div>
                        <div className="ticket-divider"></div>
                        <div className="ticket-total-print">
                            <span>TOTAL:</span>
                            <strong>{parseFloat(selectedOrder.total_amount).toFixed(2)}€</strong>
                        </div>
                        <div className="ticket-footer-print">
                            <p>¡Gracias por su visita!</p>
                            <p>dukeburger-sj.com</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
