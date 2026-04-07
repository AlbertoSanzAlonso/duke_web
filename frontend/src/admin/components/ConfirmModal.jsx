import React from 'react';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                textAlign: 'center',
                animation: 'scaleUp 0.2s ease-out'
            }}>
                <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '15px',
                    color: '#e03131'
                }}>⚠️</div>
                <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '1.5rem', 
                    color: '#222',
                    fontFamily: 'Bebas Neue, sans-serif'
                }}>{title}</h3>
                <p style={{ 
                    color: '#666', 
                    marginBottom: '25px',
                    lineHeight: '1.5'
                }}>{message}</p>
                <div style={{ 
                    display: 'flex', 
                    gap: '12px' 
                }}>
                    <button 
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '1px solid #ddd',
                            background: 'white',
                            color: '#666',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            background: '#e03131',
                            color: 'white',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
}

export default ConfirmModal;
