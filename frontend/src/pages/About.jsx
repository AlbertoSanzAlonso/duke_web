import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { X, Menu, Bot } from 'lucide-react';
import { fetchGalleryImages, fetchOpeningHours } from '../services/api';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';

function About() {
  const [gallery, setGallery] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  // The Place ID for Duke Burger in San Juan
  const PLACE_ID = "ChIJ-Xl47NdgZURmYI702tTAdR"; 

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

    const fetchReviews = () => {
      try {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({
          placeId: PLACE_ID,
          fields: ['reviews', 'rating']
        }, (pool, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && pool.reviews && pool.reviews.length > 0) {
            setReviews(pool.reviews.sort((a, b) => b.time - a.time).slice(0, 3));
          } else {
            // Fallback professional si no hay reseñas reales aun
            setReviews([]);
          }
          setLoadingReviews(false);
        });
      } catch (e) {
        setLoadingReviews(false);
      }
    };

    const loadGoogleReviews = () => {
      if (!window.google) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = fetchReviews;
        document.head.appendChild(script);
      } else {
        fetchReviews();
      }
    };

    loadData();
    loadGoogleReviews();
  }, []);

  return (
    <div className="about-page">
      <Helmet>
        <title>Sobre Nosotros | Duke Burger San Juan</title>
        <meta name="description" content="Conocé Duke Burger. Hamburguesería artesanal en San Juan dedicada a la elaboración de hamburguesas, lomos y pachatas de calidad superior." />
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
          <h1>DUKE BURGER - SOBRE NOSOTROS</h1>
          <p>HAMBURGUESERÍA ARTESANAL EN RIVADAVIA, SAN JUAN.</p>
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
              Nuestro perfil de Google es nuevo, pero nuestro sabor ya es leyenda. Muy pronto verás aquí las reseñas reales de nuestra comunidad brutal.
            </p>

          <div className="testimonials-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '30px', 
            marginBottom: '60px',
            textAlign: 'left'
          }}>
            {loadingReviews ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  height: '220px', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  animation: 'pulse 1.5s infinite outline' 
                }}></div>
              ))
            ) : reviews.length > 0 ? (
              reviews.map((rev, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '30px', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ color: '#fcc419', marginBottom: '15px', fontSize: '1.1rem' }}>
                      {"⭐".repeat(rev.rating)}
                    </div>
                    <p style={{ color: '#eee', fontSize: '1.05rem', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.6' }}>
                      "{rev.text.length > 220 ? rev.text.substring(0, 220) + '...' : rev.text}"
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    {rev.profile_photo_url && (
                      <img 
                        src={rev.profile_photo_url} 
                        alt={rev.author_name} 
                        style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--color-primary)' }} 
                      />
                    )}
                    <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {rev.author_name}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '24px',
                border: '1px dashed #444'
              }}>
                <Bot size={40} color="var(--color-primary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                <p style={{ color: '#888', fontSize: '1.1rem' }}>Nuestro perfil de Google es nuevo. ¡Sé el primero en dejarnos tu opinión!</p>
              </div>
            )}
          </div>
          
          <div style={{ borderTop: '1px solid #333', paddingTop: '50px' }}>
            <h3 style={{ 
              color: '#fff', 
              marginBottom: '30px', 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2rem',
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
                  padding: '20px 55px', 
                  fontSize: '1.6rem',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '2px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(227, 24, 55, 0.4)'
                }}
              >
                DEJAR MI RESEÑA
              </a>
              
              <div style={{ 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '20px', 
                display: 'inline-block',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                border: '3px solid #eee'
              }}>
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://g.page/r/CTunx53CILhQEBI/review" 
                  alt="QR Reseñas Google" 
                  style={{ width: '130px', height: '130px', display: 'block' }} 
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
              href="https://maps.app.goo.gl/pJXJKJYsuQVzLEjYA"
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
