import React, { useState, useEffect } from 'react';

export const ClockWidget: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-dots">
            <div className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">
                {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-5xl md:text-6xl font-display font-black tracking-tighter text-black dark:text-white tabular-nums">
                {time.toLocaleTimeString(undefined, { hour12: false })}
            </div>
        </div>
    );
};