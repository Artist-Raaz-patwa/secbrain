import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Notebook } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { NoirInput } from '../ui/NoirInput';
import { X, Trash2, Edit2 } from 'lucide-react';

interface Props {
    notebook: Notebook;
    onClose: () => void;
}

export const EditNotebookModal: React.FC<Props> = ({ notebook, onClose }) => {
    const { user, setNotebooks, notebooks } = useAppStore();
    const [title, setTitle] = useState(notebook.title);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await db.collection('notebooks').doc(notebook.id).update({ title });
            // Optimistic update
            const updated = notebooks.map(n => n.id === notebook.id ? { ...n, title } : n);
            setNotebooks(updated);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Warning: Deleting "${notebook.title}" will also delete ALL pages inside it. This cannot be undone.`)) return;
        setIsSubmitting(true);
        try {
            // 1. Delete Pages (Batch)
            const pagesSnap = await db.collection('notes').where('notebookId', '==', notebook.id).get();
            const batch = db.batch();
            pagesSnap.forEach(doc => batch.delete(doc.ref));
            
            // 2. Delete Notebook
            const nbRef = db.collection('notebooks').doc(notebook.id);
            batch.delete(nbRef);
            
            await batch.commit();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
                <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
                    <h3 className="font-mono font-bold uppercase flex items-center gap-2"><Edit2 size={16}/> EDIT_BOOK</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-6">
                    <NoirInput 
                        label="Notebook Title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                    />
                    
                    <div className="flex justify-between gap-4 pt-4 border-t-2 border-black/10 dark:border-white/10">
                        <button 
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 transition-colors font-mono text-xs font-bold rounded"
                        >
                            <Trash2 size={16} /> BURN IT
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