import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPasswordConfirm } from '../../services/api';
import Toast from '../components/Toast';
import './Login.css';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setToast({ message: 'Las contraseñas no coinciden', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            await resetPasswordConfirm(uid, token, password);
            setToast({ message: 'Contraseña restablecida con éxito', type: 'success' });
            setTimeout(() => navigate('/login'), 2000);
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
                    <h2>NUEVA CONTRASEÑA</h2>
                    <p>Ingresa tu nueva clave de acceso</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Nueva Contraseña</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'RESTABLECIENDO...' : 'CAMBIAR CONTRASEÑA'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
