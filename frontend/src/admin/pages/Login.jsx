import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import Toast from '../components/Toast';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

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

    return (
        <div className="login-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="login-card">
                <div className="login-brand">
                    <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="login-logo" />
                    <h2>ADMIN PANEL</h2>
                    <p>Ingresa tus credenciales para continuar</p>
                </div>

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
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'ACCEDIENDO...' : 'ENTRAR'}
                    </button>
                </form>
            </div>
            
            <footer className="login-footer">
                <p>© 2025 DUKE BURGER. SAN JUAN, ARGENTINA.</p>
            </footer>
        </div>
    );
};

export default Login;
