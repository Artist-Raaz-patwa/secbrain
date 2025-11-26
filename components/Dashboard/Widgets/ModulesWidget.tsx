import React from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { ViewState } from '../../../types';
import { Book, CheckSquare, Briefcase, Wallet, Activity, MessageSquare, Settings, Target, BarChart2 } from 'lucide-react';

export const ModulesWidget: React.FC = () => {
    const { setView } = useAppStore();

    const modules = [
        { id: 'notebooks', icon: Book, label: 'NOTES' },
        { id: 'tasks', icon: CheckSquare, label: 'TASKS' },
        { id: 'goals', icon: Target, label: 'GOALS' },
        { id: 'analytics', icon: BarChart2, label: 'DATA' }, // Added Analytics
        { id: 'crm', icon: Briefcase, label: 'CRM' },
        { id: 'wallet', icon: Wallet, label: 'WALLET' },
        { id: 'habits', icon: Activity, label: 'HABITS' },
        { id: 'chat', icon: MessageSquare, label: 'CHAT' },
    ];

    return (
        <div className="p-4 grid grid-cols-4 gap-2 h-full content-center">
            {modules.map(m => (
                <button 
                    key={m.id}
                    onClick={() => setView(m.id as ViewState)}
                    className="flex flex-col items-center gap-1 group py-1"
                >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent group-hover:border-black dark:group-hover:border-white flex items-center justify-center transition-all shadow-sm group-hover:shadow-hard-sm">
                        <m.icon size={16} className="text-black dark:text-white" />
                    </div>
                    <span className="font-mono text-[8px] md:text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white">
                        {m.label}
                    </span>
                </button>
            ))}
        </div>
    );
};