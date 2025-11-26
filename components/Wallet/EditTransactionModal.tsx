
import React, { useState } from 'react';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, Trash2, Edit2 } from 'lucide-react';
import { LoggerService } from '../../services/logger';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<Props> = ({ transaction, onClose }) => {
  const { user } = useAppStore();
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(new Date(transaction.date).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    // Note: Changing amount usually requires recalculating balance. 
    // For MVP simplicity and safety, we will just update the record here.
    // Ideally, we reverse old amount and apply new amount to account balance.
    // Implementing Balance Adjustment logic:
    
    try {
        const oldAmount = transaction.amount;
        const newAmount = parseFloat(amount);
        const diff = newAmount - oldAmount;
        
        // Only update balance if amount changed
        if (diff !== 0) {
            const accRef = db.collection('accounts').doc(transaction.accountId);
            const accDoc = await accRef.get();
            const currentBal = accDoc.data()?.balance || 0;
            
            // If income increased, add diff. If expense increased, subtract diff.
            let balanceChange = 0;
            if (transaction.type === 'income') {
                balanceChange = diff;
            } else {
                balanceChange = -diff;
            }
            
            await accRef.update({ balance: currentBal + balanceChange });
        }

        await db.collection('transactions').doc(transaction.id).update({
            description,
            amount: newAmount,
            category,
            date: new Date(date).getTime()
        });

        await LoggerService.info(user.uid, 'WALLET', `Transaction Updated: ${description}`);
        onClose();
    } catch (e: any) {
        console.error(e);
        await LoggerService.error(user.uid, 'WALLET', 'Transaction Update Failed', e.message);
        alert("Failed to update transaction.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
      if(!confirm(`Delete transaction "${transaction.description}"? Note: This does NOT automatically revert the account balance.`)) return;
      setIsSubmitting(true);
      try {
          await db.collection('transactions').doc(transaction.id).delete();
          await LoggerService.warn(user!.uid, 'WALLET', `Transaction Deleted: ${transaction.description}`);
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
          <h3 className="font-mono font-bold uppercase flex items-center gap-2"><Edit2 size={16}/> EDIT_LOG</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <NoirInput label="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <NoirInput label="Amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          <NoirInput label="Category" value={category} onChange={e => setCategory(e.target.value)} />
          
           <div className="space-y-2">
                <label className="block font-display text-xs font-bold uppercase tracking-wider text-black dark:text-white">Date</label>
                <input 
                    type="date" 
                    className="w-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-3 font-mono text-sm outline-none text-black dark:text-white"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
            </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-black/10 dark:border-white/10 mt-4">
             <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 flex items-center gap-1 font-mono text-xs font-bold">
                 <Trash2 size={14}/> DELETE
             </button>
             <NoirButton type="submit" disabled={isSubmitting}>
                 {isSubmitting ? 'UPDATING...' : 'UPDATE RECORD'}
             </NoirButton>
          </div>
        </form>
      </div>
    </div>
  );
};
