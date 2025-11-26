import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoirInput } from '../ui/NoirInput';
import { NoirButton } from '../ui/NoirButton';
import { X, Users } from 'lucide-react';
import { LoggerService } from '../../services/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AddClientModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { user } = useAppStore();
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await db.collection('clients').add({
                userId: user.uid,
                name,
                company,
                email,
                status: 'active',
                createdAt: Date.now()
            });
            await LoggerService.success(user.uid, 'CRM', `New Client Added: ${company}`);
            onClose();
            setName('');
            setCompany('');
            setEmail('');
        } catch (e: any) {
            console.error(e);
            if(user) await LoggerService.error(user.uid, 'CRM', 'Client Addition Failed', e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
                 <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center">
                    <h3 className="font-mono font-bold flex items-center gap-2"><Users size={18}/> NEW_CLIENT_PROFILE</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <NoirInput label="Contact Name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                    <NoirInput label="Company Name" placeholder="Acme Corp." value={company} onChange={e => setCompany(e.target.value)} required />
                    <NoirInput label="Email" type="email" placeholder="contact@acme.com" value={email} onChange={e => setEmail(e.target.value)} />
                    
                    <NoirButton fullWidth type="submit">ONBOARD CLIENT</NoirButton>
                </form>
            </div>
        </div>
    );
};