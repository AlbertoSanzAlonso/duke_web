import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import InstagramFeed from '../components/InstagramFeed.tsx';
import { fetchGalleryImages } from '../services/api';

function About() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await fetchGalleryImages();
        setGallery(data);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGallery();
  }, []);

  return (
    <div className="about-page">
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link to="/">
            <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="nav-logo" />
          </Link>
          <div className="nav-links">
            <Link to="/">CARTA</Link>
            <Link to="/nosotros" style={{ color: 'var(--color-primary)' }}>NOSOTROS</Link>
            <Link to="/" className="cta-button" style={{ textDecoration: 'none' }}>¡PEDÍ YA!</Link>
          </div>
          <div className="mobile-toggle">
            <Link to="/"><Menu size={28} color="white" /></Link>
          </div>
        </div>
      </nav>

      <section className="about-hero">
        <div className="about-hero-content">
          <h1>DUKE BURGER</h1>
          <p>Sabor brutal. Espíritu local.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2 className="section-title">NUESTRA HISTORIA</h2>
          <div className="about-text">
            <p>
              Nacimos en San Juan con una misión clara: traer hamburguesas artesanales 
              con sabor único y personalidad propia. Cada burger es preparada con 
              ingredientes frescos y mucho amor.
            </p>
            <p>
              En Duke Burger no solo servimos comida, servimos experiencias. 
              Nuestro local en el corazón de Bº Frondizi es el punto de encuentro 
              para quienes buscan algo diferente.
            </p>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="container">
          <h2 className="section-title">NUESTRO LOCAL</h2>
          {loading ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>Cargando imágenes...</p>
          ) : gallery.length > 0 ? (
            <div className="gallery-grid">
              {gallery.map((img, idx) => (
                <div key={img.id} className={`gallery-item gallery-item-${(idx % 4) + 1}`}>
                   <img src={img.image} alt={img.title || 'Duke Burger'} className="gallery-img-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-grid">
              <div className="gallery-item gallery-item-1">
                <div className="gallery-placeholder">
                  <span>Interior</span>
                </div>
              </div>
              <div className="gallery-item gallery-item-2">
                <div className="gallery-placeholder">
                  <span>Barra</span>
                </div>
              </div>
              <div className="gallery-item gallery-item-3">
                <div className="gallery-placeholder">
                  <span>Área Exterior</span>
                </div>
              </div>
              <div className="gallery-item gallery-item-4">
                <div className="gallery-placeholder">
                  <span>Cocina</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="instagram-section">
        <div className="container">
          <h2 className="section-title">SEGUINOS EN INSTAGRAM</h2>
          <p className="instagram-handle">@dukeburger.sj</p>
          <InstagramFeed />
          <a 
            href="https://www.instagram.com/dukeburger.sj/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="instagram-follow-btn"
          >
            SEGUIR EN INSTAGRAM
          </a>
        </div>
      </section>

      <section className="location-section">
        <div className="container">
          <h2 className="section-title">DÓNDE ESTAMOS</h2>
          <div className="location-content">
            <div className="location-info">
              <div className="location-card">
                <h3>DIRECCIÓN</h3>
                <p>Bº Frondizi - Rivadavia</p>
                <p>(Laprida y Avelín)</p>
                <p>San Juan, Argentina</p>
              </div>
              <div className="location-card">
                <h3>HORARIOS</h3>
                <p>Lunes a Jueves: 20:00 - 00:00</p>
                <p>Viernes a Domingo: 20:00 - 02:00</p>
              </div>
              <div className="location-card">
                <h3>CONTACTO</h3>
                <p>WhatsApp: 264 5142897</p>
                <p>Instagram: @dukeburger.sj</p>
              </div>
            </div>
            <div className="map-container">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.0894!2d-68.5462!3d-31.5187!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96879f9f7c2c0f57%3A0x5e8f8c0e5c5e0e3a!2sLaprida%20Oeste%20%26%20Jos%C3%A9%20Avel%C3%ADn%2C%20Rivadavia%2C%20San%20Juan!5e0!3m2!1ses!2sar!4v1!5m2!1ses!2sar"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Duke Burger"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

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

export default About;
