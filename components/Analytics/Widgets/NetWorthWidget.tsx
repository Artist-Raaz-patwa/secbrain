
import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { NoirLineChart } from '../../ui/NoirCharts';

export const NetWorthWidget: React.FC = () => {
    const { accounts, transactions } = useAppStore();

    const data = useMemo(() => {
        const activeAccounts = accounts.filter(a => !a.excludeFromTotals);
        let currentBalance = activeAccounts.reduce((acc, curr) => acc + curr.balance, 0);
        
        const activeAccIds = new Set(activeAccounts.map(a => a.id));
        const relevantTrans = transactions
            .filter(t => activeAccIds.has(t.accountId))
            .sort((a,b) => b.date - a.date);
        
        const points = [{ label: 'Now', value: currentBalance }];
        let runner = currentBalance;
        
        relevantTrans.slice(0, 10).forEach(t => {
            if (t.type === 'income') runner -= t.amount;
            else runner += t.amount;
            points.push({ 
                label: new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}), 
                value: runner 
            });
        });
        
        return points.reverse();
    }, [accounts, transactions]);

    return <NoirLineChart data={data} height={200} />;
};
