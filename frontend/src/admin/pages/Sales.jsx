import React, { useState, useEffect } from 'react';
import { fetchMenuEntries, createSale, fetchSales, updateSale, deleteSale, bulkActionSales } from '../../services/api';
import { Trash2, Edit2, ChevronRight, CheckCircle2, MoreVertical, Plus, Minus, Search, ShoppingCart, Receipt } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import './Sales.css';

const Sales = () => {
    const [viewMode, setViewMode] = useState('tpv'); // 'tpv' or 'pending'
    const [menuEntries, setMenuEntries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }
    
    // Ticket info
    const [customerName, setCustomerName] = useState('');
    const [saleNotes, setSaleNotes] = useState('');
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [isDelivery, setIsDelivery] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSaleId, setCurrentSaleId] = useState(null);
    const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
    const [discountValue, setDiscountValue] = useState(0);

    // List of pending tickets
    const [pendingTickets, setPendingTickets] = useState([]);
    const [deletingTicketId, setDeletingTicketId] = useState(null);
    const [selectedTickets, setSelectedTickets] = useState([]);

    useEffect(() => {
        loadData();

        // Real-time support
        const handleNewOrder = () => {
            console.log("Real-time: New order detected, refreshing pending tickets...");
            loadData();
        };

        window.addEventListener('new-order-received', handleNewOrder);
        return () => window.removeEventListener('new-order-received', handleNewOrder);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const menuData = await fetchMenuEntries();
            setMenuEntries(menuData.filter(e => e.is_available));
            
            const salesData = await fetchSales();
            setPendingTickets(salesData.filter(s => s.status === 'PENDING'));
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ["Todas", ...new Set(menuEntries.map(e => e.category))];

    const addToCart = (entry) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.menu_entry === entry.id);
            if (existing) {
                return prevCart.map(item =>
                    item.menu_entry === entry.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { 
                menu_entry: entry.id, 
                name: entry.product.name, 
                price: entry.price, 
                quantity: 1 
            }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.menu_entry !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.menu_entry === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const updatePrice = (id, newPrice) => {
        setCart(prevCart => prevCart.map(item => 
            item.menu_entry === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
        ));
    };

    const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const calculatedDiscount = discountType === 'percent' 
        ? (subtotal * (parseFloat(discountValue || 0) / 100))
        : parseFloat(discountValue || 0);

    const total = Math.max(0, subtotal - calculatedDiscount + (isDelivery ? parseFloat(deliveryCost || 0) : 0));
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const toggleTicket = () => setIsTicketOpen(!isTicketOpen);

    const resetCart = () => {
        setCart([]);
        setCustomerName('');
        setSaleNotes('');
        setDeliveryCost(0);
        setIsDelivery(false);
        setCurrentSaleId(null);
        setIsTicketOpen(false);
        setDiscountValue(0);
        setDiscountType('fixed');
    };

    const handleSaveTicket = async (status = 'COMPLETED') => {
        if (!customerName.trim()) {
            setToast({ message: "El nombre del cliente es obligatorio para identificar el ticket.", type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            const saleData = {
                total_amount: total,
                status: status,
                customer_name: customerName,
                table_number: isDelivery ? `ENVIO: $${deliveryCost}` : "", 
                delivery_cost: isDelivery ? deliveryCost : 0,
                notes: saleNotes,
                items: cart.map(item => ({
                    menu_entry: item.menu_entry,
                    quantity: item.quantity,
                    price_at_sale: item.price
                }))
            };

            if (currentSaleId) {
                await updateSale(currentSaleId, saleData);
            } else {
                await createSale(saleData);
            }
            
            setToast({ 
                message: status === 'PENDING' ? "¡Ticket guardado como pendiente!" : "¡Venta cobrada con éxito!", 
                type: 'success' 
            });
            resetCart();
            loadData(); // Refresh pending tickets
        } catch (error) {
            setToast({ message: "Error al procesar la operación", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const loadPendingSale = (ticket) => {
        setCart(ticket.items.map(item => ({
            menu_entry: item.menu_entry,
            name: item.entry_name,
            price: item.price_at_sale,
            quantity: item.quantity
        })));
        setCustomerName(ticket.customer_name || '');
        setSaleNotes(ticket.notes || '');
        setDeliveryCost(parseFloat(ticket.delivery_cost || 0));
        setIsDelivery(parseFloat(ticket.delivery_cost || 0) > 0);
        setCurrentSaleId(ticket.id);
        setViewMode('tpv');
        setIsTicketOpen(true);
    };

    const filteredMenu = menuEntries.filter(e => {
        const matchesCategory = selectedCategory === "Todas" || e.category === selectedCategory;
        const matchesSearch = !searchTerm || 
            (e.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.category || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleDeleteTicket = async (id) => {
        setIsSaving(true);
        try {
            await deleteSale(id);
            setToast({ message: "Ticket eliminado correctamente.", type: 'success' });
            setDeletingTicketId(null);
            setSelectedTickets(prev => prev.filter(tid => tid !== id));
            loadData();
        } catch (error) {
            setToast({ message: "Error al eliminar ticket.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedTickets.length === 0) return;
        const confirmMsg = action === 'COMPLETE' 
            ? `¿Deseas cobrar los ${selectedTickets.length} tickets seleccionados por caja?`
            : `¿Deseas ELIMINAR los ${selectedTickets.length} tickets seleccionados PERMANENTEMENTE?`;
            
        if (!window.confirm(confirmMsg)) return;

        setIsSaving(true);
        try {
            const res = await bulkActionSales(selectedTickets, action);
            setToast({ message: res.message, type: 'success' });
            setSelectedTickets([]);
            loadData();
        } catch (error) {
            setToast({ message: "Error en acción masiva: " + error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTicketSelection = (id, e) => {
        e.stopPropagation();
        setSelectedTickets(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="pos-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* FAB para móviles */}
            <button className={`pos-fab ${isTicketOpen ? 'hidden' : ''}`} onClick={toggleTicket}>
                <div className="fab-icon-wrapper">
                    <Receipt size={24} />
                    <span className="fab-count">{totalItems}</span>
                </div>
                <span className="fab-text">Ver Ticket</span>
                <span className="fab-total">${total.toLocaleString('es-AR')}</span>
            </button>

            {/* Selector de Modo */}
            <div className="pos-view-selector">
                <button 
                    className={viewMode === 'tpv' ? 'active' : ''} 
                    onClick={() => setViewMode('tpv')}
                >
                    NUEVA VENTA
                </button>
                <button 
                    className={viewMode === 'pending' ? 'active' : ''} 
                    onClick={() => setViewMode('pending')}
                >
                    TICKETS PENDIENTES ({pendingTickets.length})
                </button>
            </div>

            {viewMode === 'tpv' ? (
                <>
                    <div className="pos-main">
                        <div className="pos-left-content">
                            <div className="pos-header">
                                <div className="category-tabs" style={{ flex: 1 }}>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="search-bar" style={{ position: 'relative', width: '250px', marginLeft: '15px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%', background: '#fff' }}
                                    />
                                </div>
                            </div>

                            <div className="pos-products-grid">
                            {filteredMenu.map(entry => (
                                <div 
                                    key={entry.id} 
                                    className="pos-product-card"
                                    onClick={() => addToCart(entry)}
                                >
                                    <div className="pos-product-img-container">
                                        {entry.product.image ? (
                                            <img src={entry.product.image} alt={entry.product.name} />
                                        ) : (
                                            <div className="no-img-placeholder">🍔</div>
                                        )}
                                    </div>
                                    <div className="pos-product-info">
                                        <h3>{entry.product.name}</h3>
                                        <span className="pos-price">${parseFloat(entry.price).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        {/* Sidebar del Ticket */}
                        <div className={`pos-ticket-sidebar ${isTicketOpen ? 'open' : ''}`}>
                            <div className="ticket-header">
                                <button className="close-ticket-btn" onClick={() => setIsTicketOpen(false)}>×</button>
                                <h2>{currentSaleId ? `Editando Ticket #${currentSaleId}` : "Ticket Actual"}</h2>
                                <button className="clear-btn" onClick={resetCart}>Cancelar</button>
                            </div>
                            
                            <div className="ticket-meta">
                                <input 
                                    type="text" 
                                    placeholder="Cliente / Nombre * (Obligatorio)" 
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className={!customerName && cart.length > 0 ? "input-required" : ""}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Anotaciones (Opcional)" 
                                    value={saleNotes}
                                    onChange={e => setSaleNotes(e.target.value)}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isDelivery} 
                                            onChange={(e) => setIsDelivery(e.target.checked)} 
                                        />
                                        Envío
                                    </label>
                                    {isDelivery && (
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#666' }}>$</span>
                                            <input 
                                                type="number" 
                                                placeholder="Costo"
                                                step="100"
                                                min="0"
                                                className="no-arrows-input"
                                                value={deliveryCost}
                                                onChange={e => setDeliveryCost(e.target.value)}
                                                style={{ paddingLeft: '20px', height: '35px', width: '100%', fontWeight: 'bold' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="ticket-items">
                                {cart.length === 0 ? (
                                    <div className="empty-cart-msg">No hay productos en el ticket</div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menu_entry} className="ticket-item">
                                            <div className="item-details">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-subtotal">${(parseFloat(item.price) * item.quantity).toLocaleString('es-AR')}</span>
                                            </div>
                                            <div className="item-controls" style={{ gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', background: '#f1f3f5', borderRadius: '4px', marginRight: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.menu_entry, -1)} style={{ background: 'transparent', border: 'none', padding: '2px 8px', fontSize: '1.2rem'}}>−</button>
                                                    <span className="item-qty" style={{ fontWeight: '800', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.menu_entry, 1)} style={{ background: 'transparent', border: 'none', padding: '2px 8px', fontSize: '1.2rem'}}>+</button>
                                                </div>
                                                
                                                {/* Price Edit Control */}
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <button 
                                                        className="price-edit-btn" 
                                                        onClick={() => {
                                                            const newP = prompt("Nuevo precio para " + item.name, item.price);
                                                            if (newP !== null) updatePrice(item.menu_entry, newP);
                                                        }}
                                                        style={{ padding: '4px 6px', background: '#333', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.7rem'}}
                                                        title="Editar Precio"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => updatePrice(item.menu_entry, 0)}
                                                        style={{ padding: '4px 6px', background: '#fa5252', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold'}}
                                                        title="Regalar artículo"
                                                    >
                                                        🎁
                                                    </button>
                                                    <button className="delete-item-btn" onClick={() => removeFromCart(item.menu_entry)} style={{ marginLeft: '4px'}}>×</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="ticket-footer">
                                <div className="total-row">
                                    <span>SUBTOTAL:</span>
                                    <span>${subtotal.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="discount-controls" style={{ background: '#f8f9fa', padding: '10px', borderRadius: '10px', margin: '10px 0' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666' }}>DESCUENTO GLOBAL</label>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <select 
                                            value={discountType} 
                                            onChange={e => setDiscountType(e.target.value)}
                                            style={{ padding: '5px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                        >
                                            <option value="fixed">$ Fijo</option>
                                            <option value="percent">% Porcentaje</option>
                                        </select>
                                        <input 
                                            type="number" 
                                            placeholder="Valor..."
                                            value={discountValue || ''}
                                            onChange={e => setDiscountValue(e.target.value)}
                                            className="no-arrows-input"
                                            style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                    </div>
                                    {calculatedDiscount > 0 && (
                                        <div style={{ marginTop: '5px', textAlign: 'right', fontSize: '0.8rem', color: '#fa5252', fontWeight: 'bold' }}>
                                            − ${calculatedDiscount.toLocaleString('es-AR')}
                                        </div>
                                    )}
                                </div>
                                {isDelivery && (
                                    <div className="total-row" style={{ color: '#f03e3e', fontSize: '0.9rem' }}>
                                        <span>DIRECCIÓN / ENVÍO:</span>
                                        <span>+ ${parseFloat(deliveryCost || 0).toLocaleString('es-AR')}</span>
                                    </div>
                                )}
                                <div className="total-row" style={{ borderTop: '2px solid #333', paddingTop: '10px', marginTop: '5px' }}>
                                    <span>TOTAL FINAL:</span>
                                    <span className="total-price">${total.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="pos-actions-grid">
                                    <button 
                                        className="pending-btn" 
                                        disabled={cart.length === 0 || isSaving}
                                        onClick={() => handleSaveTicket('PENDING')}
                                    >
                                        GUARDAR PENDIENTE
                                    </button>
                                    <button 
                                        className="checkout-btn" 
                                        disabled={cart.length === 0 || isSaving}
                                        onClick={() => handleSaveTicket('COMPLETED')}
                                    >
                                        {isSaving ? "Procesando..." : "COBRAR TICKET"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="pending-list-container">
                    {selectedTickets.length > 0 && (
                        <div className="bulk-actions-bar">
                            <div style={{ fontWeight: 'bold' }}>{selectedTickets.length} Seleccionados</div>
                            <div className="bulk-buttons-group">
                                <button className="bulk-btn-del" onClick={() => handleBulkAction('DELETE')}>
                                    ELIMINAR
                                </button>
                                <button className="bulk-btn-pay" onClick={() => handleBulkAction('COMPLETE')}>
                                    COBRAR TODO
                                </button>
                                <button className="bulk-btn-cancel" onClick={() => setSelectedTickets([])}>
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pending-grid">
                        {pendingTickets.length === 0 ? (
                            <div className="no-pending-msg">No hay tickets pendientes</div>
                        ) : (
                            pendingTickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    className={`pending-ticket-card ${selectedTickets.includes(ticket.id) ? 'selected' : ''}`} 
                                    onClick={() => loadPendingSale(ticket)}
                                    style={{ 
                                        position: 'relative', 
                                        border: selectedTickets.includes(ticket.id) ? '2px solid #5c7cfa' : '1px solid #eee',
                                        background: selectedTickets.includes(ticket.id) ? '#edf2ff' : '#fff'
                                    }}
                                >
                                    <div 
                                        onClick={(e) => toggleTicketSelection(ticket.id, e)}
                                        style={{ 
                                            position: 'absolute', top: '15px', left: '15px', 
                                            width: '24px', height: '24px', 
                                            borderRadius: '6px', border: '2px solid #ddd',
                                            background: selectedTickets.includes(ticket.id) ? '#5c7cfa' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', zIndex: 5,
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {selectedTickets.includes(ticket.id) && <span style={{ color: 'white', fontSize: '14px', fontWeight: '900' }}>✓</span>}
                                    </div>

                                    <div className="pending-info" style={{ paddingLeft: '35px' }}>
                                        <span className="pending-id">#{ticket.id}</span>
                                        <span className="pending-date">{new Date(ticket.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                    </div>
                                    <div className="pending-customer" style={{ paddingLeft: '35px' }}>
                                        <strong>{ticket.customer_name || 'Sin nombre'}</strong>
                                        {ticket.table_number && <span className="table-tag">{ticket.table_number}</span>}
                                    </div>
                                    <div className="pending-items-summary" style={{ paddingLeft: '35px' }}>
                                        {ticket.items.length} productos
                                    </div>
                                    <div className="pending-total" style={{ paddingLeft: '35px' }}>
                                        ${parseFloat(ticket.total_amount).toLocaleString('es-AR')}
                                    </div>
                                    <div className="pending-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                        <button className="load-btn" onClick={() => loadPendingSale(ticket)}>ABRIR</button>
                                        <button 
                                            className="delete-pending-btn" 
                                            onClick={(e) => { e.stopPropagation(); setDeletingTicketId(ticket.id); }}
                                            style={{ width: '100%', padding: '0.8rem', background: '#f03e3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            ELIMINAR
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {deletingTicketId && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }}>
                    <div className="admin-modal" style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '15px', overflow: 'hidden', textAlign: 'center' }}>
                        <div style={{ padding: '30px' }}>
                            <div style={{ width: '60px', height: '60px', background: '#fff5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f03e3e', fontSize: '2rem' }}>!</div>
                            <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>¿Eliminar Ticket #{deletingTicketId}?</h3>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>Esta acción no se puede deshacer. Los datos del ticket se perderán definitivamente.</p>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setDeletingTicketId(null)}
                                    style={{ flex: 1, padding: '15px', background: '#f8f9fa', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={() => handleDeleteTicket(deletingTicketId)}
                                    style={{ flex: 1, padding: '15px', background: '#f03e3e', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff' }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'ELIMINANDO...' : 'SÍ, ELIMINAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
