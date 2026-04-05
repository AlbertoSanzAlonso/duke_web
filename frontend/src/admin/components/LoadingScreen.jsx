import React from 'react';

const LoadingScreen = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <img 
                src="/brand/duke burger 3 positivo.png" 
                alt="Loading..." 
                style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    animation: 'spin 2s linear infinite'
                }} 
            />
            <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#333' }}>Cargando Duke Burgers...</p>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
