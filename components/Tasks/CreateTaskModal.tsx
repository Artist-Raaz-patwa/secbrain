import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { X, CheckSquare } from 'lucide-react';
import { db } from '../../firebase';
import { Task } from '../../types';
import { LoggerService } from '../../services/logger';

export const CreateTaskModal: React.FC = () => {
  const { isTaskModalOpen, setTaskModalOpen, user, addTask } = useAppStore();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isTaskModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        const newTaskData = {
            title,
            completed: false,
            userId: user.uid,
            createdAt: Date.now(),
            subtasks: []
        };
        
        // Use Compat API
        const docRef = await db.collection('tasks').add(newTaskData);
        
        const newTask: Task = { id: docRef.id, ...newTaskData };
        addTask(newTask);
        
        await LoggerService.success(user.uid, 'DB', `Task Created: ${title}`, `ID: ${docRef.id}`);

        setTitle('');
        setTaskModalOpen(false);
    } catch (error: any) {
        console.error("Error creating task:", error);
        await LoggerService.error(user.uid, 'DB', 'Task Creation Failed', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md border-4 border-black shadow-hard-lg relative animate-in fade-in zoom-in duration-200">
        <div className="bg-black text-white p-4 flex justify-between items-center">
            <h3 className="font-mono font-bold flex items-center gap-2"><CheckSquare size={18}/> NEW_DIRECTIVE</h3>
            <button onClick={() => setTaskModalOpen(false)}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <NoirInput 
                label="Task Description"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Complete the objective..."
                autoFocus
                required
            />
            
            <NoirButton fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'PROCESSING...' : 'INITIALIZE TASK'}
            </NoirButton>
        </form>
      </div>
    </div>
  );
};