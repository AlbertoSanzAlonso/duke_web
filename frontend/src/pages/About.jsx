import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { fetchGalleryImages, fetchOpeningHours } from '../services/api';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';

function About() {
  const [gallery, setGallery] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [galleryData, hoursData] = await Promise.all([
          fetchGalleryImages(),
          fetchOpeningHours()
        ]);
        setGallery(galleryData);
        setOpeningHours(hoursData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="about-page">
      <Helmet>
        <title>Sobre Nosotros | Duke Burger San Juan</title>
        <meta name="description" content="Conocé la historia de Duke Burger en San Juan. Sabor brutal, espíritu local y las mejores hamburguesas artesanales preparadas con amor." />
        <link rel="canonical" href="https://dukeburger-sj.com/nosotros" />
      </Helmet>
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link to="/">
            <img src="/brand/duke burger 2 negativo.png" alt="Duke Burger Logo - Nosotros" className="nav-logo" />
          </Link>
          
          <div className="nav-actions">
            <div className="nav-links-desktop">
              <Link to="/">CARTA</Link>
              <Link to="/nosotros" style={{ color: 'var(--color-primary)' }}>NOSOTROS</Link>
            </div>
            <Link to="/" className="cta-button" style={{ textDecoration: 'none' }}>
              ¡PEDÍ YA!
            </Link>
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

      <div className="about-logo-wrapper">
        <img src="/brand/duke burger 1 negativo.png" alt="Emblema Duke Burger San Juan" className="duke-about-logo" />
      </div>

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
          {loading ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>Cargando imágenes...</p>
          ) : gallery.length > 0 ? (
            <div className="gallery-grid">
              {gallery.filter(img => img.is_active).map((img) => (
                <div key={img.id} className="gallery-item" onClick={() => setSelectedImage(img.image)}>
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

      {/* Visor de imágenes expandidas */}
      {selectedImage && (
        <div className="image-viewer-modal" onClick={() => setSelectedImage(null)}>
          <div className="viewer-close-btn">
            <X size={40} />
          </div>
          <div className="viewer-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Full View" className="viewer-img" />
          </div>
        </div>
      )}

      {/* Widget de Reseñas */}
      <section className="reviews-widget-section" style={{ padding: '60px 0', background: 'linear-gradient(to bottom, #0a0a0a, #111)' }}>
        <div className="container">
          <div className="review-card-modern" style={{ 
            background: '#1a1a1a', 
            borderRadius: '24px', 
            padding: '40px', 
            border: '1px solid #333',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ color: '#fcc419', fontSize: '1.5rem', marginBottom: '15px' }}>
              ⭐⭐⭐⭐⭐
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2.5rem', 
              color: '#fff', 
              margin: '0 0 10px 0',
              letterSpacing: '1px'
            }}>LO QUE DICEN NUESTROS CLIENTES</h2>
            <p style={{ color: '#aaa', fontSize: '1.1rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              La comunidad Duke sigue creciendo. Estas son algunas de las experiencias de quienes ya probaron nuestro sabor brutal.
            </p>

            {/* Testimonials Grid */}
            <div className="testimonials-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '25px', 
              marginBottom: '50px',
              textAlign: 'left'
            }}>
              {[
                { name: "Andrés G.", text: "Las mejores smash de San Juan por lejos. La Duke es obligatoria si venís por primera vez. Calidad 10/10.", stars: 5 },
                { name: "Lucía M.", text: "Excelente atención y ambiente. La Conde con aceite de trufa es una locura de sabor. Muy recomendado.", stars: 5 },
                { name: "Matias R.", text: "Sabor brutal. El sistema de pedidos por la web funciona impecable y el envío es súper puntual. Mi lugar de confianza.", stars: 5 }
              ].map((rev, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '25px', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'transform 0.3s ease'
                }}>
                  <div style={{ color: '#fcc419', marginBottom: '12px', fontSize: '1rem' }}>
                    {"⭐".repeat(rev.stars)}
                  </div>
                  <p style={{ color: '#ccc', fontSize: '1rem', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.6' }}>
                    "{rev.text}"
                  </p>
                  <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {rev.name}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid #333', paddingTop: '40px' }}>
              <h3 style={{ 
                color: '#fff', 
                marginBottom: '20px', 
                fontFamily: 'var(--font-heading)', 
                fontSize: '1.8rem',
                letterSpacing: '1px' 
              }}>¿VOS YA NOS PROBASTE?</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'center' }}>
                <a 
                  href="https://g.page/r/CTunx53CILhQEBI/review" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="main-button"
                  style={{ 
                    textDecoration: 'none', 
                    padding: '18px 45px', 
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '2px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 20px rgba(227, 24, 55, 0.3)'
                  }}
                >
                  DEJAR MI RESEÑA
                </a>
                
                <div style={{ 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '16px', 
                  display: 'inline-block',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                  border: '2px solid #eee'
                }}>
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://g.page/r/CTunx53CILhQEBI/review" 
                    alt="QR Reseñas Google" 
                    style={{ width: '110px', height: '110px', display: 'block' }} 
                  />
                </div>
              </div>
            </div>
          </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {openingHours.filter(h => h.is_open).length > 0 ? (
                    openingHours.filter(h => h.is_open).map(h => (
                      <p key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                        <span style={{ fontWeight: 'bold' }}>{h.day_name}:</span>
                        <span>{h.opening_time.slice(0,5)} a {h.closing_time.slice(0,5)} hs</span>
                      </p>
                    ))
                  ) : (
                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>CERRADO TEMPORALMENTE</p>
                  )}
                </div>
              </div>
              <div className="location-card">
                <h3>CONTACTO</h3>
                <p>WhatsApp: 264 5142897</p>
                <p>Instagram: @dukeburger.sj</p>
              </div>
            </div>
            <a 
              href="https://share.google/uhA0uIK9PmhIATMDr"
              target="_blank"
              rel="noopener noreferrer"
              className="map-container"
              style={{ display: 'block', position: 'relative', cursor: 'pointer' }}
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1700.772526305607!2d-68.578093!3d-31.51325!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x968141749f5fe31d%3A0xd2ddf9ed864190a0!2zTGFwcmlkYSB5IEpvc8OpIEF2ZWzDrW4gTg!5e0!3m2!1ses!2sar!4v1712570000000!5m2!1ses!2sar"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '12px', pointerEvents: 'none' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Duke Burger"
              ></iframe>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></div>
            </a>
          </div>
        </div>
      </section>

      <FloatingContact />
      <Footer />
    </div>
  );
}

export default About;
