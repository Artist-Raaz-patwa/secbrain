import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput, NoirTextarea } from '../ui/NoirInput';
import { X } from 'lucide-react';
import { db } from '../../firebase';
import { Note } from '../../types';
import { LoggerService } from '../../services/logger';

export const CreateNoteModal: React.FC = () => {
  const { isNoteModalOpen, setNoteModalOpen, user, addNote } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNoteModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setNoteModalOpen]);

  if (!isNoteModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        const newNoteData = {
            title,
            content,
            userId: user.uid,
            createdAt: Date.now(),
            tags: []
        };
        // Use Compat API
        const docRef = await db.collection('notes').add(newNoteData);
        
        const newNote: Note = { id: docRef.id, ...newNoteData };
        addNote(newNote);
        
        await LoggerService.success(user.uid, 'DB', `Note Created: ${title}`, `ID: ${docRef.id}`);

        // Reset and close
        setTitle('');
        setContent('');
        setNoteModalOpen(false);
    } catch (error: any) {
        console.error("Error creating note:", error);
        await LoggerService.error(user.uid, 'DB', 'Note Creation Failed', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl border-4 border-black shadow-hard-lg relative animate-in fade-in zoom-in duration-200">
        
        <div className="bg-black text-white p-4 flex justify-between items-center">
            <h3 className="font-mono font-bold">CREATE_NEW_MEMORY_BLOCK</h3>
            <button onClick={() => setNoteModalOpen(false)} className="hover:text-gray-300">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <NoirInput 
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Alpha..."
                autoFocus
                required
            />
            <NoirTextarea 
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Details of the operation..."
                className="h-48"
                required
            />
            
            <div className="flex justify-end gap-4 pt-4 border-t-2 border-black/10">
                <NoirButton type="button" variant="secondary" onClick={() => setNoteModalOpen(false)}>
                    CANCEL
                </NoirButton>
                <NoirButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'SAVING...' : 'SAVE_NOTE'}
                </NoirButton>
            </div>
        </form>
      </div>
    </div>
  );
};