import React, { useState, useEffect } from 'react';
import { fetchSales, markSaleAsPrepared, markSaleAsDelivered, revertSaleDelivery, revertSalePrepared, deleteSale, bulkActionSales } from '../../services/api';
import { Utensils, Clock, CheckCircle, Package, History, ArrowLeftRight, Settings, Trash2, CheckSquare, Square, X, Check } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import './Kitchen.css';

const Kitchen = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [collectedOrders, setCollectedOrders] = useState([]);
    
    // activeTab: 'pending' | 'ready' | 'collected'
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [toast, setToast] = useState(null);
    
    const [actionModal, setActionModal] = useState({ isOpen: false, order: null });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, order: null, isBulk: false });
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState([]);
    
    const activeTabRef = React.useRef(activeTab);

    useEffect(() => {
        activeTabRef.current = activeTab;
        // Clear selection when changing tabs
        setSelectedIds([]);
    }, [activeTab]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const handleRealTime = (data) => {
            console.log("Kitchen refresh triggered from Event/SSE:", data?.type);
            loadKitchenOrders();
            
            if (data?.type === 'new_order' && activeTabRef.current === 'pending') {
                try {
                    const beep = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = beep.createOscillator();
                    const gain = beep.createGain();
                    osc.connect(gain);
                    gain.connect(beep.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, beep.currentTime);
                    gain.gain.setValueAtTime(0.05, beep.currentTime);
                    osc.start();
                    osc.stop(beep.currentTime + 0.1);
                } catch (e) {
                    console.error("Audio beep failed:", e);
                }
            }
        };

        let es = null;
        const isStandalone = window.location.pathname === '/cocina';
        
        const connectSSE = () => {
            const token = sessionStorage.getItem('duke_admin_token');
            const sseUrl = `${import.meta.env.VITE_API_URL || ''}/api/orders-stream/?token=${token ? token.trim() : ''}`;
            es = new EventSource(sseUrl, { withCredentials: true });
            
            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_order' || data.type === 'order_updated') {
                        handleRealTime(data);
                    }
                } catch (e) {}
            };

            es.onerror = () => {
                if (es) {
                    es.close();
                    setTimeout(connectSSE, 10000);
                }
            };
        };
        
        const handleRealTimeEvent = (event) => {
            const data = event.detail;
            handleRealTime(data);
        };

        if (isStandalone) connectSSE();
        loadKitchenOrders();

        window.addEventListener('new-order-received', handleRealTimeEvent);
        return () => {
            clearInterval(timer);
            window.removeEventListener('new-order-received', handleRealTimeEvent);
            if (es) es.close();
        };
    }, []);

    const loadKitchenOrders = async () => {
        try {
            const data = await fetchSales();
            const now = new Date();
            
            const activeOrders = data.filter(o => {
                const orderDate = new Date(o.date);
                const hoursSinceCreated = (now - orderDate) / (1000 * 60 * 60);
                if (hoursSinceCreated > 16) return false;
                if (!o.is_delivered) return true;
                const deliveredDate = o.delivered_at ? new Date(o.delivered_at) : (o.updated_at ? new Date(o.updated_at) : new Date(o.date));
                if (isNaN(deliveredDate.getTime())) return true;
                const hoursSinceDelivered = (now - deliveredDate) / (1000 * 60 * 60);
                return hoursSinceDelivered <= 6;
            });

            const pending = activeOrders.filter(o => !o.is_prepared);
            const ready = activeOrders.filter(o => o.is_prepared && !o.is_delivered);
            const collected = activeOrders.filter(o => o.is_prepared && o.is_delivered);
            
            setPendingOrders(pending.sort((a, b) => new Date(a.date) - new Date(b.date))); 
            setReadyOrders(ready.sort((a, b) => {
                const dateA = a.prepared_at ? new Date(a.prepared_at) : (a.updated_at ? new Date(a.updated_at) : new Date(a.date));
                const dateB = b.prepared_at ? new Date(b.prepared_at) : (b.updated_at ? new Date(b.updated_at) : new Date(b.date));
                return dateB - dateA;
            })); 
            setCollectedOrders(collected.sort((a, b) => {
                const dateA = a.delivered_at ? new Date(a.delivered_at) : (a.updated_at ? new Date(a.updated_at) : new Date(a.date));
                const dateB = b.delivered_at ? new Date(b.delivered_at) : (b.updated_at ? new Date(b.updated_at) : new Date(b.date));
                return dateB - dateA;
            }));
        } catch (error) {
            console.error("Error loading kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType, order) => {
        setActionModal({ isOpen: false, order: null });
        try {
            if (actionType === 'TO_READY') {
                await markSaleAsPrepared(order.id);
                setToast({ message: `Pedido #${order.id} enviado a LISTOS`, type: 'success' });
            } else if (actionType === 'TO_PENDING') {
                await revertSalePrepared(order.id);
                setToast({ message: `Pedido #${order.id} devuelto a PENDIENTES`, type: 'info' });
            } else if (actionType === 'TO_COLLECTED') {
                await markSaleAsDelivered(order.id);
                setToast({ message: `Pedido #${order.id} marcado como RECOGIDO`, type: 'success' });
            } else if (actionType === 'REVERT_COLLECTED') {
                await revertSaleDelivery(order.id);
                setToast({ message: `Pedido #${order.id} devuelto a LISTOS`, type: 'info' });
            } else if (actionType === 'DELETE') {
                await deleteSale(order.id);
                setToast({ message: `Pedido #${order.id} eliminado`, type: 'success' });
            }
            loadKitchenOrders();
        } catch (error) {
            setToast({ message: "Error al realizar la acción", type: 'error' });
        }
    };

    const toggleSelect = (orderId, e) => {
        e.stopPropagation();
        setSelectedIds(prev => 
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        
        if (action === 'DELETE') {
            setConfirmDelete({ isOpen: true, isBulk: true, order: null });
            return;
        }

        try {
            let backendAction = action; // 'PREPARE' or 'DELIVER'
            await bulkActionSales(selectedIds, backendAction);
            setToast({ message: `${selectedIds.length} pedidos actualizados`, type: 'success' });
            setSelectedIds([]);
            loadKitchenOrders();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const executeBulkDelete = async () => {
        try {
            await bulkActionSales(selectedIds, 'DELETE');
            setToast({ message: `${selectedIds.length} pedidos eliminados`, type: 'success' });
            setSelectedIds([]);
            setConfirmDelete({ isOpen: false, order: null, isBulk: false });
            loadKitchenOrders();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    const getDisplayOrders = () => {
        if (activeTab === 'pending') return pendingOrders;
        if (activeTab === 'ready') return readyOrders;
        return collectedOrders;
    };

    const currentDisplay = getDisplayOrders();

    return (
        <div className="kitchen-container">
            <header className="kitchen-header">
                <div className="header-top">
                    <h1><Utensils size={40} /> COCINA DUKE</h1>
                    <div className="kitchen-clock">
                        <Clock size={20} />
                        {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                    </div>
                </div>
                
                <div className="kitchen-nav">
                    <button className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        PENDIENTES ({pendingOrders.length})
                    </button>
                    <button className={`nav-item ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>
                        LISTOS ({readyOrders.length})
                    </button>
                    <button className={`nav-item ${activeTab === 'collected' ? 'active' : ''}`} onClick={() => setActiveTab('collected')}>
                        RECOGIDOS ({collectedOrders.length})
                    </button>
                </div>
            </header>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bulk-action-bar">
                    <div className="selection-info">
                        <CheckSquare size={20} />
                        <span>{selectedIds.length} seleccionados</span>
                    </div>
                    <div className="action-buttons">
                        {activeTab === 'pending' && (
                            <button onClick={() => handleBulkAction('PREPARE')} className="bulk-btn ready"><Check size={20} /> LISTOS</button>
                        )}
                        {(activeTab === 'pending' || activeTab === 'ready') && (
                            <button onClick={() => handleBulkAction('DELIVER')} className="bulk-btn picked"><Package size={20} /> RECOGIDOS</button>
                        )}
                        <button onClick={() => handleBulkAction('DELETE')} className="bulk-btn delete"><Trash2 size={20} /> ELIMINAR</button>
                        <button onClick={() => setSelectedIds([])} className="bulk-btn cancel"><X size={20} /></button>
                    </div>
                </div>
            )}

            <div className="kitchen-grid">
                {currentDisplay.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                        <Package size={80} style={{ marginBottom: '20px' }} />
                        <h2>
                            {activeTab === 'pending' && 'SIN PEDIDOS PENDIENTES'}
                            {activeTab === 'ready' && 'SIN PEDIDOS LISTOS'}
                            {activeTab === 'collected' && 'HISTORIAL DE RECOGIDOS VACÍO'}
                        </h2>
                    </div>
                ) : (
                    currentDisplay.map(order => {
                        const isSelected = selectedIds.includes(order.id);
                        return (
                            <div 
                                key={order.id} 
                                className={`kitchen-card ${isSelected ? 'selected' : ''} ${activeTab === 'pending' ? 'new-order' : (activeTab === 'ready' ? 'ready-card' : 'collected-card')}`}
                                onClick={() => setActionModal({ isOpen: true, order })}
                            >
                                <div className="selection-overlay" onClick={(e) => toggleSelect(order.id, e)}>
                                    {isSelected ? <CheckSquare size={28} color="var(--admin-primary)" /> : <Square size={28} />}
                                </div>

                                <div className="kitchen-card-header">
                                    <span className="ticket-number">#{order.id}</span>
                                    <span className="ticket-time">
                                        <Clock size={14} style={{ marginRight: '5px' }} /> 
                                        {formatTime(order.date)}
                                        {order.is_prepared && (
                                            <> | <span className="prepared-time">LISTO: {formatTime(order.prepared_at || order.updated_at)}</span></>
                                        )}
                                    </span>
                                </div>
                                <div className="kitchen-card-body">
                                    <div className="customer-info">
                                        <span className="customer-name">{order.customer_name || 'Particular'}</span>
                                        {order.customer_name?.includes('(Ampl. #') && (
                                            <div className="ampliacion-badge">AMPLIACIÓN</div>
                                        )}
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
                                    <div className="card-hint">
                                        <Settings size={18} /> Pulsa para opciones
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Action Menu Modal */}
            {actionModal.isOpen && actionModal.order && (
                <div className="modal-overlay" onClick={() => setActionModal({ isOpen: false, order: null })}>
                    <div className="admin-modal kitchen-options-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <h3 className="modal-title">GESTIÓN TICKET #{actionModal.order.id}</h3>
                            
                            <div className="modal-actions-list">
                                {activeTab === 'pending' && (
                                    <>
                                        <button onClick={() => handleAction('TO_READY', actionModal.order)} className="action-btn ready">MARCAR COMO LISTO</button>
                                        <button onClick={() => handleAction('TO_COLLECTED', actionModal.order)} className="action-btn collected">MARCAR COMO RECOGIDO</button>
                                    </>
                                )}
                                
                                {activeTab === 'ready' && (
                                    <>
                                        <button onClick={() => handleAction('TO_COLLECTED', actionModal.order)} className="action-btn collected">MARCAR COMO RECOGIDO</button>
                                        <button onClick={() => handleAction('TO_PENDING', actionModal.order)} className="action-btn pending">VOLVER A PENDIENTE</button>
                                    </>
                                )}
                                
                                {activeTab === 'collected' && (
                                    <>
                                        <button onClick={() => handleAction('REVERT_COLLECTED', actionModal.order)} className="action-btn ready">VOLVER A LISTO</button>
                                        <button onClick={() => handleAction('TO_PENDING', actionModal.order)} className="action-btn pending">VOLVER A PENDIENTE</button>
                                    </>
                                )}
                                
                                <button onClick={() => setConfirmDelete({ isOpen: true, order: actionModal.order, isBulk: false })} className="action-btn delete">ELIMINAR TICKET</button>
                                
                                <button onClick={() => setActionModal({ isOpen: false, order: null })} className="action-btn cancel">CERRAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Single/Bulk Delete Confirmation */}
            {confirmDelete.isOpen && (
                <ConfirmModal
                    isOpen={true}
                    title={confirmDelete.isBulk ? '¿ELIMINAR SELECCIONADOS?' : '¿ELIMINAR TICKET?'}
                    message={confirmDelete.isBulk 
                        ? `¿Estás seguro de eliminar permanentemente estos ${selectedIds.length} tickets de cocina? No se cobrarán.`
                        : `¿Estás seguro de eliminar permanentemente el ticket #${confirmDelete.order?.id}? Esta acción destruirá el pedido.`
                    }
                    onConfirm={() => {
                        if (confirmDelete.isBulk) executeBulkDelete();
                        else handleAction('DELETE', confirmDelete.order);
                        setConfirmDelete({ isOpen: false, order: null, isBulk: false });
                    }}
                    onCancel={() => setConfirmDelete({ isOpen: false, order: null, isBulk: false })}
                />
            )}
        </div>
    );
};

export default Kitchen;
