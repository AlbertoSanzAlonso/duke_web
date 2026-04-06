import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Calendar, Clock, ChevronLeft, Download, Printer } from 'lucide-react';
import LoadingScreen from '../admin/components/LoadingScreen';

const PublicTicket = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // We use the same API endpoint, but it's public in this case
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales/${id}/`);
                if (!response.ok) throw new Error('Ticket no encontrado');
                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <LoadingScreen />;
    if (error) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', padding: '20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', color: '#f03e3e' }}>404</h1>
            <p>Lo sentimos, no encontramos el ticket solicitado.</p>
            <Link to="/" style={{ color: '#fff', marginTop: '20px', textDecoration: 'underline' }}>Ir a la Web principal</Link>
        </div>
    );

    const formattedDate = new Date(order.date).toLocaleDateString('es-AR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
    const formattedTime = new Date(order.date).toLocaleTimeString('es-AR', { 
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
    });

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header / Logo */}
            <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img src="/brand/duke burger 1 negativo.png" alt="Duke Burger" style={{ height: '80px', marginBottom: '10px' }} />
                <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '2px', color: '#f03e3e' }}>TICKET DE PEDIDO</h1>
            </header>

            <main style={{ maxWidth: '500px', margin: '0 auto', background: '#1a1a1a', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
                {/* ID and Status */}
                <div style={{ padding: '25px', borderBottom: '1px dashed #444', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>Comprobante Oficial</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>#{order.id}</div>
                    <div style={{ 
                        marginTop: '10px', 
                        display: 'inline-block', 
                        padding: '5px 15px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        background: order.status === 'COMPLETED' ? '#2b8a3e' : '#e67700',
                        color: '#fff'
                    }}>
                        {order.status === 'COMPLETED' ? 'CONFIRMADO' : 'PENDIENTE DE COBRO'}
                    </div>
                </div>

                {/* Details */}
                <div style={{ padding: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Cliente</div>
                            <div style={{ fontWeight: '600' }}>{order.customer_name || 'Particular'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Fecha y Hora</div>
                            <div style={{ fontWeight: '600' }}>{formattedDate} - {formattedTime}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>Productos</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {order.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ color: '#f03e3e', fontWeight: 'bold', marginRight: '10px' }}>{item.quantity}x</span>
                                        <span>{item.entry_name}</span>
                                    </div>
                                    <div style={{ fontWeight: '600' }}>${(item.quantity * parseFloat(item.price_at_sale)).toLocaleString('es-AR')}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {parseFloat(order.delivery_cost) > 0 && (
                        <div style={{ padding: '15px 0', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#adb5bd' }}>
                                <MapPin size={16} /> Envío a Domicilio
                            </div>
                            <div style={{ fontWeight: '600' }}>+ ${parseFloat(order.delivery_cost).toLocaleString('es-AR')}</div>
                        </div>
                    )}

                    <div style={{ 
                        marginTop: '20px', 
                        padding: '20px', 
                        background: 'rgba(240, 62, 62, 0.1)', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        border: '1px solid rgba(240, 62, 62, 0.3)'
                    }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f03e3e' }}>TOTAL</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff' }}>
                            ${parseFloat(order.total_amount).toLocaleString('es-AR')}
                        </div>
                    </div>

                    {order.table_number && (
                        <div style={{ 
                            marginTop: '25px', 
                            padding: '20px', 
                            background: '#000', 
                            borderRadius: '12px', 
                            border: '1px solid #333'
                        }}>
                            <div style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '800' }}>
                                {order.table_number.includes('DELIVERY') ? '📍 Dirección de Envío' : '🏪 Tipo de Entrega'}
                            </div>
                            <div style={{ fontSize: '1rem', marginBottom: order.table_number.includes('DELIVERY') ? '15px' : '0' }}>
                                {order.table_number.replace('DELIVERY: ', '')}
                            </div>
                            
                            {order.table_number.includes('DELIVERY') && (
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.table_number.replace('DELIVERY: ', '') + ", San Juan, Argentina")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        background: '#333',
                                        color: '#fff',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        transition: 'background 0.3s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#444'}
                                    onMouseOut={e => e.currentTarget.style.background = '#333'}
                                >
                                    <MapPin size={18} color="#f03e3e" /> ABRIR EN GOOGLE MAPS
                                </a>
                            )}
                        </div>
                    )}

                    {order.notes && (
                        <div style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '0.85rem', color: '#888' }}>
                            "{order.notes}"
                        </div>
                    )}

                    <div className="no-print" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            onClick={() => window.print()}
                            style={{
                                width: '100%', 
                                padding: '15px', 
                                background: 'white', 
                                color: 'black', 
                                border: 'none', 
                                borderRadius: '10px', 
                                fontWeight: 'bold', 
                                fontSize: '1rem',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '10px', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
                            }}
                        >
                            <Download size={20} /> DESCARGAR TICKET (PDF)
                        </button>
                    </div>
                </div>
            </main>

            <footer style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '30px', color: '#444', fontSize: '0.8rem' }}>
                <p>&copy; {new Date().getFullYear()} Duke Burger San Juan - Pedidos Oficiales</p>
                <div style={{ marginTop: '10px' }}>Este es un comprobante digital verificado por el sistema.</div>
            </footer>
        </div>
    );
};

export default PublicTicket;
