import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchMe, logout } from '../../services/api';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

const UserDropdown = () => {
    const [me, setMe] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadMe();
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadMe = async () => {
        try {
            const data = await fetchMe();
            setMe(data);
        } catch (error) {
            console.error("Error loading profile:", error);
            // Fallback for UI visibility during error
            setMe({ username: 'Admin', profile: {} });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const avatarUrl = me?.profile?.avatar;
    const displayName = me?.first_name ? `${me.first_name} ${me.last_name || ''}` : (me?.username || 'Admin');

    return (
        <div className="user-dropdown-container" ref={dropdownRef} style={{ zIndex: 9999 }}>
            <button className="user-profile-btn" onClick={() => setIsOpen(!isOpen)}>
                <div className="avatar-wrapper">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="User" className="user-avatar-img" />
                    ) : (
                        <div className="avatar-placeholder"><User size={20} /></div>
                    )}
                </div>
                <div className="user-info-text">
                    <span className="user-name">{displayName}</span>
                    <span className="user-role">Administrador</span>
                </div>
                <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div className="dropdown-menu">
                    <div className="dropdown-header">
                        <p className="email">{me.email}</p>
                    </div>
                    <Link to="/admin/perfil" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <User size={18} />
                        <span>Mi Perfil</span>
                    </Link>
                    <Link to="/admin/config" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <Settings size={18} />
                        <span>Configuración Global</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .user-dropdown-container {
                    position: relative;
                }
                .user-profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #fff;
                    border: 1px solid #eee;
                    padding: 6px 12px;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .user-profile-btn:hover {
                    border-color: #f03e3e;
                    background: #fff5f5;
                }
                .avatar-wrapper {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #fff;
                }
                .user-avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    color: #adb5bd;
                }
                .user-info-text {
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                }
                .user-name {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #333;
                    line-height: 1.2;
                }
                .user-role {
                    font-size: 0.75rem;
                    color: #888;
                }
                .chevron {
                    color: #adb5bd;
                    transition: transform 0.2s ease;
                }
                .chevron.rotate {
                    transform: rotate(180deg);
                }
                
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 220px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    border: 1px solid #eee;
                    padding: 8px;
                    z-index: 1000;
                    animation: slideDown 0.2s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dropdown-header {
                    padding: 12px;
                    border-bottom: 1px solid #f8f9fa;
                    margin-bottom: 4px;
                }
                .dropdown-header .email {
                    font-size: 0.8rem;
                    color: #888;
                    word-break: break-all;
                }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    color: #444;
                    text-decoration: none;
                    font-size: 0.9rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    width: 100%;
                    border: none;
                    background: none;
                    cursor: pointer;
                }
                .dropdown-item:hover {
                    background: #f8f9fa;
                    color: #f03e3e;
                }
                .dropdown-item.logout {
                    color: #fa5252;
                }
                .dropdown-item.logout:hover {
                    background: #fff5f5;
                }
                .dropdown-divider {
                    height: 1px;
                    background: #f8f9fa;
                    margin: 8px 0;
                }
                
                @media (max-width: 768px) {
                    .user-info-text {
                        display: none;
                    }
                }
            `}} />
        </div>
    );
};

export default UserDropdown;
