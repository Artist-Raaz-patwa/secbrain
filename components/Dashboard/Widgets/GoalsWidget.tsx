import React from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Target } from 'lucide-react';

export const GoalsWidget: React.FC = () => {
    const { goals } = useAppStore();
    // Top 3 closest deadlines
    const activeGoals = goals
        .filter(g => g.status === 'active')
        .sort((a,b) => a.targetDate - b.targetDate)
        .slice(0, 3);

    return (
        <div className="p-4 h-full flex flex-col">
            {activeGoals.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 text-xs font-mono">
                    <Target size={24} className="mb-2 opacity-20"/>
                    NO MISSIONS SET
                </div>
            ) : (
                <div className="space-y-3">
                    {activeGoals.map(g => {
                        const daysLeft = Math.ceil((g.targetDate - Date.now()) / (1000 * 60 * 60 * 24));
                        return (
                            <div key={g.id} className="border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2 last:border-0">
                                <div className="flex justify-between font-mono text-xs font-bold text-black dark:text-white">
                                    <span className="truncate pr-2">{g.title}</span>
                                    <span className={daysLeft < 0 ? 'text-red-500' : 'text-gray-500'}>{daysLeft}d</span>
                                </div>
                                {/* Mini Bar */}
                                <div className="h-1 w-full bg-gray-100 dark:bg-neutral-800 mt-1">
                                    <div 
                                        className="h-full bg-black dark:bg-white" 
                                        style={{ width: g.targetAmount ? `${Math.min(100, ((g.currentAmount||0)/g.targetAmount)*100)}%` : '0%'}}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};