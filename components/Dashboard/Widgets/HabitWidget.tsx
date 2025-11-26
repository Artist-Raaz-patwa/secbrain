import React from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { db } from '../../../firebase';
import { Check } from 'lucide-react';

export const HabitWidget: React.FC = () => {
    const { habits, habitLogs, user } = useAppStore();
    const today = new Date().toISOString().split('T')[0];

    const toggleHabit = async (habitId: string, currentStatus: boolean) => {
        if (!user) return;
        const logId = `${user.uid}_${habitId}_${today}`;
        if (!currentStatus) {
            await db.collection('habit_logs').doc(logId).set({
                userId: user.uid, habitId, date: today, completed: true
            });
        } else {
            await db.collection('habit_logs').doc(logId).delete();
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            {habits.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-400 text-xs font-mono">NO TRACKERS ACTIVE</div>
            ) : (
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {habits.map(h => {
                        const isDone = !!habitLogs[`${h.id}_${today}`];
                        return (
                            <div key={h.id} className="flex items-center justify-between group cursor-pointer" onClick={() => toggleHabit(h.id, isDone)}>
                                <span className={`font-mono text-xs truncate ${isDone ? 'line-through text-gray-400' : 'text-black dark:text-white'}`}>{h.title}</span>
                                <div className={`w-4 h-4 border border-black dark:border-white flex items-center justify-center transition-colors ${isDone ? 'bg-black dark:bg-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`}>
                                    {isDone && <Check size={12} className="text-white dark:text-black"/>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};