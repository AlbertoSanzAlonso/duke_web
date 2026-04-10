import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const DigitalClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="current-time">
            <Clock size={16} style={{ marginRight: '8px' }} />
            <span style={{ textTransform: 'capitalize' }}>
                {currentTime.toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    timeZone: 'America/Argentina/Buenos_Aires'
                })}
                {' - '}
                {currentTime.toLocaleTimeString('es-AR', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    timeZone: 'America/Argentina/Buenos_Aires'
                })}
            </span>
        </div>
    );
};

export default React.memo(DigitalClock);
