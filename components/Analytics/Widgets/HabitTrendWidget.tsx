
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirLineChart } from '../../ui/NoirCharts';

export const HabitTrendWidget: React.FC = () => {
    const { habits, habitLogs } = useAppStore();

    const data = useMemo(() => {
        const points = [];
        const today = new Date();
        
        // Last 14 days
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString(undefined, { weekday: 'short' });
            
            // Calculate daily score
            let completed = 0;
            if (habits.length > 0) {
                habits.forEach(h => {
                    if (habitLogs[`${h.id}_${dateStr}`]) completed++;
                });
                const score = (completed / habits.length) * 100;
                points.push({ label, value: score });
            } else {
                points.push({ label, value: 0 });
            }
        }
        return points;
    }, [habits, habitLogs]);

    return <NoirLineChart data={data} height={200} />;
};
