import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, CreditCard } from 'lucide-react';
import { WalletAccount } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AddAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user, settings } = useAppStore();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<'checking'|'savings'|'credit'>('checking');
    const [color, setColor] = useState<WalletAccount['colorTheme']>('black');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await db.collection('accounts').add({
                userId: user.uid,
                name,
                balance: parseFloat(balance),
                type,
                colorTheme: color,
                currency: settings.baseCurrency, // Use global setting
                createdAt: Date.now(),
                excludeFromTotals: false // Default to included
            });
            onClose();
            setName('');
            setBalance('');
        } catch (e) {
            console.error(e);
        }
    };

    const colors: WalletAccount['colorTheme'][] = ['black', 'blue', 'green', 'purple', 'red', 'gold', 'cyan', 'pink', 'orange', 'teal', 'silver', 'indigo'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
                 <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2"><CreditCard size={18}/> NEW_ASSET</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <NoirInput label="Account Name" placeholder="Chase Checking..." value={name} onChange={e => setName(e.target.value)} required />
                    <NoirInput label="Starting Balance" type="number" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} required />
                    
                    <div>
                        <label className="block font-display text-xs font-bold uppercase tracking-wider mb-2 text-black dark:text-white">Type</label>
                        <div className="flex gap-2">
                            {['checking', 'savings', 'credit'].map(t => (
                                <button key={t} type="button" onClick={() => setType(t as any)} 
                                    className={`flex-1 p-3 border-2 font-mono text-xs uppercase ${type === t ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'border-gray-300 text-gray-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

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

                    <NoirButton fullWidth type="submit">INITIALIZE ACCOUNT</NoirButton>
                </form>
            </div>
        </div>
    );
};