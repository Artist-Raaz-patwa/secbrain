import React from 'react';
import { NoirButton } from '../ui/NoirButton';
import { X, Clock, Grid, CheckSquare, FileText, Activity, CreditCard, Target } from 'lucide-react';
import { WidgetType } from '../../types';

interface Props {
    onClose: () => void;
    onAdd: (type: WidgetType) => void;
}

export const AddWidgetModal: React.FC<Props> = ({ onClose, onAdd }) => {
    const widgets: { type: WidgetType, label: string, icon: any }[] = [
        { type: 'clock', label: 'Digital Clock', icon: Clock },
        { type: 'modules', label: 'App Launcher', icon: Grid },
        { type: 'tasks_list', label: 'Active Tasks', icon: CheckSquare },
        { type: 'goals_list', label: 'Mission List', icon: Target }, // Added Goals
        { type: 'habit_today', label: 'Habit Checklist', icon: Activity },
        { type: 'wallet_summary', label: 'Net Worth', icon: CreditCard },
        { type: 'quick_note', label: 'Quick Capture', icon: FileText },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white">
                <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold uppercase">ADD_WIDGET</h3>
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
                            <span className="font-mono text-xs font-bold uppercase">{w.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};