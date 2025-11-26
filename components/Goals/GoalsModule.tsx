import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Goal } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, Target } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { CreateGoalModal } from './CreateGoalModal';
import { EditGoalModal } from './EditGoalModal';

export const GoalsModule: React.FC = () => {
    const { user, goals, setGoals } = useAppStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsub = db.collection('goals')
            .where('userId', '==', user.uid)
            .onSnapshot(snap => {
                const fetched = snap.docs.map(d => ({id: d.id, ...d.data()} as Goal));
                // Sort by deadline (closest first)
                fetched.sort((a, b) => a.targetDate - b.targetDate);
                setGoals(fetched);
            });
        return () => unsub();
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-6">
                <div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-black dark:text-white">Mission_Control</h2>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">OBJECTIVES AND DEADLINES</p>
                </div>
                <NoirButton onClick={() => setIsCreateOpen(true)}>
                    <div className="flex items-center gap-2">
                        <Plus size={18} />
                        <span>SET GOAL</span>
                    </div>
                </NoirButton>
            </div>

            {goals.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 font-mono">
                    <Target size={48} className="mb-4 opacity-20" />
                    <p>NO ACTIVE MISSIONS</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onClick={() => setEditingGoal(goal)} />
                    ))}
                </div>
            )}

            <CreateGoalModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            
            {editingGoal && (
                <EditGoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} />
            )}
        </div>
    );
};