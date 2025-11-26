import React, { useState } from 'react';
import { Client } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { X, Trash2, Edit2 } from 'lucide-react';

interface Props {
  client: Client;
  onClose: () => void;
}

export const EditClientModal: React.FC<Props> = ({ client, onClose }) => {
  const { user } = useAppStore();
  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company);
  const [email, setEmail] = useState(client.email);
  const [status, setStatus] = useState(client.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await db.collection('clients').doc(client.id).update({
        name,
        company,
        email,
        status
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if(!confirm(`Delete client "${client.company}"? This will NOT delete their projects automatically.`)) return;
      setIsSubmitting(true);
      try {
          await db.collection('clients').doc(client.id).delete();
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
          <h3 className="font-mono font-bold uppercase flex items-center gap-2"><Edit2 size={16}/> EDIT_CLIENT</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <NoirInput label="Contact Name" value={name} onChange={e => setName(e.target.value)} />
          <NoirInput label="Company" value={company} onChange={e => setCompany(e.target.value)} />
          <NoirInput label="Email" value={email} onChange={e => setEmail(e.target.value)} />
          
          <div>
             <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Status</label>
             <div className="flex gap-2">
                {['active', 'lead', 'inactive'].map(s => (
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
                 <Trash2 size={14}/> DELETE
             </button>
             <NoirButton type="submit" disabled={isSubmitting}>
                 {isSubmitting ? 'SAVING...' : 'SAVE'}
             </NoirButton>
          </div>
        </form>
      </div>
    </div>
  );
};