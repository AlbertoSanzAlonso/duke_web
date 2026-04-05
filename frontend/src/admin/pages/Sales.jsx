import React, { useState, useEffect } from 'react';
import { fetchMenuEntries, createSale } from '../../services/api';
import './Sales.css';

const Sales = () => {
    const [menuEntries, setMenuEntries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            const data = await fetchMenuEntries();
            setMenuEntries(data.filter(e => e.is_available));
            setLoading(false);
        } catch (error) {
            console.error("Error loading menu:", error);
            setLoading(false);
        }
    };

    const categories = ["Todas", ...new Set(menuEntries.map(e => e.category))];

    const addToCart = (entry) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === entry.id);
            if (existing) {
                return prevCart.map(item =>
                    item.id === entry.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...entry, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const [isTicketOpen, setIsTicketOpen] = useState(false);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const toggleTicket = () => setIsTicketOpen(!isTicketOpen);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsSaving(true);
        try {
            const saleData = {
                total_amount: total,
                notes: "Venta desde TPV",
                items: cart.map(item => ({
                    menu_entry: item.id,
                    quantity: item.quantity,
                    price_at_sale: item.price
                }))
            };
            await createSale(saleData);
            alert("¡Venta registrada con éxito!");
            setCart([]);
            setIsTicketOpen(false);
        } catch (error) {
            alert("Error al registrar la venta");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMenu = selectedCategory === "Todas" 
        ? menuEntries 
        : menuEntries.filter(e => e.category === selectedCategory);

    if (loading) return <div className="pos-loading">Cargando TPV...</div>;

    return (
        <div className="pos-container">
            {/* FAB para móviles */}
            <button className="pos-fab" onClick={toggleTicket}>
                <span className="fab-count">{totalItems}</span>
                <span className="fab-text">Ver Ticket</span>
                <span className="fab-total">{total.toFixed(2)}€</span>
            </button>

            {/* Header / Categorías */}
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
                {/* Cuadrícula de productos */}
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

                {/* Sidebar del Ticket (con clase condicional para móvil) */}
                <div className={`pos-ticket-sidebar ${isTicketOpen ? 'open' : ''}`}>
                    <div className="ticket-header">
                        <button className="close-ticket-btn" onClick={() => setIsTicketOpen(false)}>×</button>
                        <h2>Ticket Actual</h2>
                        <button className="clear-btn" onClick={() => setCart([])}>Limpiar</button>
                    </div>
                    
                    <div className="ticket-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart-msg">No hay productos en el ticket</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="ticket-item">
                                    <div className="item-details">
                                        <span className="item-name">{item.product.name}</span>
                                        <span className="item-subtotal">{(item.price * item.quantity).toFixed(2)}€</span>
                                    </div>
                                    <div className="item-controls">
                                        <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                                        <span className="item-qty">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                                        <button className="delete-item-btn" onClick={() => removeFromCart(item.id)}>×</button>
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
                        <button 
                            className="checkout-btn" 
                            disabled={cart.length === 0 || isSaving}
                            onClick={handleCheckout}
                        >
                            {isSaving ? "Procesando..." : "COBRAR TICKET"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sales;
