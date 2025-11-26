
import React, { useState } from 'react';
import { Project } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { X, Trash2, Save } from 'lucide-react';

interface Props {
  project: Project;
  onClose: () => void;
}

export const EditProjectModal: React.FC<Props> = ({ project, onClose }) => {
  const { user, projectTasks } = useAppStore();
  const [title, setTitle] = useState(project.title);
  const [status, setStatus] = useState(project.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await db.collection('projects').doc(project.id).update({
        title,
        status
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // Check if project has tasks
    const hasTasks = projectTasks.some(t => t.projectId === project.id);
    if (hasTasks) {
        alert("Cannot delete project containing tasks. Please delete tasks first.");
        return;
    }

    if (!confirm(`Permanently delete project "${project.title}"?`)) return;
    
    setIsSubmitting(true);
    try {
        await db.collection('projects').doc(project.id).delete();
        onClose();
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
        <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
          <h3 className="font-mono font-bold uppercase flex items-center gap-2">EDIT_PROJECT</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <NoirInput 
            label="Project Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <div>
             <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Status</label>
             <div className="grid grid-cols-2 gap-2">
                {['planning', 'in-progress', 'completed', 'paused'].map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s as any)}
                        className={`p-2 border-2 text-[10px] font-bold uppercase font-mono transition-all
                            ${status === s ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'border-gray-300 text-gray-400 hover:border-black dark:hover:border-white'}
                        `}
                    >
                        {s}
                    </button>
                ))}
             </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-black/10 dark:border-white/10">
              <button 
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:underline font-mono text-xs font-bold"
              >
                 <Trash2 size={14} /> DELETE PROJECT
              </button>
              <NoirButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
              </NoirButton>
          </div>
        </form>
      </div>
    </div>
  );
};
