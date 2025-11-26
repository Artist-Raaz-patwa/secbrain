
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirPieChart } from '../../ui/NoirCharts';

export const TaskPieWidget: React.FC = () => {
    const { tasks } = useAppStore();

    const data = useMemo(() => {
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        return [
            { label: 'Completed', value: completed },
            { label: 'Pending', value: pending }
        ];
    }, [tasks]);

    return <NoirPieChart data={data} height={200} />;
};
