import React, { useState } from 'react';
import { Goal } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, Trash2, Edit2 } from 'lucide-react';

interface Props {
  goal: Goal;
  onClose: () => void;
}

export const EditGoalModal: React.FC<Props> = ({ goal, onClose }) => {
  const { user } = useAppStore();
  const [currentAmount, setCurrentAmount] = useState(goal.currentAmount?.toString() || '0');
  const [imageUrl, setImageUrl] = useState(goal.imageUrl || '');
  const [status, setStatus] = useState(goal.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
        await db.collection('goals').doc(goal.id).update({
            currentAmount: parseFloat(currentAmount),
            imageUrl: imageUrl || null,
            status
        });
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to update goal.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if(!confirm(`Delete goal "${goal.title}"?`)) return;
      setIsSubmitting(true);
      try {
          await db.collection('goals').doc(goal.id).delete();
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
          <h3 className="font-mono font-bold uppercase flex items-center gap-2"><Edit2 size={16}/> UPDATE_OBJECTIVE</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="font-display font-black text-xl uppercase mb-4 truncate">{goal.title}</div>

          {goal.targetAmount && (
             <NoirInput label="Current Progress Amount" type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
          )}

          <NoirInput label="Cover Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          
          <div>
             <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Status</label>
             <div className="flex gap-2">
                {['active', 'completed', 'failed'].map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 p-2 border-2 text-[10px] font-bold uppercase font-mono ${status === s ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'border-gray-300 text-gray-500'}`}
                    >
                        {s}
                    </button>
                ))}
             </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-black/10 dark:border-white/10 mt-4">
             <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 flex items-center gap-1 font-mono text-xs font-bold">
                 <Trash2 size={14}/> ABORT
             </button>
             <NoirButton type="submit" disabled={isSubmitting}>
                 {isSubmitting ? 'UPDATING...' : 'UPDATE'}
             </NoirButton>
          </div>
        </form>
      </div>
    </div>
  );
};