import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, DollarSign } from 'lucide-react';
import { LoggerService } from '../../services/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user, accounts } = useAppStore();
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense'|'income'>('expense');
    const [accountId, setAccountId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-select first account when available
    useEffect(() => {
        if (isOpen && accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].id);
        }
    }, [isOpen, accounts, accountId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!accountId) {
            alert("Please create an account first!");
            return;
        }
        
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setIsSubmitting(true);

        try {
            // STEP 1: Fetch the current account state (READ)
            const accountRef = db.collection('accounts').doc(accountId);
            const accountDoc = await accountRef.get();

            if (!accountDoc.exists) {
                throw new Error("Target account not found in database.");
            }

            const currentBal = accountDoc.data()?.balance || 0;
            const newBal = type === 'income' ? currentBal + val : currentBal - val;

            // STEP 2: Prepare the Batch (WRITE)
            const batch = db.batch();

            // Operation A: Update Balance
            batch.update(accountRef, { balance: newBal });

            // Operation B: Create Transaction Log
            const transRef = db.collection('transactions').doc();
            batch.set(transRef, {
                accountId,
                userId: user.uid,
                type,
                amount: val,
                description: desc,
                category: 'General',
                date: Date.now()
            });

            // STEP 3: Commit
            await batch.commit();

            await LoggerService.success(user.uid, 'WALLET', `Transaction: ${type.toUpperCase()} $${val}`, `Desc: ${desc}`);

            onClose();
            setDesc('');
            setAmount('');
        } catch (e: any) {
            console.error("Transaction Error:", e);
            if(user) await LoggerService.error(user.uid, 'WALLET', 'Transaction Failed', e.message);
            
            if (e.message.includes("does not exist")) {
                 alert("CRITICAL ERROR: Firebase Database not found.\n\nPlease go to Firebase Console -> Firestore Database and click 'Create Database' to initialize.");
            } else {
                 alert(`Transaction Failed: ${e.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
                 <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2"><DollarSign size={18}/> LOG_TRANSACTION</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex gap-2 bg-gray-100 dark:bg-neutral-800 p-1">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 font-bold font-mono text-xs ${type === 'expense' ? 'bg-black text-white shadow-md' : 'text-gray-500'}`}>EXPENSE</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 font-bold font-mono text-xs ${type === 'income' ? 'bg-black text-white shadow-md' : 'text-gray-500'}`}>INCOME</button>
                    </div>

                    <div className="space-y-2">
                        <label className="font-display text-xs font-bold uppercase text-black dark:text-white">Account</label>
                        {accounts.length === 0 ? (
                            <div className="p-3 border-2 border-red-500 bg-red-50 text-red-600 font-mono text-xs">
                                NO ACCOUNTS FOUND. PLEASE CREATE ONE.
                            </div>
                        ) : (
                            <select 
                                className="w-full p-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white font-mono text-sm text-black dark:text-white"
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <NoirInput label="Description" placeholder="Starbucks, Salary, etc." value={desc} onChange={e => setDesc(e.target.value)} required />
                    <NoirInput label="Amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                    
                    <NoirButton fullWidth type="submit" disabled={isSubmitting || accounts.length === 0}>
                        {isSubmitting ? 'PROCESSING...' : 'CONFIRM TRANSACTION'}
                    </NoirButton>
                </form>
            </div>
        </div>
    );
};