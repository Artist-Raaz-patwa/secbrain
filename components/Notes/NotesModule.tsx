import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { NoteCard } from './NoteCard';
import { NoirButton } from '../ui/NoirButton';
import { Plus } from 'lucide-react';
import { Note } from '../../types';

export const NotesModule: React.FC = () => {
  const { user, notes, setNotes, setNoteModalOpen } = useAppStore();

  useEffect(() => {
    if (!user) return;

    // Real-time listener
    const unsubscribe = db.collection('notes')
      .where('userId', '==', user.uid)
      .onSnapshot((snapshot) => {
        const fetchedNotes: Note[] = [];
        snapshot.forEach((doc) => {
          fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
        });
        
        // Client-side sort to prevent Index errors
        fetchedNotes.sort((a, b) => b.createdAt - a.createdAt);
        
        setNotes(fetchedNotes);
      }, (error) => {
        console.error("Error fetching notes:", error);
      });

    return () => unsubscribe();
  }, [user, setNotes]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border-2 border-black shadow-hard p-4 dark:bg-neutral-900 dark:border-white dark:shadow-hard-white">
        <div>
            <h2 className="text-2xl font-black uppercase font-display text-black dark:text-white">Note_Database</h2>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {notes.length} ITEMS STORED
            </p>
        </div>
        <NoirButton onClick={() => setNoteModalOpen(true)}>
            <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>NEW NOTE</span>
            </div>
        </NoirButton>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-mono">
            <p>NO DATA FOUND</p>
            <button onClick={() => setNoteModalOpen(true)} className="underline mt-2 hover:text-black dark:hover:text-white">INITIALIZE FIRST ENTRY</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {notes.map(note => (
                <NoteCard key={note.id} note={note} />
            ))}
        </div>
      )}
    </div>
  );
};