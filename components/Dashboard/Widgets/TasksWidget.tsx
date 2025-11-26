import React from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { db } from '../../../firebase';
import { CheckSquare } from 'lucide-react';

export const TasksWidget: React.FC = () => {
    const { tasks, setTasks } = useAppStore();
    const activeTasks = tasks.filter(t => !t.completed).slice(0, 4);

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        // Optimistic update
        const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
        setTasks(updated);
        await db.collection('tasks').doc(taskId).update({ completed: !currentStatus });
    };

    return (
        <div className="p-4 h-full flex flex-col">
            {activeTasks.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 text-xs font-mono">
                    <CheckSquare size={24} className="mb-2 opacity-20"/>
                    NO PENDING DIRECTIVES
                </div>
            ) : (
                <div className="space-y-2">
                    {activeTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b border-dashed border-gray-200 dark:border-neutral-800 last:border-0">
                            <button 
                                onClick={() => toggleTask(task.id, task.completed)}
                                className="w-4 h-4 border border-black dark:border-white flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            />
                            <span className="font-mono text-xs truncate text-black dark:text-white">{task.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};