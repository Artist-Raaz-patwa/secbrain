
import React, { useMemo, useState } from 'react';
import { Transaction } from '../../types';
import { NoirLineChart } from '../ui/NoirCharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currentBalance: number;
}

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | 'ALL';

export const WalletAnalytics: React.FC<Props> = ({ transactions, currentBalance }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');

  const { chartData, percentChange } = useMemo(() => {
      if (transactions.length === 0) return { chartData: [{ label: 'Now', value: currentBalance }], percentChange: 0 };

      // 1. Calculate Cutoff Date
      const now = new Date();
      let cutoff = new Date();
      
      switch (timeRange) {
          case '1M': cutoff.setMonth(now.getMonth() - 1); break;
          case '3M': cutoff.setMonth(now.getMonth() - 3); break;
          case '6M': cutoff.setMonth(now.getMonth() - 6); break;
          case 'YTD': cutoff = new Date(now.getFullYear(), 0, 1); break;
          case 'ALL': cutoff = new Date(0); break;
      }

      const cutoffTime = cutoff.getTime();

      // 2. Build Full Historical Timeline (Backwards from Current Balance)
      const allSorted = [...transactions].sort((a,b) => b.date - a.date); // Newest first
      const points = [{ label: 'Now', value: currentBalance, date: now.getTime() }];
      
      let runner = currentBalance;
      
      allSorted.forEach(t => {
          if (t.type === 'income') runner -= t.amount;
          else runner += t.amount;
          
          points.push({
              label: new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
              value: runner,
              date: t.date
          });
      });

      // 3. Filter for View and Reverse (Oldest First)
      const filteredPoints = points.filter(p => p.date >= cutoffTime).reverse();
      
      if (filteredPoints.length < 2) {
           return { chartData: points.slice(0, 10).reverse(), percentChange: 0 };
      }

      // 4. Calculate Percentage Change
      const startVal = filteredPoints[0].value;
      const endVal = filteredPoints[filteredPoints.length - 1].value;
      let pct = 0;
      if (startVal !== 0) {
          pct = ((endVal - startVal) / startVal) * 100;
      }

      return { chartData: filteredPoints, percentChange: pct };
  }, [transactions, currentBalance, timeRange]);

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="font-display font-black text-xl uppercase">Net_Worth_Trend</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`font-mono text-2xl font-bold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                    </span>
                    {percentChange > 0 && <TrendingUp className="text-green-600" size={20} />}
                    {percentChange < 0 && <TrendingDown className="text-red-600" size={20} />}
                    {percentChange === 0 && <Minus className="text-gray-400" size={20} />}
                </div>
            </div>
            
            <div className="flex border-2 border-black dark:border-white bg-gray-100 dark:bg-neutral-800">
                {(['1M', '3M', '6M', 'YTD', 'ALL'] as TimeRange[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1 font-mono text-[10px] font-bold transition-colors
                            ${timeRange === r 
                                ? 'bg-black text-white dark:bg-white dark:text-black' 
                                : 'text-gray-500 hover:text-black dark:hover:text-white'}
                        `}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex-grow min-h-[250px]">
            <NoirLineChart data={chartData} height={250} showDataLabels={true} />
        </div>
    </div>
  );
};
