
import React from 'react';
import { NoirButton } from '../ui/NoirButton';
import { X, TrendingUp, PieChart, BarChart, CheckSquare, Activity, Target } from 'lucide-react';
import { AnalyticsWidgetType } from '../../types';

interface Props {
    onClose: () => void;
    onAdd: (type: AnalyticsWidgetType) => void;
}

export const AddAnalyticsWidgetModal: React.FC<Props> = ({ onClose, onAdd }) => {
    const widgets: { type: AnalyticsWidgetType, label: string, icon: any }[] = [
        { type: 'net_worth', label: 'Financial Trajectory', icon: TrendingUp },
        { type: 'expense_pie', label: 'Spending Breakdown', icon: PieChart },
        { type: 'revenue_bar', label: 'Agency Revenue', icon: BarChart },
        { type: 'task_pie', label: 'Directive Completion', icon: CheckSquare },
        { type: 'habit_trend', label: 'Consistency Score', icon: Activity },
        { type: 'goal_progress', label: 'Mission Progress', icon: Target },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white">
                <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold uppercase">ADD_DATA_MODULE</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    {widgets.map(w => (
                        <button 
                            key={w.type}
                            onClick={() => onAdd(w.type)}
                            className="p-4 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex flex-col items-center gap-2 group"
                        >
                            <w.icon size={24} className="opacity-50 group-hover:opacity-100" />
                            <span className="font-mono text-xs font-bold uppercase text-center">{w.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
