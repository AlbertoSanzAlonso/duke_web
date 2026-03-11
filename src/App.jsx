import React, { useState, useEffect } from 'react';
import './App.css';

const MENU_DATA = {
  Burgers: [
    { id: 1, name: 'Duke', description: 'Nuestra firma. Doble carne, cheddar, cebolla caramelizada.', price: '$12.900' },
    { id: 2, name: 'Marqués', description: 'Para los que saben. Queso de cabra, miel y nueces.', price: '$13.500' },
    { id: 3, name: 'Conde', description: 'Elegancia pura. Boletus, aceite de trufa y parmesano.', price: '$14.200' },
    { id: 4, name: 'Plebeyo', description: 'La de toda la vida. Lechuga, tomate, cebolla y pepinillo.', price: '$10.900' },
  ],
  Pachatas: [
    { id: 5, name: 'Provolone', description: 'Queso provolone fundido y chimichurri.', price: '$9.500' },
    { id: 6, name: 'BBQ', description: 'Salsa barbacoa casera y cebolla frita.', price: '$9.500' },
    { id: 7, name: 'Completa', description: 'Jamón, queso, huevo y ensalada.', price: '$11.000' },
    { id: 8, name: 'Especial', description: 'Nuestra mezcla secreta de la casa.', price: '$11.500' },
  ],
  Pizzas: [
    { id: 9, name: 'Mozzarella', description: 'Tomate, mozzarella y orégano.', price: '$9.000' },
    { id: 10, name: 'Especial', description: 'Jamón York, champiñones y pimiento.', price: '$11.500' },
    { id: 11, name: 'Napolitana', description: 'Anchoas, aceitunas negras y alcaparras.', price: '$12.000' },
    { id: 12, name: '4 Quesos', description: 'Mozzarella, gorgonzola, parmesano y emmental.', price: '$13.000' },
  ],
};

function App() {
  const [activeCategory, setActiveCategory] = useState('Burgers');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="nav-logo" />
          <div className="nav-links">
            <a href="#menu">CARTA</a>
            <a href="#about">NOSOTROS</a>
            <button className="cta-button">¡PEDÍ YA!</button>
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
              <button className="main-button">VER MENÚ</button>
              <button className="outline-button">LOCAL</button>
              <button className="delivery-button">
                A DOMICILIO
              </button>
            </div>
          </div>
          <div className="hero-image-container">
            <img src="/brand/hero_burger_hand.png" alt="Duke Burger" className="hero-burger-img" />
            <img src="/brand/duke burger 3 negativo.png" alt="Duke Sticker" className="sticker float-1" />
          </div>
        </div>
        <div className="marquee">
          <div className="marquee-content">
            BURGER - PACHATA - LOMO - PIZZA - SAN JUAN - BURGER - PACHATA - LOMO - PIZZA - SAN JUAN - BURGER - PACHATA - LOMO - PIZZA - SAN JUAN - BURGER - PACHATA - LOMO - PIZZA - SAN JUAN
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu" className="menu-section section">
        <div className="container">
          <div className="menu-header">
            <h2 className="section-title">NUESTRA CARTA</h2>
            <div className="menu-tabs">
              {Object.keys(MENU_DATA).map(cat => (
                <button
                  key={cat}
                  className={`tab-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid">
            {MENU_DATA[activeCategory].map(item => (
              <div key={item.id} className="menu-card hover-lift">
                <div className="card-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="card-footer">
                  <span className="price">{item.price}</span>
                  <button className="add-btn">+</button>
                </div>
              </div>
            ))}
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
    </div>
  );
}

export default App;
