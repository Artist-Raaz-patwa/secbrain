import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Task } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, CheckSquare } from 'lucide-react';
import { TaskItem } from './TaskItem';

export const TasksModule: React.FC = () => {
  const { user, tasks, setTasks, setTaskModalOpen } = useAppStore();

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = db.collection('tasks')
      .where('userId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const fetchedTasks: Task[] = [];
        snapshot.forEach((doc) => {
            fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
        });
        // Client-side sort by created
        fetchedTasks.sort((a,b) => b.createdAt - a.createdAt);
        setTasks(fetchedTasks);
      }, (error) => {
        console.error("Error fetching tasks:", error);
      });

    return () => unsubscribe();
  }, [user, setTasks]);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white p-4">
        <div>
            <h2 className="text-2xl font-display font-black uppercase text-black dark:text-white">DIRECTIVES</h2>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {activeTasks.length} PENDING // {completedTasks.length} COMPLETE
            </p>
        </div>
        <NoirButton onClick={() => setTaskModalOpen(true)}>
            <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>NEW TASK</span>
            </div>
        </NoirButton>
      </div>

      <div className="space-y-4">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 font-mono">
                <CheckSquare size={32} className="mb-2 opacity-50"/>
                <p>NO DIRECTIVES FOUND</p>
            </div>
        ) : (
            <>
                {activeTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                ))}
                
                {completedTasks.length > 0 && (
                    <div className="pt-8">
                        <h3 className="font-mono text-xs font-bold text-gray-400 dark:text-gray-600 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">ARCHIVED_MISSIONS</h3>
                        {completedTasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};