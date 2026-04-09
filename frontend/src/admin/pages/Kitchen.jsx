import React, { useState, useEffect } from 'react';
import { fetchSales, markSaleAsPrepared } from '../../services/api';
import { Utensils, Clock, CheckCircle, Package } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import './Kitchen.css';

const Kitchen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadKitchenOrders();
        
        // Timer for clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        // Real-time listener
        const handleNewOrder = () => {
            console.log("Kitchen: New order received, refreshing...");
            loadKitchenOrders();
            // Optional: play sound
            const beep = new AudioContext();
            const osc = beep.createOscillator();
            const gain = beep.createGain();
            osc.connect(gain);
            gain.connect(beep.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, beep.currentTime);
            gain.gain.setValueAtTime(0.1, beep.currentTime);
            osc.start();
            osc.stop(beep.currentTime + 0.2);
        };

        window.addEventListener('new-order-received', handleNewOrder);
        
        // Polling as fallback every 30s
        const poll = setInterval(loadKitchenOrders, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(poll);
            window.removeEventListener('new-order-received', handleNewOrder);
        };
    }, []);

    const loadKitchenOrders = async () => {
        try {
            const data = await fetchSales();
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
            
            // Filter pending, not prepared AND from today
            const pending = data.filter(o => {
                const orderDate = new Date(o.date).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
                return o.status === 'PENDING' && !o.is_prepared && orderDate === todayStr;
            });
            
            setOrders(pending.sort((a, b) => new Date(a.date) - new Date(b.date))); // FIFO
        } catch (error) {
            console.error("Error loading kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReady = async (orderId) => {
        try {
            await markSaleAsPrepared(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            setToast({ message: `Pedido #${orderId} completado`, type: 'success' });
        } catch (error) {
            setToast({ message: "Error al marcar como listo", type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="kitchen-container">
            <header className="kitchen-header">
                <h1><Utensils size={40} /> COCINA DUKE</h1>
                <div className="kitchen-clock">
                    {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </header>

            <div className="kitchen-grid">
                {orders.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                        <Package size={80} style={{ marginBottom: '20px' }} />
                        <h2>SIN PEDIDOS PENDIENTES</h2>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="kitchen-card new-order">
                            <div className="kitchen-card-header">
                                <span className="ticket-number">#{order.id}</span>
                                <span className="ticket-time">
                                    <Clock size={16} /> {new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="kitchen-card-body">
                                <div className="customer-info">
                                    <span className="customer-name">{order.customer_name || 'Particular'}</span>
                                    {order.table_number && <span className="table-info">{order.table_number}</span>}
                                </div>
                                <div className="items-list-kitchen">
                                    {order.items.map(item => (
                                        <div key={item.id} className="kitchen-item">
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className="item-qty">{item.quantity}</span>
                                                <span className="item-name">{item.entry_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {order.notes && (
                                    <div className="order-notes">
                                        <strong>NOTAS:</strong> {order.notes}
                                    </div>
                                )}
                            </div>
                            <div className="kitchen-card-footer">
                                <button className="ready-btn" onClick={() => handleReady(order.id)}>
                                    <CheckCircle size={24} /> LISTO
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Kitchen;
