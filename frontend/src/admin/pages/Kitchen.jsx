import React, { useState, useEffect } from 'react';
import { fetchSales, markSaleAsPrepared } from '../../services/api';
import { Utensils, Clock, CheckCircle, Package } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import './Kitchen.css';

const Kitchen = () => {
    const [orders, setOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadKitchenOrders();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const handleNewOrder = () => {
            console.log("Kitchen refresh triggered");
            loadKitchenOrders();
            // Notificamos sonido solo si no estamos viendo historial para no confundir
            if (!showHistory) {
                const beep = new AudioContext();
                const osc = beep.createOscillator();
                const gain = beep.createGain();
                osc.connect(gain);
                gain.connect(beep.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, beep.currentTime);
                gain.gain.setValueAtTime(0.05, beep.currentTime);
                osc.start();
                osc.stop(beep.currentTime + 0.1);
            }
        };

        window.addEventListener('new-order-received', handleNewOrder);
        return () => {
            clearInterval(timer);
            window.removeEventListener('new-order-received', handleNewOrder);
        };
    }, [showHistory]);

    const loadKitchenOrders = async () => {
        try {
            const data = await fetchSales();
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
            
            // Filtro por Día
            const todayOrders = data.filter(o => {
                const orderDate = new Date(o.date).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
                return orderDate === todayStr;
            });

            // Separamos por estado de preparación
            const pending = todayOrders.filter(o => !o.is_prepared);
            const prepared = todayOrders.filter(o => o.is_prepared);
            
            setOrders(pending.sort((a, b) => new Date(a.date) - new Date(b.date))); 
            setHistoryOrders(prepared.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))); 
        } catch (error) {
            console.error("Error loading kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReady = async (orderId) => {
        try {
            await markSaleAsPrepared(orderId);
            setToast({ message: `Pedido #${orderId} enviado al historial`, type: 'success' });
            loadKitchenOrders();
        } catch (error) {
            setToast({ message: "Error al marcar como listo", type: 'error' });
        }
    };

    const handleDeliver = async (orderId) => {
        try {
            const { markSaleAsDelivered } = await import('../../services/api');
            await markSaleAsDelivered(orderId);
            setToast({ message: `Pedido #${orderId} marcado como recogido`, type: 'success' });
            loadKitchenOrders();
        } catch (error) {
            setToast({ message: "Error al marcar como entregado", type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    const currentDisplay = showHistory ? historyOrders : orders;

    return (
        <div className="kitchen-container">
            <header className="kitchen-header">
                <div className="header-top">
                    <h1><Utensils size={40} /> COCINA DUKE</h1>
                    <div className="kitchen-clock">
                        {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </div>
                
                <div className="kitchen-nav">
                    <button 
                        className={`nav-item ${!showHistory ? 'active' : ''}`} 
                        onClick={() => setShowHistory(false)}
                    >
                        PENDIENTES ({orders.length})
                    </button>
                    <button 
                        className={`nav-item ${showHistory ? 'active' : ''}`} 
                        onClick={() => setShowHistory(true)}
                    >
                        HISTORIAL HOY ({historyOrders.length})
                    </button>
                </div>
            </header>

            <div className="kitchen-grid">
                {currentDisplay.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                        <Package size={80} style={{ marginBottom: '20px' }} />
                        <h2>{showHistory ? 'HISTORIAL VACÍO' : 'SIN PEDIDOS PENDIENTES'}</h2>
                    </div>
                ) : (
                    currentDisplay.map(order => (
                        <div key={order.id} className={`kitchen-card ${!order.is_prepared ? 'new-order' : 'history-card'}`}>
                            <div className="kitchen-card-header">
                                <span className="ticket-number">#{order.id}</span>
                                <span className="ticket-time">
                                    <Clock size={16} /> 
                                    PEDIDO: {new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    {order.is_prepared && (
                                        <> | LISTO: {new Date(order.updated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</>
                                    )}
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
                                {!order.is_prepared ? (
                                    <button className="ready-btn" onClick={() => handleReady(order.id)}>
                                        <CheckCircle size={24} /> LISTO
                                    </button>
                                ) : (
                                    <button 
                                        className="deliver-btn" 
                                        onClick={() => handleDeliver(order.id)}
                                        title="Marcar como RECOGIDO / ENTREGADO"
                                    >
                                        <CheckCircle size={24} /> ENTREGAR
                                    </button>
                                )}
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
