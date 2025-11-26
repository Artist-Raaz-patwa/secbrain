import React from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const WalletWidget: React.FC = () => {
    const { accounts, settings, transactions } = useAppStore();
    
    const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    // Simple Sparkline Data (Last 7 transactions affect on balance)
    // We assume current balance is latest, work backwards for visual trend
    const recentTrans = [...transactions].sort((a,b) => b.date - a.date).slice(0, 10);

    return (
        <div className="p-6 h-full flex flex-col justify-between relative overflow-hidden">
            <div>
                <div className="font-mono text-xs text-gray-500 uppercase mb-1">Total Assets</div>
                <div className="text-3xl font-display font-black text-black dark:text-white truncate">
                    {settings.baseCurrency}{netWorth.toLocaleString()}
                </div>
            </div>

            <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1 text-[10px] font-mono text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <TrendingUp size={12} /> INFLOW
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    <TrendingDown size={12} /> OUTFLOW
                </div>
            </div>

            {/* Decorative Sparkline (Abstract) */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10 pointer-events-none flex items-end justify-between px-1">
                 {Array.from({length: 10}).map((_,i) => (
                     <div key={i} className="w-1 bg-black dark:bg-white" style={{ height: `${Math.random() * 100}%`}}></div>
                 ))}
            </div>
        </div>
    );
};