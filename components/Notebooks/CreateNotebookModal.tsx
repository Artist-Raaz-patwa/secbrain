import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { X, Book } from 'lucide-react';
import { db } from '../../firebase';
import { Notebook } from '../../types';

export const CreateNotebookModal: React.FC = () => {
  const { isNotebookModalOpen, setNotebookModalOpen, user, addNotebook } = useAppStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'general' | 'journal'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNotebookModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        // Fix: Explicitly cast coverColor to 'black' | 'white' to satisfy Notebook interface type which expects a specific union type, not generic string.
        const newNotebookData = {
            title,
            type,
            coverColor: (type === 'journal' ? 'black' : 'white') as 'black' | 'white',
            userId: user.uid,
            createdAt: Date.now(),
        };
        
        // Use Compat API
        const docRef = await db.collection('notebooks').add(newNotebookData);
        
        const newNotebook: Notebook = { id: docRef.id, ...newNotebookData };
        addNotebook(newNotebook);
        
        setTitle('');
        setNotebookModalOpen(false);
    } catch (error) {
        console.error("Error creating notebook:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md border-4 border-black shadow-hard-lg relative">
        <div className="bg-black text-white p-4 flex justify-between items-center">
            <h3 className="font-mono font-bold flex items-center gap-2"><Book size={18}/> BIND_NEW_NOTEBOOK</h3>
            <button onClick={() => setNotebookModalOpen(false)}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <NoirInput 
                label="Notebook Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Physics, Ideas, Etc..."
                required
            />
            
            <div className="space-y-2">
                <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-black">Notebook Type</label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setType('general')}
                        className={`flex-1 p-4 border-2 border-black font-mono text-xs text-center transition-all ${type === 'general' ? 'bg-black text-white shadow-hard' : 'bg-white hover:bg-gray-100'}`}
                    >
                        GENERAL
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('journal')}
                        className={`flex-1 p-4 border-2 border-black font-mono text-xs text-center transition-all ${type === 'journal' ? 'bg-black text-white shadow-hard' : 'bg-white hover:bg-gray-100'}`}
                    >
                        JOURNAL
                    </button>
                </div>
            </div>

            <NoirButton fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'BINDING...' : 'CREATE NOTEBOOK'}
            </NoirButton>
        </form>
      </div>
    </div>
  );
};