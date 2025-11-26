import React, { useState } from 'react';
import { WalletAccount } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, Trash2, Edit2 } from 'lucide-react';

interface Props {
  account: WalletAccount;
  onClose: () => void;
}

export const EditAccountModal: React.FC<Props> = ({ account, onClose }) => {
  const { user } = useAppStore();
  const [name, setName] = useState(account.name);
  const [color, setColor] = useState<WalletAccount['colorTheme']>(account.colorTheme);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
        await db.collection('accounts').doc(account.id).update({
            name,
            colorTheme: color
        });
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to update account.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if(!confirm(`Delete account "${account.name}"? Transactions will remain but the account will be gone.`)) return;
      setIsSubmitting(true);
      try {
          await db.collection('accounts').doc(account.id).delete();
          onClose();
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  const colors: WalletAccount['colorTheme'][] = ['black', 'blue', 'green', 'purple', 'red', 'gold', 'cyan', 'pink', 'orange', 'teal', 'silver', 'indigo'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
        <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
          <h3 className="font-mono font-bold uppercase flex items-center gap-2"><Edit2 size={16}/> MANAGE_ASSET</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <NoirInput label="Account Name" value={name} onChange={e => setName(e.target.value)} />
          
           <div>
                 <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Card Style</label>
                 <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                        <button 
                            key={c} 
                            type="button" 
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-black dark:border-white scale-110 ring-2 ring-offset-2 ring-black dark:ring-white' : 'border-transparent'}`}
                            style={{background: c === 'black' ? '#000' : c}}
                            title={c}
                        />
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