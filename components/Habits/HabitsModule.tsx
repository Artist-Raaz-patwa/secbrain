import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Habit, HabitLog } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, BarChart2, Calendar as CalIcon, Settings } from 'lucide-react';
import { HabitAnalytics } from './HabitAnalytics';
import { DayViewModal } from './DayViewModal';
import { ManageHabitsModal } from './ManageHabitsModal';
import { LoggerService } from '../../services/logger';

export const HabitsModule: React.FC = () => {
  const { user, habits, setHabits, habitLogs, setHabitLogs } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'daily'|'weekly'|'monthly'|'yearly'>('weekly');
  const [isCreating, setIsCreating] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // 1. Fetch Habits
  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('habits')
        .where('userId', '==', user.uid)
        .onSnapshot((snapshot) => {
            const fetched: Habit[] = [];
            snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as Habit));
            fetched.sort((a,b) => b.createdAt - a.createdAt);
            setHabits(fetched);
        }, (error) => {
            console.error("Habits sync error:", error);
        });
    return () => unsub();
  }, [user]);

  // 2. Fetch Logs (Realtime)
  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('habit_logs')
        .where('userId', '==', user.uid)
        .onSnapshot((snapshot) => {
            const logs: Record<string, boolean> = {};
            snapshot.forEach(doc => {
                const data = doc.data() as HabitLog;
                logs[`${data.habitId}_${data.date}`] = true;
            });
            setHabitLogs(logs);
        }, (error) => {
            console.error("Habit logs sync error:", error);
        });
    return () => unsub();
  }, [user]);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim() || !user) return;
    try {
        await db.collection('habits').add({
            title: newHabitTitle,
            userId: user.uid,
            createdAt: Date.now(),
            archived: false
        });
        await LoggerService.success(user.uid, 'DB', `Habit Tracker Initialized: ${newHabitTitle}`);
        setNewHabitTitle('');
        setIsCreating(false);
    } catch (e: any) {
        console.error(e);
        await LoggerService.error(user.uid, 'DB', `Failed to create habit: ${newHabitTitle}`, e.message);
    }
  };

  // Calculate Heatmap Intensity (0 to 1)
  const getIntensity = (day: number) => {
    if (habits.length === 0) return 0;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let completedCount = 0;
    habits.forEach(h => {
        if (habitLogs[`${h.id}_${dateStr}`]) completedCount++;
    });
    return completedCount / habits.length;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-black dark:border-white pb-6">
        <div>
            <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Productivity_Matrix</h2>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">CLEAR THE DARKNESS. FILL THE VOID.</p>
        </div>
        <div className="flex gap-2">
            <NoirButton onClick={() => setIsManaging(true)} variant="secondary" className="px-3" title="Manage Habits">
                 <Settings size={18} />
            </NoirButton>

            {!isCreating ? (
                <NoirButton onClick={() => setIsCreating(true)}>
                    <div className="flex items-center gap-2">
                        <Plus size={18} /> NEW TRACKER
                    </div>
                </NoirButton>
            ) : (
                <form onSubmit={handleCreateHabit} className="flex gap-2 animate-in slide-in-from-right duration-300">
                    <input 
                        className="border-2 border-black dark:border-white p-2 font-mono text-sm outline-none bg-white dark:bg-neutral-900 text-black dark:text-white"
                        placeholder="Habit Name..."
                        value={newHabitTitle}
                        onChange={e => setNewHabitTitle(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="bg-black text-white dark:bg-white dark:text-black px-4 font-bold font-mono text-xs">ADD</button>
                    <button type="button" onClick={() => setIsCreating(false)} className="border-2 border-black dark:border-white px-3"><Plus size={18} className="rotate-45"/></button>
                </form>
            )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <HabitAnalytics habits={habits} logs={habitLogs} view={analyticsView} />
        </div>
        <div className="flex flex-col justify-end gap-2">
            <p className="font-mono text-xs font-bold mb-2 uppercase text-gray-400">Timeframe</p>
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(v => (
                <button
                    key={v}
                    onClick={() => setAnalyticsView(v)}
                    className={`w-full p-3 border-2 font-display font-bold uppercase tracking-widest text-xs transition-all
                        ${analyticsView === v 
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-hard-sm dark:shadow-hard-sm-white' 
                            : 'bg-transparent text-gray-400 border-gray-200 dark:border-neutral-700 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'}
                    `}
                >
                    {v}
                </button>
            ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="font-mono text-xl hover:scale-125 transition-transform">&lt;</button>
            <h3 className="font-display font-black text-2xl uppercase tracking-widest">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className="font-mono text-xl hover:scale-125 transition-transform">&gt;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Weekday Headers */}
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} className="text-center font-mono text-xs font-bold text-gray-400 mb-2">{d}</div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-gray-50 dark:bg-neutral-800/50" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const intensity = getIntensity(day); // 0 to 1
                
                // Strict Date Comparison for "Future" styling
                const today = new Date();
                today.setHours(0,0,0,0);
                const cellDate = new Date(year, month, day);
                const isFuture = cellDate > today;

                return (
                    <div 
                        key={day}
                        onClick={() => !isFuture && setSelectedDate(dateStr)}
                        className={`
                            aspect-square border border-gray-200 dark:border-neutral-800 relative group cursor-pointer overflow-hidden transition-all duration-300
                            ${isFuture ? 'cursor-not-allowed' : 'hover:scale-105 hover:z-10 hover:shadow-lg'}
                        `}
                        style={{
                            // Noir Logic: 0% = Black (Darkness), 100% = White (Cleared)
                            // FUTURE DAYS: Forced Black (#000000) with NO opacity to prevent grey look.
                            backgroundColor: isFuture ? '#000000' : `rgb(${intensity * 255}, ${intensity * 255}, ${intensity * 255})`,
                        }}
                    >
                        {/* Date Number - Contrast flips based on intensity */}
                        {/* If future (black), text is white (or dark grey if intended to be hidden, but white is readable) */}
                        <span 
                            className={`absolute top-1 left-1 font-mono text-[10px] font-bold ${(!isFuture && intensity > 0.5) ? 'text-black mix-blend-multiply' : 'text-white mix-blend-difference'}`}
                        >
                            {day}
                        </span>
                        
                        {/* Tooltip on Hover */}
                        {!isFuture && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 dark:bg-white/10 backdrop-blur-sm">
                                <span className={`font-mono text-xs font-bold ${intensity > 0.5 ? 'text-black' : 'text-white'}`}>
                                    {Math.round(intensity * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Day View Modal */}
      {selectedDate && (
          <DayViewModal dateStr={selectedDate} onClose={() => setSelectedDate(null)} />
      )}

      {/* Habit Manager Modal */}
      {isManaging && (
          <ManageHabitsModal onClose={() => setIsManaging(false)} />
      )}
    </div>
  );
};