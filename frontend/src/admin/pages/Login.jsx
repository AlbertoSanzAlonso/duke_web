import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import Toast from '../components/Toast';
import './Login.css';

import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            navigate('/admin');
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await requestPasswordReset(recoveryEmail);
            setToast({ message: res.message, type: 'success' });
            setIsRecovering(false);
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="login-card">
                <div className="login-brand">
                    <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="login-logo" />
                    <h2>ADMIN PANEL</h2>
                    <p>{isRecovering ? 'RECUPERAR ACCESO' : 'Ingresa tus credenciales para continuar'}</p>
                </div>

                {!isRecovering ? (
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Email o Usuario</label>
                            <input 
                                type="email" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="usuario@gmail.com"
                                required 
                            />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    required 
                                    style={{ paddingRight: '45px' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ 
                                        position: 'absolute', 
                                        right: '12px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'ACCEDIENDO...' : 'ENTRAR'}
                        </button>
                        
                        <button 
                            type="button" 
                            className="forgot-password-link"
                            onClick={() => setIsRecovering(true)}
                            style={{
                                background: 'none', border: 'none', color: '#666', marginTop: '15px',
                                cursor: 'pointer', fontSize: '0.9rem', display: 'block', width: '100%', textAlign: 'center'
                            }}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRecovery} className="login-form">
                        <div className="form-group">
                            <label>Introduce tu Email</label>
                            <input 
                                type="email" 
                                value={recoveryEmail} 
                                onChange={e => setRecoveryEmail(e.target.value)} 
                                placeholder="usuario@gmail.com"
                                required 
                            />
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsRecovering(false)}
                            style={{
                                background: 'none', border: 'none', color: '#666', marginTop: '15px',
                                cursor: 'pointer', fontSize: '0.9rem', display: 'block', width: '100%', textAlign: 'center'
                            }}
                        >
                            Volver al Login
                        </button>
                    </form>
                )}
            </div>
            
            <footer className="login-footer">
                <p>© 2025 DUKE BURGER. SAN JUAN, ARGENTINA.</p>
            </footer>
        </div>
    );
};

export default Login;
