import React, { useState, useEffect } from 'react';
import { fetchMenuEntries, createSale, fetchSales, updateSale } from '../../services/api';
import './Sales.css';

const Sales = () => {
    const [viewMode, setViewMode] = useState('tpv'); // 'tpv' or 'pending'
    const [menuEntries, setMenuEntries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Ticket info
    const [customerName, setCustomerName] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [currentSaleId, setCurrentSaleId] = useState(null); // To track if we're editing a pending sale

    // List of pending tickets
    const [pendingTickets, setPendingTickets] = useState([]);

    useEffect(() => {
        loadData();
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

    const total = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const toggleTicket = () => setIsTicketOpen(!isTicketOpen);

    const resetCart = () => {
        setCart([]);
        setCustomerName('');
        setTableNumber('');
        setCurrentSaleId(null);
        setIsTicketOpen(false);
    };

    const handleSaveTicket = async (status = 'COMPLETED') => {
        if (cart.length === 0) return;
        setIsSaving(true);
        try {
            const saleData = {
                total_amount: total,
                status: status,
                customer_name: customerName,
                table_number: tableNumber,
                notes: currentSaleId ? "Actualizado desde TPV" : "Venta desde TPV",
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

            alert(status === 'PENDING' ? "¡Ticket guardado como pendiente!" : "¡Venta cobrada con éxito!");
            resetCart();
            loadData(); // Refresh pending tickets
        } catch (error) {
            alert("Error al procesar la operación");
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
        setTableNumber(ticket.table_number || '');
        setCurrentSaleId(ticket.id);
        setViewMode('tpv');
        setIsTicketOpen(true);
    };

    const filteredMenu = selectedCategory === "Todas" 
        ? menuEntries 
        : menuEntries.filter(e => e.category === selectedCategory);

    if (loading) return <div className="pos-loading">Cargando Duke TPV...</div>;

    return (
        <div className="pos-container">
            {/* FAB para móviles */}
            <button className="pos-fab" onClick={toggleTicket}>
                <span className="fab-count">{totalItems}</span>
                <span className="fab-text">Ver Ticket</span>
                <span className="fab-total">{total.toFixed(2)}€</span>
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
                    <div className="pos-header">
                        <div className="category-tabs">
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
                    </div>

                    <div className="pos-main">
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
                                        <span className="pos-price">{parseFloat(entry.price).toFixed(2)}€</span>
                                    </div>
                                </div>
                            ))}
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
                                    placeholder="Cliente / Nombre" 
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Mesa #" 
                                    value={tableNumber}
                                    onChange={e => setTableNumber(e.target.value)}
                                />
                            </div>

                            <div className="ticket-items">
                                {cart.length === 0 ? (
                                    <div className="empty-cart-msg">No hay productos en el ticket</div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menu_entry} className="ticket-item">
                                            <div className="item-details">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-subtotal">{(parseFloat(item.price) * item.quantity).toFixed(2)}€</span>
                                            </div>
                                            <div className="item-controls">
                                                <button onClick={() => updateQuantity(item.menu_entry, -1)}>−</button>
                                                <span className="item-qty">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.menu_entry, 1)}>+</button>
                                                <button className="delete-item-btn" onClick={() => removeFromCart(item.menu_entry)}>×</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="ticket-footer">
                                <div className="total-row">
                                    <span>TOTAL:</span>
                                    <span className="total-price">{total.toFixed(2)}€</span>
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
                    <div className="pending-grid">
                        {pendingTickets.length === 0 ? (
                            <div className="no-pending-msg">No hay tickets pendientes</div>
                        ) : (
                            pendingTickets.map(ticket => (
                                <div key={ticket.id} className="pending-ticket-card" onClick={() => loadPendingSale(ticket)}>
                                    <div className="pending-info">
                                        <span className="pending-id">#{ticket.id}</span>
                                        <span className="pending-date">{new Date(ticket.date).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="pending-customer">
                                        <strong>{ticket.customer_name || 'Sin nombre'}</strong>
                                        {ticket.table_number && <span className="table-tag">Mesa {ticket.table_number}</span>}
                                    </div>
                                    <div className="pending-items-summary">
                                        {ticket.items.length} productos
                                    </div>
                                    <div className="pending-total">
                                        {parseFloat(ticket.total_amount).toFixed(2)}€
                                    </div>
                                    <button className="load-btn">REANUDAR</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
