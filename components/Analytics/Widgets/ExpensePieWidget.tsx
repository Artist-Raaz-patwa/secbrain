
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirPieChart } from '../../ui/NoirCharts';

export const ExpensePieWidget: React.FC = () => {
    const { transactions } = useAppStore();

    const data = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryMap: Record<string, number> = {};
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
        });
        return Object.entries(categoryMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 6); // Top 6 categories
    }, [transactions]);

    return <NoirPieChart data={data} height={200} />;
};
