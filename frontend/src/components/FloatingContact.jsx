import React, { useState } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';

const FloatingContact = () => {
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const contactPhone = "5492645095054";

  return (
    <>
      <button className="contact-fab" onClick={() => setIsContactMenuOpen(true)}>
        <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Phone size={22} style={{ color: 'white' }} />
          <div style={{ 
            position: 'absolute', 
            bottom: '-2px', 
            right: '-2px', 
            background: '#25D366', 
            borderRadius: '50%', 
            padding: '2px',
            border: '2px solid #111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle size={12} style={{ color: 'white' }} fill="white" />
          </div>
        </div>
      </button>

      {isContactMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsContactMenuOpen(false)} style={{ zIndex: 5000 }}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>CONTACTO DUKE</h2>
              <button className="close-modal" onClick={() => setIsContactMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                className="contact-option-btn whatsapp" 
                onClick={() => {
                  window.open(`https://wa.me/${contactPhone}`, '_blank');
                  setIsContactMenuOpen(false);
                }}
              >
                <MessageCircle size={24} />
                WHATSAPP
              </button>
              <button 
                className="contact-option-btn call" 
                onClick={() => {
                  window.location.href = `tel:+${contactPhone}`;
                  setIsContactMenuOpen(false);
                }}
              >
                <Phone size={24} />
                LLAMAR AHORA
              </button>
              <p style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem', marginTop: '10px' }}>
                Atención directa Duke Burger San Juan
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingContact;
