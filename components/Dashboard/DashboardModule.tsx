import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { DashboardWidget, WidgetType } from '../../types';
import { WidgetWrapper } from './WidgetWrapper';
import { NoirButton } from '../ui/NoirButton';
import { Plus, Edit3, Check } from 'lucide-react';
import { AddWidgetModal } from './AddWidgetModal';

// Widgets
import { ClockWidget } from './Widgets/ClockWidget';
import { ModulesWidget } from './Widgets/ModulesWidget';
import { TasksWidget } from './Widgets/TasksWidget';
import { WalletWidget } from './Widgets/WalletWidget';
import { HabitWidget } from './Widgets/HabitWidget';
import { QuickNoteWidget } from './Widgets/QuickNoteWidget';
import { GoalsWidget } from './Widgets/GoalsWidget';

export const DashboardModule: React.FC = () => {
    const { user, settings, updateSettings } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const layout = settings.dashboardLayout || [];

    const saveLayout = async (newLayout: DashboardWidget[]) => {
        updateSettings({ dashboardLayout: newLayout });
        if (user) {
            await db.collection('settings').doc(user.uid).update({ dashboardLayout: newLayout });
        }
    };

    const addWidget = (type: WidgetType) => {
        const newWidget: DashboardWidget = {
            id: Date.now().toString(),
            type,
            x: 0, 
            y: layout.length
        };
        saveLayout([...layout, newWidget]);
        setIsAddModalOpen(false);
    };

    const removeWidget = (id: string) => {
        const newLayout = layout.filter(w => w.id !== id);
        saveLayout(newLayout);
    };

    const renderWidgetContent = (type: WidgetType) => {
        switch(type) {
            case 'clock': return <ClockWidget />;
            case 'modules': return <ModulesWidget />;
            case 'tasks_list': return <TasksWidget />;
            case 'wallet_summary': return <WalletWidget />;
            case 'habit_today': return <HabitWidget />;
            case 'quick_note': return <QuickNoteWidget />;
            case 'goals_list': return <GoalsWidget />;
            default: return <div className="p-4 text-xs font-mono text-gray-400">WIDGET LOADED</div>;
        }
    };

    const getWidgetTitle = (type: WidgetType) => {
        switch(type) {
            case 'clock': return 'SYSTEM_TIME';
            case 'modules': return 'NAVIGATION';
            case 'tasks_list': return 'PRIORITY_TASKS';
            case 'wallet_summary': return 'FINANCIAL_STATUS';
            case 'habit_today': return 'DAILY_PROTOCOL';
            case 'quick_note': return 'QUICK_LOG';
            case 'goals_list': return 'ACTIVE_MISSIONS';
            default: return 'WIDGET';
        }
    };

    // Responsive Grid Classes (Simple Auto Flow)
    const getSpanClass = (type: WidgetType) => {
        if (type === 'modules') return 'col-span-1 md:col-span-2';
        if (type === 'wallet_summary') return 'col-span-1 md:col-span-1';
        return 'col-span-1';
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center mb-6 animate-slide-up">
                 <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Dashboard</h2>
                    <p className="font-mono text-xs text-gray-500 mt-1">OPERATIONAL OVERVIEW</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <NoirButton onClick={() => setIsAddModalOpen(true)}>
                                <div className="flex items-center gap-2"><Plus size={16}/> ADD</div>
                            </NoirButton>
                            <NoirButton onClick={() => setIsEditing(false)} variant="secondary">
                                <div className="flex items-center gap-2"><Check size={16}/> DONE</div>
                            </NoirButton>
                        </>
                    ) : (
                        <NoirButton onClick={() => setIsEditing(true)} variant="secondary" className="px-3">
                            <Edit3 size={18} />
                        </NoirButton>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {layout.map((widget, index) => (
                    <div 
                        key={widget.id} 
                        className={`${getSpanClass(widget.type)} animate-slide-up`} 
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <WidgetWrapper 
                            title={getWidgetTitle(widget.type)}
                            isEditing={isEditing}
                            onRemove={() => removeWidget(widget.id)}
                            className="h-64 hover:scale-[1.01] transition-transform duration-300"
                        >
                            {renderWidgetContent(widget.type)}
                        </WidgetWrapper>
                    </div>
                ))}
                
                {layout.length === 0 && (
                    <div className="col-span-full h-64 border-2 border-dashed border-gray-300 dark:border-neutral-700 flex flex-col items-center justify-center text-gray-400 font-mono animate-pulse">
                        <p>DASHBOARD EMPTY</p>
                        <button onClick={() => setIsEditing(true)} className="underline mt-2 hover:text-black dark:hover:text-white transition-colors">Customize Layout</button>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <AddWidgetModal onClose={() => setIsAddModalOpen(false)} onAdd={addWidget} />
            )}
        </div>
    );
};