
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { AnalyticsWidget, AnalyticsWidgetType } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, Edit3, Check } from 'lucide-react';
import { WidgetWrapper } from '../Dashboard/WidgetWrapper';
import { AddAnalyticsWidgetModal } from './AddAnalyticsWidgetModal';

// Widgets
import { NetWorthWidget } from './Widgets/NetWorthWidget';
import { ExpensePieWidget } from './Widgets/ExpensePieWidget';
import { RevenueBarWidget } from './Widgets/RevenueBarWidget';
import { TaskPieWidget } from './Widgets/TaskPieWidget';
import { HabitTrendWidget } from './Widgets/HabitTrendWidget';
import { GoalProgressWidget } from './Widgets/GoalProgressWidget';

export const AnalyticsModule: React.FC = () => {
    const { user, settings, updateSettings } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const layout = settings.analyticsLayout || [];

    const saveLayout = async (newLayout: AnalyticsWidget[]) => {
        updateSettings({ analyticsLayout: newLayout });
        if (user) {
            await db.collection('settings').doc(user.uid).update({ analyticsLayout: newLayout });
        }
    };

    const addWidget = (type: AnalyticsWidgetType) => {
        const newWidget: AnalyticsWidget = {
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

    const renderWidgetContent = (type: AnalyticsWidgetType) => {
        switch(type) {
            case 'net_worth': return <NetWorthWidget />;
            case 'expense_pie': return <ExpensePieWidget />;
            case 'revenue_bar': return <RevenueBarWidget />;
            case 'task_pie': return <TaskPieWidget />;
            case 'habit_trend': return <HabitTrendWidget />;
            case 'goal_progress': return <GoalProgressWidget />;
            default: return <div className="p-4 text-xs font-mono text-gray-400">NO DATA STREAM</div>;
        }
    };

    const getWidgetTitle = (type: AnalyticsWidgetType) => {
        switch(type) {
            case 'net_worth': return 'FINANCIAL TRAJECTORY';
            case 'expense_pie': return 'OUTFLOW DISTRIBUTION';
            case 'revenue_bar': return 'AGENCY REVENUE (EST)';
            case 'task_pie': return 'DIRECTIVE COMPLETION';
            case 'habit_trend': return 'HABIT CONSISTENCY (14D)';
            case 'goal_progress': return 'MISSION VELOCITY';
            default: return 'DATA MODULE';
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
             <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Command_Center</h2>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">GLOBAL ANALYTICS AGGREGATOR</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {layout.map((widget, index) => (
                     <div 
                        key={widget.id} 
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                         <WidgetWrapper
                            title={getWidgetTitle(widget.type)}
                            isEditing={isEditing}
                            onRemove={() => removeWidget(widget.id)}
                            className="p-6 h-[300px]"
                        >
                            {renderWidgetContent(widget.type)}
                        </WidgetWrapper>
                    </div>
                ))}
            </div>

            {layout.length === 0 && (
                <div className="h-64 border-2 border-dashed border-gray-300 dark:border-neutral-700 flex flex-col items-center justify-center text-gray-400 font-mono animate-pulse">
                    <p>NO DATA STREAMS ACTIVE</p>
                    <button onClick={() => setIsEditing(true)} className="underline mt-2 hover:text-black dark:hover:text-white transition-colors">Configure Command Center</button>
                </div>
            )}

            {isAddModalOpen && (
                <AddAnalyticsWidgetModal onClose={() => setIsAddModalOpen(false)} onAdd={addWidget} />
            )}
        </div>
    );
};
