import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Minus, Plus, MessageCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchMenuEntries, createSale } from '../services/api';

function Home() {
  const [activeCategory, setActiveCategory] = useState('Burgers');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('takeaway'); // 'takeaway' or 'delivery'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryRates, setDeliveryRates] = useState({ base: 1000, km: 200, max: 15 });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPromosOpen, setIsPromosOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({});
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    loadMenu();
    loadDeliverySettings();

    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Autocomplete debounced search
  useEffect(() => {
    if (!deliveryAddress || deliveryAddress.length < 4 || !showSuggestions) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Search localized in San Juan, Argentina with proper User-Agent as required by Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)},+San+Juan,+Argentina&format=json&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'DukeBurgerApp/1.0' } }
        );
        const data = await response.json();
        setAddressSuggestions(data);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [deliveryAddress, showSuggestions]);

  const loadDeliverySettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings/`);
      const settings = await response.json();
      const base = settings.find(s => s.key === 'delivery_base_price')?.value;
      const km = settings.find(s => s.key === 'delivery_km_price')?.value;
      const max = settings.find(s => s.key === 'delivery_max_km')?.value;
      if (base && km) {
        setDeliveryRates({ 
          base: parseFloat(base), 
          km: parseFloat(km),
          max: parseFloat(max || 15)
        });
      }
      
      // Store all settings in deliverySettings for easy access
      const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
      setDeliverySettings(settingsMap);
    } catch (err) {
      console.error("Error loading delivery settings:", err);
    }
  };

  const isStoreOpen = () => {
    if (!deliverySettings.opening_days) return true; 

    const now = new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"});
    const fechaArg = new Date(now);
    
    let dayArg = fechaArg.getDay(); 
    if (dayArg === 0) dayArg = 7; 
    
    const openingDays = deliverySettings.opening_days.split(',');
    if (!openingDays.includes(dayArg.toString())) return false;
    
    const currentHourMin = fechaArg.getHours() * 60 + fechaArg.getMinutes();
    const [openH, openM] = (deliverySettings.opening_time || "20:00").split(':').map(Number);
    const [closeH, closeM] = (deliverySettings.closing_time || "00:00").split(':').map(Number);
    
    const openTimeMin = openH * 60 + openM;
    let closeTimeMin = closeH * 60 + closeM;
    
    if (closeTimeMin <= openTimeMin) {
       return currentHourMin >= openTimeMin || currentHourMin <= closeTimeMin;
    }
    return currentHourMin >= openTimeMin && currentHourMin <= closeTimeMin;
  };

  const loadMenu = async () => {
    try {
      const entries = await fetchMenuEntries();
      if (!entries || entries.length === 0) {
        setMenuData({});
        return;
      }

      // Group by category, prioritizing availability
      const grouped = entries.reduce((acc, entry) => {
        if (!entry.is_available) return acc;
        
        const cat = entry.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          id: entry.id,
          name: entry.product.name,
          description: entry.product.description,
          price: entry.price,
          image: entry.product.image
        });
        return acc;
      }, {});
      
      const availableCategories = Object.keys(grouped);
      console.log("Menu loaded successfully. Categories found:", availableCategories);
      
      setMenuData(grouped);
      
      // Ensure we have a valid activeCategory
      if (availableCategories.length > 0) {
        // If current activeCategory doesn't exist in data, pick the first one
        const normalActive = activeCategory;
        if (!activeCategory || !availableCategories.some(c => c.toLowerCase() === normalActive.toLowerCase())) {
          setActiveCategory(availableCategories[0]);
        }
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        quantity: (prev[item.id]?.quantity || 0) + 1
      }
    }));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const newQty = (prev[id]?.quantity || 0) + delta;
      if (newQty <= 0) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: { ...prev[id], quantity: newQty }
      };
    });
  };

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPriceWithoutDelivery = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalPrice = totalPriceWithoutDelivery + (deliveryMode === 'delivery' ? deliveryCost : 0);

  const calculateDistance = async (address) => {
    if (!address.trim()) return;
    setIsCalculating(true);
    setErrorMessage(null);
    try {
      // Pre-process San Juan specific address formats (O) -> Oeste, etc.
      let cleanedAddr = address
        .replace(/\(O\)/gi, 'Oeste')
        .replace(/\(E\)/gi, 'Este')
        .replace(/\(N\)/gi, 'Norte')
        .replace(/\(S\)/gi, 'Sur');

      const searchQueries = [
        `${cleanedAddr}, San Juan, Argentina`,
        `${cleanedAddr}, Argentina`,
        cleanedAddr // Global fallback
      ];

      let data = [];
      for (const query of searchQueries) {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const response = await fetch(geocodeUrl, {
          headers: { 'Accept-Language': 'es' }
        });
        data = await response.json();
        if (data && data[0]) break;
      }

      if (data && data[0]) {
        const destLat = parseFloat(data[0].lat);
        const destLon = parseFloat(data[0].lon);
        const originLat = -31.5375; 
        const originLon = -68.5364;

        const R = 6371;
        const dLat = (destLat - originLat) * Math.PI / 180;
        const dLon = (destLon - originLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        const basePrice = deliveryRates.base;
        const perKmPrice = deliveryRates.km;
        const maxKm = deliveryRates.max;

        if (distance > maxKm) {
          setErrorMessage(`Lo sentimos, la dirección está a ${distance.toFixed(1)} km y nuestro límite de entrega es de ${maxKm} km.`);
          setDeliveryCost(0);
          return;
        }

        let calculatedCost = 0;
        if (distance < 1) {
          calculatedCost = basePrice;
        } else {
          // If 1km or more, use per-km formula
          calculatedCost = distance * perKmPrice;
        }

        // Always round to nearest 100 for AR (e.g., 550 -> 600)
        calculatedCost = Math.max(basePrice, Math.ceil(calculatedCost / 100) * 100);
        
        setDeliveryCost(calculatedCost);
        // Better display name
        const displayName = data[0].display_name.split(',').slice(0, 2).join(',');
        setDeliveryAddress(displayName);
      } else {
        setErrorMessage("No encontramos la dirección. Prueba escribiendo Calle y Número (Ej: Entre Rios 540).");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error de conexión al buscar la dirección.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    setIsCalculating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`);
        const data = await response.json();
        if (data && data.display_name) {
          const cleanAddr = data.display_name.split(',').slice(0, 2).join(',');
          setDeliveryAddress(cleanAddr);
          calculateDistance(cleanAddr);
        }
      } catch (err) {
        setErrorMessage("No pudimos obtener tu ubicación GPS.");
      } finally {
        setIsCalculating(false);
      }
    }, () => {
      setErrorMessage("Permiso de ubicación denegado por el navegador.");
      setIsCalculating(false);
    });
  };

  const sendWhatsAppOrder = async () => {
    if (!customerName.trim()) {
      alert("Por favor, ingresa tu nombre para el pedido.");
      return;
    }

    if (!isStoreOpen()) {
      setErrorMessage(`Actualmente estamos CERRADOS. Nuestro horario es de ${deliverySettings.opening_time} a ${deliverySettings.closing_time}. El pedido se mantendrá en tu carrito si deseas guardarlo.`);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create PENDING sale in DB
      const saleData = {
        total_amount: totalPrice,
        status: 'PENDING',
        customer_name: customerName,
        table_number: deliveryMode === 'delivery' ? `DELIVERY: ${deliveryAddress}` : "RETIRO EN LOCAL",
        delivery_cost: deliveryMode === 'delivery' ? deliveryCost : 0,
        notes: orderNotes ? `${orderNotes}` : "Pedido desde la Web",
        items: cartItems.map(item => ({
          menu_entry: item.id,
          quantity: item.quantity,
          price_at_sale: item.price
        }))
      };

      const createdSale = await createSale(saleData);

      // 2. Format WhatsApp Message
      const phone = "5492645142897";
      const ticketUrl = `${window.location.origin}/ticket/${createdSale.id}`;
      
      let message = `¡Hola Duke Burger! Soy *${customerName}*.\n`;
      message += `He realizado un nuevo Pedido Web:\n\n`;
      message += `TICKET #${createdSale.id}\n`;
      message += `ENTREGA: ${deliveryMode === 'delivery' ? 'A DOMICILIO' : 'RETIRO EN LOCAL'}\n`;
      
      if (deliveryMode === 'delivery') {
        message += `DIRECCIÓN: ${deliveryAddress}\n`;
        message += `MAPA: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress + ", San Juan, Argentina")}\n`;
      }
      
      message += `\nVER DETALLE DEL PEDIDO:\n${ticketUrl}\n\n`;

      if (orderNotes.trim()) {
        message += `\nNOTAS: ${orderNotes}\n`;
      }
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      // 3. Reset Cart
      setCart({});
      setCustomerName('');
      setOrderNotes('');
      setDeliveryAddress('');
      setDeliveryCost(0);
      setIsCartOpen(false);
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Object.keys(menuData);
  const currentItems = menuData[activeCategory] || (categories.length > 0 ? menuData[categories[0]] : []);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="nav-logo" />
          
          <div className="nav-actions">
            <div className="nav-links-desktop">
              <a href="#menu">CARTA</a>
              <Link to="/nosotros">NOSOTROS</Link>
            </div>
            <button className="cta-button" onClick={() => setIsPromosOpen(true)}>
              PROMOS
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              MÁS QUE <br />
              <span>HAMBURGUESAS.</span>
            </h1>
            <p className="hero-subtitle">Sabor brutal. Espíritu Duke.</p>
            <div className="hero-actions">
              <button className="main-button" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>VER MENÚ</button>
              <button className="outline-button" onClick={() => setIsHoursModalOpen(true)}>HORARIOS</button>
              {/* This button will only show on mobile via CSS */}
              <Link
                to="/nosotros"
                className="nosotros-btn-hero"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                NOSOTROS
              </Link>
            </div>
          </div>
          <div className="hero-image-container">
            <img src="/brand/hero_burger_new.png" alt="Duke Burger" className="hero-burger-img" />
            <img src="/brand/duke burger 3 negativo.png" alt="Duke Sticker" className="sticker float-1" />
          </div>
        </div>
        <div className="marquee">
          <div className="marquee-content">
            BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN - BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN - BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu" className="menu-section section">
        <div className="container">
          <div className="menu-header">
            <h2 className="section-title">NUESTRA CARTA</h2>
            <div className="menu-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`tab-item ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid">
            {loading ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>Cargando carta de Duke Burgers...</p>
            ) : categories.length === 0 ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>No hay platos disponibles en este momento.</p>
            ) : (
              currentItems.map(item => (
                <div 
                  key={item.id} 
                  className="menu-card hover-lift"
                  onClick={() => setSelectedProduct(item)}
                >
                  {item.image && (
                    <div className="card-image-container">
                      <img src={item.image} alt={item.name} />
                    </div>
                  )}
                  <div className="card-info">
                    <div className="card-title-row">
                      <h3>{item.name}</h3>
                      {cart[item.id] && (
                        <span className="item-badge">{cart[item.id].quantity}x</span>
                      )}
                    </div>
                    <p className="card-desc-short">{item.description}</p>
                  </div>
                  <div className="card-footer">
                    <span className="price">${parseFloat(item.price).toLocaleString('es-AR')}</span>
                    <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/brand/duke burger 1 negativo.png" alt="Duke Logo" className="footer-logo" />
              <p>© 2025 DUKE BURGER. SAN JUAN, ARGENTINA.</p>
            </div>
            <div className="footer-links">
              <h3>SOCIAL</h3>
              <a href="https://www.instagram.com/dukeburger.sj" target="_blank" rel="noopener noreferrer">@DUKEBURGER.SJ</a>
              <p>WSP: 264 5142897</p>
            </div>
            <div className="footer-info">
              <h3>UBICACIÓN</h3>
              <p>Bº Frondizi - Rivadavia</p>
              <p>(Laprida y Avelín)</p>
              <p>San Juan, Argentina</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button className="cart-fab" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={24} />
          <span className="cart-fab-count">{totalItems}</span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>TU PEDIDO</h2>
              <button className="close-modal" onClick={() => setIsCartOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-info-section">
                <label>OPCIONES DE ENTREGA</label>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                  <button 
                    onClick={() => setDeliveryMode('takeaway')} 
                    style={{ flex: 1, padding: '10px', background: deliveryMode === 'takeaway' ? 'var(--color-primary)' : '#222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Retiro
                  </button>
                  <button 
                    onClick={() => setDeliveryMode('delivery')} 
                    style={{ flex: 1, padding: '10px', background: deliveryMode === 'delivery' ? 'var(--color-primary)' : '#222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Envío
                  </button>
                </div>

                {deliveryMode === 'delivery' && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="Ej: Entre Rios 540"
                        value={deliveryAddress}
                        onChange={e => {
                          setDeliveryAddress(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        style={{ flex: 1, fontSize: '0.9rem' }}
                      />
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="address-suggestions-dropdown">
                          {addressSuggestions.map((s, idx) => (
                            <div 
                              key={idx} 
                              className="suggestion-item"
                              onClick={() => {
                                const cleanName = s.display_name.split(',').slice(0, 3).join(',');
                                setDeliveryAddress(cleanName);
                                setAddressSuggestions([]);
                                setShowSuggestions(false);
                                calculateDistance(cleanName);
                              }}
                            >
                              <MapPin size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
                              <span>{s.display_name.split(',').slice(0, 4).join(',')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={handleGeolocation}
                        title="Usar mi ubicación actual"
                        style={{ background: '#333', border: 'none', borderRadius: '4px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <MapPin size={18} color="white" />
                      </button>
                      <button 
                        onClick={() => {
                          setShowSuggestions(false);
                          calculateDistance(deliveryAddress);
                        }}
                        disabled={isCalculating}
                        style={{ padding: '0 10px', height: '40px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {isCalculating ? '...' : 'Calcular'}
                      </button>
                    </div>
                    {errorMessage && (
                      <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '10px', background: 'rgba(255, 77, 77, 0.1)', padding: '8px', borderRadius: '4px' }}>
                        {errorMessage}
                      </p>
                    )}
                    {deliveryCost > 0 && !errorMessage && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '10px', fontWeight: 'bold' }}>
                        Costo de envío: ${deliveryCost.toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="customer-info-section">
                <label>TU NOMBRE *</label>
                <input 
                  type="text" 
                  placeholder="Tu nombre"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={!customerName && cartItems.length > 0 ? "input-highlight" : ""}
                />
              </div>

              <div className="customer-info-section">
                <label>COMENTARIOS (Cambios, aclaraciones...)</label>
                <textarea 
                  placeholder="Ej: Sin cebolla la burger..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                />
              </div>

              {cartItems.length === 0 ? (
                <p className="empty-msg">Tu carrito está vacío</p>
              ) : (
                <div className="cart-items-list">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item-row">
                      <div className="item-main">
                        <h4>{item.name}</h4>
                        <span className="item-price-unit">${parseFloat(item.price).toLocaleString('es-AR')}</span>
                      </div>
                      <div className="item-actions">
                        <button onClick={() => updateQuantity(item.id, -1)}><Minus size={18} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}><Plus size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-total">
                <span>TOTAL</span>
                <span>${totalPrice.toLocaleString('es-AR')}</span>
              </div>
              <button 
                className="confirm-order-btn" 
                disabled={cartItems.length === 0 || !customerName.trim() || isSaving}
                onClick={sendWhatsAppOrder}
              >
                {isSaving ? (
                  "PROCESANDO..."
                ) : (
                  <>
                    <MessageCircle size={20} />
                    CONFIRMAR POR WHATSAPP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-detail" onClick={() => setSelectedProduct(null)}>
              <X size={24} color="white" />
            </button>
            <div className="detail-hero">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              ) : (
                <div className="detail-no-img">🍔</div>
              )}
              <div className="detail-price-badge">
                ${parseFloat(selectedProduct.price).toLocaleString('es-AR')}
              </div>
            </div>
            <div className="detail-content">
              <div className="detail-header">
                <h2>{selectedProduct.name}</h2>
                <span className="detail-cat">{activeCategory}</span>
              </div>
              <p className="detail-desc">{selectedProduct.description || ''}</p>
              
              <div className="detail-footer">
                <div className="detail-qty-control">
                  <button 
                    onClick={() => {
                      if (cart[selectedProduct.id]?.quantity > 1) {
                        updateQuantity(selectedProduct.id, -1);
                      } else {
                        updateQuantity(selectedProduct.id, -1);
                        setSelectedProduct(null);
                      }
                    }}
                  >
                    {cart[selectedProduct.id]?.quantity > 1 ? <Minus size={20} /> : <X size={20} />}
                  </button>
                  <span className="detail-qty">{cart[selectedProduct.id]?.quantity || 0}</span>
                  <button onClick={() => {
                    if (!cart[selectedProduct.id]) {
                      addToCart(selectedProduct);
                    } else {
                      updateQuantity(selectedProduct.id, 1);
                    }
                  }}>
                    <Plus size={20} />
                  </button>
                </div>
                <button 
                  className="detail-add-button"
                  onClick={() => {
                    if (!cart[selectedProduct.id]) {
                      addToCart(selectedProduct);
                    }
                    setSelectedProduct(null);
                  }}
                >
                  {cart[selectedProduct.id] ? 'CONFIRMAR' : 'AGREGAR AL PEDIDO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Promos Modal */}
      {isPromosOpen && (
        <div className="modal-overlay" onClick={() => setIsPromosOpen(false)}>
          <div className="cart-modal promos-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>PROMOS DUKE</h2>
              <button className="close-modal-detail" onClick={() => setIsPromosOpen(false)} style={{ position: 'static' }}>
                <X size={24} color="white" />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="promos-grid-modal">
                {menuData['Promos']?.length > 0 ? (
                  menuData['Promos'].map(promo => (
                    <div key={promo.id} className="promo-item-card">
                      <div className="promo-image">
                        {promo.image ? <img src={promo.image} alt={promo.name} /> : <span>🎁</span>}
                      </div>
                      <div className="promo-info">
                        <h3>{promo.name}</h3>
                        <p>{promo.description}</p>
                        <div className="promo-footer">
                          <span className="price">${parseFloat(promo.price).toLocaleString('es-AR')}</span>
                          <button 
                            className="add-btn" 
                            onClick={() => {
                              addToCart(promo);
                              setIsPromosOpen(false);
                            }}
                          >
                            + AGREGAR
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-msg">No hay promociones activas en este momento. ¡Vuelve pronto!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Horarios */}
      {isHoursModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="cart-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.8rem' }}>HORARIOS</h2>
              <button className="close-btn" onClick={() => setIsHoursModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ marginBottom: '30px' }}>
                <MessageCircle size={48} color="var(--color-primary)" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Estamos para servirte</h3>
                <p style={{ color: '#888', fontSize: '1.1rem' }}>Nuestro local y delivery operan en:</p>
              </div>
              
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                  {deliverySettings.opening_time || '20:00'} hs — {deliverySettings.closing_time || '00:00'} hs
                </div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {(!deliverySettings.opening_days || deliverySettings.opening_days === '1,2,3,4,5,6,7') 
                    ? 'TODOS LOS DÍAS' 
                    : ` ${deliverySettings.opening_days.split(',').map(d => {
                        const days = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
                        return days[parseInt(d)];
                      }).join(', ')}`
                  }
                </div>
              </div>
              
              <button 
                className="confirm-order-btn" 
                style={{ marginTop: '30px' }}
                onClick={() => setIsHoursModalOpen(false)}
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
