import React from 'react';
import { Note } from '../../types';
import { Trash2, Calendar, Tag } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';

interface NoteCardProps {
  note: Note;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const removeNote = useAppStore((state) => state.removeNote);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this memory?')) {
      try {
        await db.collection('notes').doc(note.id).delete();
        removeNote(note.id);
      } catch (err) {
        console.error("Failed to delete note", err);
      }
    }
  };

  return (
    <div className="group bg-white border-2 border-black shadow-hard p-5 h-64 flex flex-col hover:-translate-y-1 hover:shadow-hard-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
        {/* Decorative 'tape' or mark */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-100 border-b-2 border-x-2 border-black/10 opacity-50"></div>

        <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-lg leading-tight line-clamp-2">{note.title}</h4>
            <button 
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 border border-transparent hover:border-red-500 transition-all rounded-sm"
            >
                <Trash2 size={16} className="text-red-500" />
            </button>
        </div>

        <div className="flex-grow overflow-hidden relative">
            <p className="font-mono text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {note.content}
            </p>
            {/* Fade out at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="pt-4 mt-2 border-t-2 border-black/5 flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase">
            <div className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(note.createdAt).toLocaleDateString()}
            </div>
            {note.tags && note.tags.length > 0 && (
                 <div className="flex items-center gap-1">
                    <Tag size={10} />
                    {note.tags[0]}
                 </div>
            )}
        </div>
    </div>
  );
};