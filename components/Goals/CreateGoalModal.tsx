import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, Target, Image as ImageIcon } from 'lucide-react';
import { LoggerService } from '../../services/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateGoalModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user } = useAppStore();
    const [title, setTitle] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await db.collection('goals').add({
                userId: user.uid,
                title,
                targetDate: new Date(targetDate).getTime(),
                targetAmount: targetAmount ? parseFloat(targetAmount) : null,
                currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
                imageUrl: imageUrl || null,
                status: 'active',
                createdAt: Date.now()
            });
            await LoggerService.success(user.uid, 'GOALS', `Goal Created: ${title}`);
            onClose();
            setTitle('');
            setTargetDate('');
            setTargetAmount('');
            setCurrentAmount('');
            setImageUrl('');
        } catch (e: any) {
            console.error(e);
            if(user) await LoggerService.error(user.uid, 'GOALS', 'Goal Creation Failed', e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
                 <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2"><Target size={18}/> NEW_OBJECTIVE</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <NoirInput label="Goal Title" placeholder="Buy House, Learn Python..." value={title} onChange={e => setTitle(e.target.value)} required />
                    
                    <div className="space-y-2">
                        <label className="block font-display text-xs font-bold uppercase tracking-wider text-black dark:text-white">Target Date</label>
                        <input 
                            type="date" 
                            className="w-full bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-3 font-mono text-sm outline-none text-black dark:text-white"
                            value={targetDate}
                            onChange={e => setTargetDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <NoirInput label="Target Amount (Opt)" type="number" placeholder="10000" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                        <NoirInput label="Current Progress (Opt)" type="number" placeholder="0" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
                    </div>

                    <NoirInput 
                        label="Vision Board Image URL (Opt)" 
                        placeholder="https://images.unsplash.com/..." 
                        value={imageUrl} 
                        onChange={e => setImageUrl(e.target.value)} 
                    />
                    
                    <NoirButton fullWidth type="submit">SET OBJECTIVE</NoirButton>
                </form>
            </div>
        </div>
    );
};