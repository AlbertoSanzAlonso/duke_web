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
            <p>Laprida y José Avelín N</p>
            <p>San Juan, Argentina</p>
            <a 
              href="https://www.google.com/maps/place/Laprida+y+Jos%C3%A9+Avel%C3%ADn+N/@-31.51325,-68.578093,17z/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-map-link"
            >
              VER EN MAPA ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
