
import React, { useState } from 'react';
import { ProjectTask } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, DollarSign, Clock } from 'lucide-react';

interface Props {
  task: ProjectTask;
  onClose: () => void;
}

export const BillTaskModal: React.FC<Props> = ({ task, onClose }) => {
  const { user } = useAppStore();
  const [hours, setHours] = useState(task.hours.toString());
  const [rate, setRate] = useState(task.rate.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      await db.collection('project_tasks').doc(task.id).update({
        hours: parseFloat(hours),
        rate: parseFloat(rate),
        completed: true,
        billed: false // Reset billed status on re-completion just in case
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
        <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
          <h3 className="font-mono font-bold uppercase text-xs tracking-wider">FINALIZE_BILLABLE</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="mb-4">
             <div className="font-display font-bold text-lg leading-tight mb-1">{task.title}</div>
             <div className="font-mono text-xs text-gray-500 uppercase">Confirm Billing Details</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="font-mono text-[10px] font-bold uppercase flex items-center gap-1"><Clock size={12}/> Actual Hours</label>
                 <input 
                    type="number" 
                    step="0.1"
                    className="w-full border-2 border-black dark:border-white p-2 font-mono text-sm bg-transparent outline-none"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    required
                 />
              </div>
              <div className="space-y-2">
                 <label className="font-mono text-[10px] font-bold uppercase flex items-center gap-1"><DollarSign size={12}/> Hourly Rate</label>
                 <input 
                    type="number"
                    step="0.01" 
                    className="w-full border-2 border-black dark:border-white p-2 font-mono text-sm bg-transparent outline-none"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    required
                 />
              </div>
          </div>

          <div className="pt-2">
              <div className="flex justify-between items-center font-mono text-xs mb-4 p-2 bg-gray-100 dark:bg-neutral-800">
                  <span>TOTAL BILLABLE:</span>
                  <span className="font-bold text-lg">${(parseFloat(hours || '0') * parseFloat(rate || '0')).toFixed(2)}</span>
              </div>
              <NoirButton fullWidth type="submit" disabled={isSubmitting}>
                 {isSubmitting ? 'SAVING...' : 'CONFIRM & COMPLETE'}
              </NoirButton>
          </div>
        </form>
      </div>
    </div>
  );
};
