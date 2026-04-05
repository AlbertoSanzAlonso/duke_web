import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const styles = {
        container: {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            padding: '15px 25px',
            borderRadius: '12px',
            background: type === 'success' ? '#2fb344' : '#d63939',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10000,
            animation: 'slideIn 0.3s ease-out',
            fontWeight: '600'
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.2rem',
            marginLeft: '10px'
        }
    };

    return (
        <div style={styles.container}>
            <span>{type === 'success' ? '✅' : '❌'}</span>
            <span>{message}</span>
            <button style={styles.closeBtn} onClick={onClose}>×</button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Toast;
