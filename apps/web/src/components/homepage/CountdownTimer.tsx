'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    endDate: Date | string;
    variant?: 'default' | 'compact' | 'urgent';
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export default function CountdownTimer({ endDate, variant = 'default' }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
    });

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
            const now = new Date();
            const total = end.getTime() - now.getTime();

            if (total <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
                return;
            }

            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            setTimeRemaining({ days, hours, minutes, seconds, total });
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [endDate]);

    if (timeRemaining.total <= 0) {
        return (
            <div className="text-gray-400 text-sm font-medium">{variant === 'urgent' ? 'ENDED' : 'Event Ended'}</div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-1 text-sm">
                <span className="text-white font-medium">
                    {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
            </div>
        );
    }

    if (variant === 'urgent') {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-mono text-lg">
                    <span className="text-[#00ff41] font-bold">{String(timeRemaining.hours).padStart(2, '0')}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#00ff41] font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#00ff41] font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {timeRemaining.days > 0 && (
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">{timeRemaining.days}</span>
                    <span className="text-xs text-gray-400 uppercase">Days</span>
                </div>
            )}
            <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{String(timeRemaining.hours).padStart(2, '0')}</span>
                <span className="text-xs text-gray-400 uppercase">Hours</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                <span className="text-xs text-gray-400 uppercase">Min</span>
            </div>
            {variant === 'default' && (
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-gray-400 uppercase">Sec</span>
                </div>
            )}
        </div>
    );
}
