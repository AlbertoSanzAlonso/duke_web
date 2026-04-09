import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, Minus, Plus, MessageCircle, MapPin, Instagram, Facebook, ChevronDown, Phone } from 'lucide-react';
import { fetchMenuEntries, createSale, fetchOpeningHours } from '../services/api';
import Toast from '../admin/components/Toast';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';

function Home() {
  const [activeCategory, setActiveCategory] = useState('Burgers');
  const [isScrolled, setIsScrolled] = useState(false);
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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({});
  const [openingHours, setOpeningHours] = useState([]);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    loadMenu();
    loadDeliverySettings();
    loadOpeningHours();

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
      
      // ALSO FETCH FROM DELIVERY RATES SINGLETON (More authoritative for banner/prices now)
      try {
        const dResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-rates/`);
        const dRates = await dResponse.json();
        // Prefer the marquee from delivery-rates if it exists
        if (dRates.marquee_text) {
          settingsMap.marquee_text = dRates.marquee_text;
        }
      } catch(e) { console.error("Error loading delivery-rates for banner", e); }

      setDeliverySettings(settingsMap);
    } catch (err) {
      console.error("Error loading delivery settings:", err);
    }
  };

  const loadOpeningHours = async () => {
    try {
      const data = await fetchOpeningHours();
      setOpeningHours(data);
    } catch (err) {
      console.error("Error loading opening hours:", err);
    }
  };

  const isStoreOpen = () => {
    if (openingHours.length === 0) return true; 

    const now = new Date();
    
    // Day calculation (Monday=1, Sunday=7)
    const dayDukeMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    const weekdayName = new Intl.DateTimeFormat('en-US', { 
      timeZone: 'America/Argentina/Buenos_Aires', 
      weekday: 'long' 
    }).format(now);
    const dayDuke = dayDukeMap[weekdayName] || 1;

    // Time calculation
    const argentinianTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour12: false,
      hour: 'numeric', 
      minute: 'numeric'
    });
    
    const parts = argentinianTime.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    
    const hour = parseInt(getPart('hour'));
    const minute = parseInt(getPart('minute'));
    const currentHourMin = hour * 60 + minute;
    
    const todaySchedule = openingHours.find(h => h.day === dayDuke);
    if (!todaySchedule || !todaySchedule.is_open) return false;
    
    const [openH, openM] = (todaySchedule.opening_time || "20:00").split(':').map(Number);
    const [closeH, closeM] = (todaySchedule.closing_time || "00:00").split(':').map(Number);
    
    const openTimeMin = openH * 60 + openM;
    let closeTimeMin = closeH * 60 + closeM;
    
    if (closeTimeMin <= openTimeMin) {
       // Support overnight hours (e.g. 20:00 to 02:00)
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

      // Group by category, prioritizing availability and scheduling
      const fechaArg = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
      const dayIndex = fechaArg.getDay(); // 0 is Sunday, 1 Monday...
      const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayField = `active_${daysMap[dayIndex]}`;
      const todayStr = fechaArg.toISOString().split('T')[0];

      const grouped = entries.reduce((acc, entry) => {
        if (!entry.is_available) return acc;
        
        const isScheduledToday = entry[currentDayField] !== false;
        const isWithinDateRange = (!entry.start_date || todayStr >= entry.start_date) && 
                                  (!entry.end_date || todayStr <= entry.end_date);
        const isAvailableToday = isScheduledToday && isWithinDateRange;
        if (!isAvailableToday) return acc;

        const cat = entry.category || 'Burgers';
        if (!acc[cat]) acc[cat] = [];
        
        const daysMapRef = { 'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles', 'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo' };
        const activeDaysList = Object.keys(daysMapRef).filter(d => entry[`active_${d}`] !== false).map(d => daysMapRef[d]);

        const itemObj = {
          id: entry.id,
          name: entry.product?.name || 'Producto sin nombre',
          description: entry.product?.description || '',
          ingredients: entry.product?.ingredients || '',
          price: entry.price,
          image: entry.product?.image || null,
          category: cat,
          isAvailableToday,
          activeDays: activeDaysList
        };
        
        acc[cat].push(itemObj);

        return acc;
      }, {});
      
      const availableCategories = Object.keys(grouped);
      // Sort alphabetically
      const finalCategories = availableCategories.sort();
      
      console.log("Menu loaded successfully. Categories found:", finalCategories);
      
      setMenuData(grouped);
      
      // Ensure we have a valid activeCategory
      if (finalCategories.length > 0) {
        if (!activeCategory || !finalCategories.some(c => c.toLowerCase() === activeCategory.toLowerCase())) {
          setActiveCategory(finalCategories[0]);
        }
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    if (item.category === 'Promos' && !item.isAvailableToday) {
      setToast({ 
        message: `Esta promo no está disponible hoy. Días: ${item.activeDays.join(', ')}`, 
        type: 'error' 
      });
      return;
    }
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
      setErrorMessage("Por favor, ingresa tu nombre para el pedido.");
      return;
    }

    if (!isStoreOpen()) {
      const now = new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"});
      const fechaArg = new Date(now);
      let dayIdx = fechaArg.getDay(); // 0 (Sun) to 6 (Sat)
      const dayDuke = dayIdx === 0 ? 7 : dayIdx;
      const todaySchedule = openingHours.find(h => h.day === dayDuke);
      
      let closedMsg = "Lo sentimos, actualmente estamos CERRADOS.";
      if (todaySchedule) {
        if (todaySchedule.is_open) {
          const openStr = todaySchedule.opening_time ? todaySchedule.opening_time.slice(0,5) : "20:00";
          const closeStr = todaySchedule.closing_time ? todaySchedule.closing_time.slice(0,5) : "00:00";
          closedMsg = `Lo sentimos, actualmente estamos CERRADOS. Hoy ${todaySchedule.day_name} atendemos de ${openStr} a ${closeStr} hs.`;
        } else {
          closedMsg = `Lo sentimos, actualmente estamos CERRADOS. Hoy ${todaySchedule.day_name} el local permanece cerrado.`;
        }
      }
      
      setErrorMessage(`${closedMsg} El pedido se mantendrá en tu carrito si deseas enviarlo más tarde.`);
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
      const phone = "5492645095054";
      const ticketUrl = `${window.location.origin}/ticket/${createdSale.id}`;
      
      let message = `¡Hola Duke Burger! Soy *${customerName.trim()}*.\n`;
      message += `He realizado un nuevo Pedido Web:\n\n`;
      message += `TICKET #${createdSale.id}\n`;
      message += `ENTREGA: ${deliveryMode === 'delivery' ? '📍 A DOMICILIO' : '🏪 RETIRO EN LOCAL'}\n`;
      
      if (deliveryMode === 'delivery') {
        message += `ENVÍO: $${deliveryCost.toLocaleString('es-AR')}\n`;
        message += `\n*La ubicación de entrega se detalla en el ticket digital adjunto.*\n`;
      }
      
      message += `\n👇 VER DETALLE DEL PEDIDO:\n${ticketUrl}\n\n`;

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
      setErrorMessage("Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Object.keys(menuData);
  const currentItems = menuData[activeCategory] || (categories.length > 0 ? menuData[categories[0]] : []);

  return (
    <div className="app">
      <Helmet>
        <title>Duke Burger | Las Mejores Hamburguesas de San Juan, Argentina</title>
        <meta name="description" content="Las mejores hamburguesas artesanales de San Juan. Sabor brutal, espíritu local. Disfrutá de nuestras burgers, pachatas, lomos y pizzas con delivery a domicilio." />
        <link rel="canonical" href="https://dukeburger-sj.com/" />
        
        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content="Duke Burger | Las Mejores Hamburguesas de San Juan" />
        <meta property="og:description" content="Pedí online las mejores hamburguesas de San Juan. Sabor brutal, espíritu local." />
        <meta property="og:url" content="https://dukeburger-sj.com/" />
      </Helmet>
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <img src="/brand/duke burger 2 negativo.png" alt="Duke Burger San Juan - Logo Negativo" className="nav-logo" />
          
          <div className="nav-actions">
            <div className="nav-links-desktop">
              <a href="#menu">CARTA</a>
              <Link to="/nosotros">NOSOTROS</Link>
            </div>
            <button className="cta-button" onClick={() => setIsPromosOpen(true)}>
              % PROMOS
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
              >
                NOSOTROS
              </Link>
            </div>
          </div>
          <div className="hero-image-container">
            <img src="/brand/hero_burger_new.png" alt="Deliciosa hamburguesa artesanal de Duke Burger en San Juan con queso y panceta" className="hero-burger-img" />
            <img src="/brand/duke burger 3 negativo.png" alt="Duke Sticker" className="sticker float-1" />
          </div>
        </div>
        <div className="marquee">
          <div className="marquee-content" style={{ display: 'flex', width: 'max-content', gap: '30px' }}>
            {/* Contenido repetido para bucle infinito sin saltos */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '2rem', 
                color: 'white',
                whiteSpace: 'nowrap'
              }}>
                {deliverySettings.marquee_text || "BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN - "}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu" className="menu-section section">
        <div className="container">
          <div className="menu-header">
            <h2 className="section-title">NUESTRA CARTA</h2>
            <div 
              className="scroll-indicator-container" 
              onClick={() => {
                const tabs = document.querySelector('.menu-tabs');
                const navbar = document.querySelector('.navbar');
                if (tabs) {
                  const navHeight = navbar ? navbar.offsetHeight : 100;
                  // Increase offset significantly to ensure no coverage even on desktop
                  const y = tabs.getBoundingClientRect().top + window.pageYOffset - (navHeight + 60);
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
            >
              <ChevronDown className="floating-arrow-red" size={40} color="var(--color-primary)" />
            </div>
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

          <div className="menu-grid" data-nosnippet>
            {loading ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>Cargando carta de Duke Burger...</p>
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



      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button className="cart-fab" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={24} />
          <span className="cart-fab-count">{totalItems}</span>
        </button>
      )}

      {/* Floating Contact Button (Always visible if cart is empty) */}
      {totalItems === 0 && <FloatingContact />}


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
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      background: deliveryMode === 'takeaway' ? 'var(--color-primary)' : '#222', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '1px'
                    }}
                  >
                    RETIRO
                  </button>
                  <button 
                    onClick={() => setDeliveryMode('delivery')} 
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      background: deliveryMode === 'delivery' ? 'var(--color-primary)' : '#222', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '1px'
                    }}
                  >
                    ENVÍO
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
                        onClick={(e) => {
                          e.preventDefault();
                          calculateDistance(deliveryAddress);
                        }}
                        disabled={isCalculating}
                        style={{ padding: '0 10px', height: '40px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {isCalculating ? '...' : 'Calcular'}
                      </button>
                    </div>
                  </div>
                )}


                {errorMessage && (
                  <p className="error-display-modal" style={{ color: '#ff4d4d', fontSize: '0.9rem', marginTop: '15px', background: 'rgba(255, 77, 77, 0.1)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 77, 77, 0.2)', fontWeight: 'bold', textAlign: 'center' }}>
                    {errorMessage}
                  </p>
                )}
                {deliveryMode === 'delivery' && deliveryCost > 0 && !errorMessage && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '10px', fontWeight: 'bold' }}>
                    Costo de envío: ${deliveryCost.toLocaleString('es-AR')}
                  </p>
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
              {/* Name, Category and Description removed by user request */}
              
              <div className="detail-split-layout">
                {selectedProduct.ingredients && (
                  <div className="detail-ingredients">
                    <h3>Ingredientes</h3>
                    <p>{selectedProduct.ingredients}</p>
                  </div>
                )}
                
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
                    {cart[selectedProduct.id] ? 'CERRAR PRODUCTO' : `AGREGAR $${parseFloat(selectedProduct.price).toLocaleString('es-AR')}`}
                  </button>
                </div>
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
                            className={`add-btn ${!promo.isAvailableToday ? 'disabled' : ''}`}
                            onClick={() => {
                              if (!promo.isAvailableToday) {
                                addToCart(promo);
                                return;
                              }
                              addToCart(promo);
                              setIsPromosOpen(false);
                            }}
                          >
                            {!promo.isAvailableToday ? 'NO DISP.' : '+ AGREGAR'}
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
          <div className="cart-modal hours-modal-main">
            <div className="modal-header">
              <h2 className="hours-modal-title">HORARIOS</h2>
              <button className="close-btn" onClick={() => setIsHoursModalOpen(false)}>×</button>
            </div>
            <div className="modal-body hours-modal-body">
              <div className="hours-container-inner">
                <MessageCircle size={40} className="hours-icon" />
                <h3>Estamos para servirte</h3>
                <p>Nuestro local y delivery operan en:</p>
                <div className="hours-list-box">
                  {openingHours.filter(h => h.is_open).length > 0 ? (
                    openingHours.filter(h => h.is_open).map(h => (
                      <div key={h.id} className="hours-row">
                        <span className="day-name">{h.day_name}</span>
                        <span className="time-range">{h.opening_time.slice(0,5)} a {h.closing_time.slice(0,5)} hs</span>
                      </div>
                    ))
                  ) : (
                    <p className="closed-label">CERRADO</p>
                  )}
                </div>
              </div>
              
              <button 
                className="confirm-order-btn" 
                style={{ marginTop: '20px' }}
                onClick={() => setIsHoursModalOpen(false)}
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Home;
