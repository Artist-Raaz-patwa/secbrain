
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirBarChart } from '../../ui/NoirCharts';

export const GoalProgressWidget: React.FC = () => {
    const { goals } = useAppStore();

    const data = useMemo(() => {
        return goals
            .filter(g => g.status === 'active')
            .map(g => {
                let progress = 0;
                if (g.targetAmount && g.targetAmount > 0) {
                    progress = Math.min(100, ((g.currentAmount || 0) / g.targetAmount) * 100);
                }
                return { label: g.title.substring(0, 10), value: progress };
            })
            .slice(0, 6);
    }, [goals]);

    return <NoirBarChart data={data} height={200} />;
};
