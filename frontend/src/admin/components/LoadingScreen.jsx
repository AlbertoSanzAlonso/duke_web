import React from 'react';

const LoadingScreen = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: '#eee',
            zIndex: 10000,
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, var(--admin-primary), transparent)',
                animation: 'loading-bar 1.5s infinite linear'
            }}></div>
            <style>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .admin-content input::placeholder, 
                .admin-content textarea::placeholder {
                    color: #495057 !important;
                    font-weight: 600 !important;
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
