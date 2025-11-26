
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirBarChart } from '../../ui/NoirCharts';

export const RevenueBarWidget: React.FC = () => {
    const { projectTasks } = useAppStore();

    const data = useMemo(() => {
        const billedTasks = projectTasks.filter(t => t.billed || t.completed); 
        const monthMap: Record<string, number> = {};
        
        billedTasks.forEach(t => {
            const date = new Date(t.createdAt);
            const key = date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
            monthMap[key] = (monthMap[key] || 0) + (t.hours * t.rate);
        });

        return Object.entries(monthMap)
            .map(([label, value]) => ({ label, value }))
            .reverse()
            .slice(0, 6)
            .reverse();
    }, [projectTasks]);

    return <NoirBarChart data={data} height={200} />;
};
