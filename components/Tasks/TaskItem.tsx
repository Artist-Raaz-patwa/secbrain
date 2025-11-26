import React, { useState, useRef, useEffect } from 'react';
import { Task, Subtask } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { ChevronDown, ChevronRight, Trash2, Plus, CornerDownRight, Edit2, Check } from 'lucide-react';
import { NoirInput } from '../ui/NoirInput';
import { LoggerService } from '../../services/logger';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { updateTask, removeTask, user } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isEditing) editInputRef.current?.focus();
  }, [isEditing]);

  const toggleTaskCompletion = async () => {
    const newStatus = !task.completed;
    // Optimistic update
    updateTask(task.id, { completed: newStatus });
    try {
      await db.collection('tasks').doc(task.id).update({ completed: newStatus });
      if(user) await LoggerService.info(user.uid, 'DB', `Task ${newStatus ? 'Completed' : 'Reopened'}: ${task.title}`);
    } catch (e) {
      console.error(e);
      updateTask(task.id, { completed: !newStatus }); // Revert
    }
  };

  const saveTitle = async () => {
      if (editTitle.trim() === '') return;
      setIsEditing(false);
      try {
          await db.collection('tasks').doc(task.id).update({ title: editTitle });
          updateTask(task.id, { title: editTitle });
      } catch (e) {
          console.error(e);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveTitle();
  };

  const deleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Abort this directive?')) return;
    try {
        await db.collection('tasks').doc(task.id).delete();
        removeTask(task.id);
        if(user) await LoggerService.warn(user.uid, 'DB', `Task Deleted: ${task.title}`);
    } catch (e) {
        console.error(e);
    }
  };

  // Subtask Handlers
  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
        id: Date.now().toString(),
        title: newSubtaskTitle,
        completed: false
    };

    const updatedSubtasks = [...task.subtasks, newSubtask];
    updateTask(task.id, { subtasks: updatedSubtasks });
    setNewSubtaskTitle('');

    try {
        await db.collection('tasks').doc(task.id).update({ subtasks: updatedSubtasks });
    } catch (e) {
        console.error(e);
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask(task.id, { subtasks: updatedSubtasks });
    try {
        await db.collection('tasks').doc(task.id).update({ subtasks: updatedSubtasks });
    } catch (e) {
        console.error(e);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    updateTask(task.id, { subtasks: updatedSubtasks });
    try {
        await db.collection('tasks').doc(task.id).update({ subtasks: updatedSubtasks });
    } catch (e) {
        console.error(e);
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  return (
    <div className={`
        bg-white dark:bg-neutral-900 border-2 border-black dark:border-white mb-4 transition-all duration-300 animate-slide-up
        ${task.completed ? 'opacity-60 border-dashed' : 'opacity-100 shadow-hard dark:shadow-hard-white'}
    `}>
      {/* Main Task Row */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 group transition-colors duration-200"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-grow">
            {/* Custom Checkbox with Animation */}
            <div 
                onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(); }}
                className={`
                    w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                    ${task.completed ? 'bg-black dark:bg-white scale-90' : 'bg-white dark:bg-black hover:bg-gray-200 dark:hover:bg-neutral-800 hover:scale-110'}
                `}
            >
                <div className={`w-2 h-2 bg-white dark:bg-black transition-transform duration-300 ${task.completed ? 'scale-100' : 'scale-0'}`} />
            </div>

            <div className="flex-grow">
                {isEditing ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input 
                            ref={editInputRef}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent border-b-2 border-black dark:border-white font-mono font-bold text-lg text-black dark:text-white outline-none w-full"
                        />
                        <button onClick={saveTitle} className="text-green-600 hover:scale-110 transition-transform"><Check size={20}/></button>
                    </div>
                ) : (
                    <div className="relative inline-block">
                        <h4 className={`font-mono font-bold text-lg text-black dark:text-white transition-colors duration-300 ${task.completed ? 'text-gray-500 dark:text-gray-500' : ''}`}>
                            {task.title}
                        </h4>
                        {/* Strikethrough Line Animation */}
                        <div className={`absolute top-1/2 left-0 w-full h-0.5 bg-black dark:bg-white transition-all duration-500 origin-left ${task.completed ? 'scale-x-100' : 'scale-x-0'}`}></div>
                    </div>
                )}
                
                {totalSubtasks > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-gray-200 dark:bg-neutral-700 border border-black dark:border-white">
                            <div className="h-full bg-black dark:bg-white transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{completedSubtasks}/{totalSubtasks} SUBTASKS</span>
                    </div>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2">
             {!isEditing && !task.completed && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                >
                    <Edit2 size={16} />
                 </button>
             )}
             <button onClick={deleteTask} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-sm">
                <Trash2 size={16} />
             </button>
             <div className="text-black dark:text-white transition-transform duration-300">
                 {isExpanded ? <ChevronDown size={20} className="rotate-180" /> : <ChevronRight size={20} />}
             </div>
        </div>
      </div>

      {/* Subtasks Area with Slide Down */}
      {isExpanded && (
        <div className="border-t-2 border-black/10 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 p-4 pl-8 space-y-3 animate-slide-up">
            {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-3 group animate-pop-in">
                    <CornerDownRight size={14} className="text-gray-400" />
                    <div 
                        onClick={() => toggleSubtask(subtask.id)}
                        className={`w-4 h-4 border-2 border-black dark:border-white flex items-center justify-center cursor-pointer transition-colors ${subtask.completed ? 'bg-black dark:bg-white' : 'bg-white dark:bg-black hover:bg-gray-200'}`}
                    >
                        {subtask.completed && <div className="w-1.5 h-1.5 bg-white dark:bg-black" />}
                    </div>
                    <span className={`font-mono text-sm flex-grow text-black dark:text-white transition-all ${subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                        {subtask.title}
                    </span>
                    <button 
                        onClick={() => deleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                        <XIcon size={14} />
                    </button>
                </div>
            ))}

            <form onSubmit={addSubtask} className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-200 dark:border-neutral-700">
                <Plus size={16} className="text-gray-400" />
                <input 
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add sub-directive..."
                    className="flex-grow bg-transparent font-mono text-sm outline-none border-b border-transparent focus:border-black dark:focus:border-white placeholder:text-gray-400 text-black dark:text-white transition-colors"
                />
                <button 
                    type="submit" 
                    className="text-xs font-bold font-mono uppercase text-black dark:text-white hover:underline disabled:opacity-50"
                    disabled={!newSubtaskTitle.trim()}
                >
                    ADD
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);