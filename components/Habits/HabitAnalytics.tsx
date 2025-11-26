import React from 'react';
import { Habit, HabitLog } from '../../types';

interface HabitAnalyticsProps {
  habits: Habit[];
  logs: Record<string, boolean>; // 'habitId_date' -> bool
  view: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const HabitAnalytics: React.FC<HabitAnalyticsProps> = ({ habits, logs, view }) => {
  // Helper to calculate score (0-100) for a given date
  const getScoreForDate = (dateStr: string) => {
    if (habits.length === 0) return 0;
    let completedCount = 0;
    habits.forEach(h => {
      const key = `${h.id}_${dateStr}`;
      if (logs[key]) completedCount++;
    });
    return (completedCount / habits.length) * 100;
  };

  // Generate data points based on view
  const generateData = () => {
    const dataPoints: { label: string; value: number }[] = [];
    const today = new Date();
    
    // Logic for different timeframes
    // For simplicity in this robust MVP, we'll implement the "Last X" logic which maps well to graphs
    let daysToLookBack = 7;
    let labelFormat: 'day' | 'month' = 'day';

    if (view === 'daily' || view === 'weekly') daysToLookBack = 7;
    if (view === 'monthly') daysToLookBack = 30;
    if (view === 'yearly') {
        daysToLookBack = 12; // Actually months
        labelFormat = 'month';
    }

    if (view === 'yearly') {
        // Last 12 months logic
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short' }).toUpperCase();
            
            // Average for that month
            let totalScore = 0;
            const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            for(let day = 1; day <= daysInMonth; day++) {
                const dateString = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                totalScore += getScoreForDate(dateString);
            }
            dataPoints.push({ label: monthLabel, value: totalScore / daysInMonth });
        }
    } else {
        // Daily/Weekly/Monthly logic (Last N days)
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            // Format label: "MON", "24", etc.
            const label = view === 'monthly' ? String(d.getDate()) : d.toLocaleString('default', { weekday: 'short' }).toUpperCase();
            dataPoints.push({ label, value: getScoreForDate(dateStr) });
        }
    }
    return dataPoints;
  };

  const data = generateData();
  const width = 800;
  const height = 200;
  const padding = 20;

  // Chart scaling
  const maxVal = 100;
  const xStep = (width - padding * 2) / (data.length - 1);
  const yScale = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

  // Generate Path
  const pathData = data.map((pt, i) => {
    const x = padding + i * xStep;
    const y = yScale(pt.value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 shadow-hard dark:shadow-hard-white">
      <div className="flex justify-between items-end mb-6">
         <div>
            <h3 className="font-display font-black text-xl uppercase tracking-tighter">Performance_Analytics</h3>
            <p className="font-mono text-xs text-gray-500">View: {view.toUpperCase()}</p>
         </div>
         <div className="font-mono text-4xl font-bold tracking-tighter">
            {Math.round(data[data.length-1]?.value || 0)}%
         </div>
      </div>

      <div className="w-full overflow-hidden relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Grid Lines */}
            <line x1={padding} y1={yScale(0)} x2={width-padding} y2={yScale(0)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1={padding} y1={yScale(50)} x2={width-padding} y2={yScale(50)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1={padding} y1={yScale(100)} x2={width-padding} y2={yScale(100)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />

            {/* The Data Line */}
            <path 
                d={pathData} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-black dark:text-white"
            />
            
            {/* Dots */}
            {data.map((pt, i) => (
                <circle 
                    key={i} 
                    cx={padding + i * xStep} 
                    cy={yScale(pt.value)} 
                    r="3" 
                    className="fill-black dark:fill-white"
                />
            ))}

            {/* Labels */}
            {data.map((pt, i) => (
                <text 
                    key={i} 
                    x={padding + i * xStep} 
                    y={height} 
                    textAnchor="middle" 
                    className="text-[10px] font-mono fill-gray-500"
                >
                    {pt.label}
                </text>
            ))}
          </svg>
      </div>
    </div>
  );
};