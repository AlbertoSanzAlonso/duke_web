import React from 'react';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/brand/duke burger 1 negativo.png" alt="Duke Logo" className="footer-logo" />
            <p>© 2025 DUKE BURGER. SAN JUAN, ARGENTINA.</p>
          </div>
          <div className="footer-links">
            <h3>SOCIAL</h3>
            <div className="social-icons-footer">
              <a href="https://www.instagram.com/dukeburger.sj" target="_blank" rel="noopener noreferrer">
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/people/Duke-Burger/61586470112663/" target="_blank" rel="noopener noreferrer">
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/5492645095054" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={24} />
              </a>
            </div>
          </div>
          <div className="footer-info">
            <h3>UBICACIÓN</h3>
            <p>Rivadavia, San Juan, Argentina</p>
            <p>Laprida y José Avelín N</p>
            <a 
              href="https://share.google/uhA0uIK9PmhIATMDr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-map-link"
              style={{ marginBottom: '10px', display: 'block' }}
            >
              VER EN MAPA ↗
            </a>
            <a 
              href="https://g.page/r/CTunx53CILhQEBI/review" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-map-link"
              style={{ color: '#f03e3e', borderColor: '#f03e3e' }}
            >
              ⭐ DEJAR RESEÑA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
