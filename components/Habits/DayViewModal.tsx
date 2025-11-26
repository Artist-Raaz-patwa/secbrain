import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Check } from 'lucide-react';
import { db } from '../../firebase';
import { LoggerService } from '../../services/logger';

interface DayViewModalProps {
  dateStr: string; // YYYY-MM-DD
  onClose: () => void;
}

export const DayViewModal: React.FC<DayViewModalProps> = ({ dateStr, onClose }) => {
  const { user, habits, habitLogs, setHabitLogs } = useAppStore();

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const key = `${habitId}_${dateStr}`;
    const isCompleted = !!habitLogs[key];
    const newStatus = !isCompleted;

    // Optimistic Update
    const newLogs = { ...habitLogs, [key]: newStatus };
    setHabitLogs(newLogs);

    const logDocId = `${user.uid}_${habitId}_${dateStr}`;
    const habitTitle = habits.find(h => h.id === habitId)?.title || 'Unknown Habit';
    
    try {
        if (newStatus) {
            await db.collection('habit_logs').doc(logDocId).set({
                userId: user.uid,
                habitId,
                date: dateStr,
                completed: true
            });
            await LoggerService.info(user.uid, 'DB', `Habit Checked: ${habitTitle}`, `Date: ${dateStr}`);
        } else {
            await db.collection('habit_logs').doc(logDocId).delete();
            await LoggerService.info(user.uid, 'DB', `Habit Unchecked: ${habitTitle}`, `Date: ${dateStr}`);
        }
    } catch (e: any) {
        console.error("Failed to toggle habit", e);
        // Revert
        setHabitLogs({ ...habitLogs, [key]: isCompleted });
        await LoggerService.error(user.uid, 'DB', 'Habit Toggle Failed', e.message);
    }
  };

  const displayDate = new Date(dateStr).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
        
        <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
            <h3 className="font-mono font-bold uppercase tracking-wider">{displayDate}</h3>
            <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {habits.length === 0 ? (
                <div className="text-center text-gray-400 font-mono py-8">
                    NO HABITS DEFINED.
                </div>
            ) : (
                habits.map(habit => {
                    const isCompleted = !!habitLogs[`${habit.id}_${dateStr}`];
                    return (
                        <div 
                            key={habit.id}
                            onClick={() => toggleHabit(habit.id)}
                            className={`
                                flex items-center justify-between p-4 border-2 cursor-pointer transition-all
                                ${isCompleted 
                                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white' 
                                    : 'bg-white text-black border-black dark:bg-neutral-900 dark:text-white dark:border-white hover:bg-gray-50 dark:hover:bg-neutral-800'}
                            `}
                        >
                            <span className="font-display font-bold uppercase tracking-wide">{habit.title}</span>
                            <div className={`
                                w-6 h-6 border-2 flex items-center justify-center
                                ${isCompleted ? 'border-white dark:border-black' : 'border-black dark:border-white'}
                            `}>
                                {isCompleted && <Check size={16} />}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};