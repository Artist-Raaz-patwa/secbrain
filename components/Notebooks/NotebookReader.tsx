import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Note, Notebook } from '../../types';
import { ArrowLeft, Plus, Save, Sparkles, Trash2, Calendar, Tag } from 'lucide-react';
import { db } from '../../firebase';
import { GeminiService } from '../../services/geminiService';

interface NotebookReaderProps {
    notebook: Notebook;
    onBack: () => void;
}

export const NotebookReader: React.FC<NotebookReaderProps> = ({ notebook, onBack }) => {
    const { user, notes, setNotes, selectedNoteId, setSelectedNoteId, updateNote, addNote, removeNote, settings } = useAppStore();
    const [currentContent, setCurrentContent] = useState('');
    const [currentTitle, setCurrentTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiPromptLoading, setAiPromptLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch pages (Notes) in real-time
    useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('notes')
            .where('notebookId', '==', notebook.id)
            .onSnapshot((snapshot) => {
                const fetched: Note[] = [];
                snapshot.forEach(d => fetched.push({ id: d.id, ...d.data() } as Note));
                fetched.sort((a,b) => b.createdAt - a.createdAt);
                setNotes(fetched);
                
                if (!selectedNoteId && fetched.length > 0) {
                    setSelectedNoteId(fetched[0].id);
                }
            });
            
        return () => unsubscribe();
    }, [notebook.id, user, selectedNoteId]);

    // Sync local state
    useEffect(() => {
        const activeNote = notes.find(n => n.id === selectedNoteId);
        if (activeNote) {
            setCurrentTitle(activeNote.title);
            setCurrentContent(activeNote.content);
        } else {
            setCurrentTitle('');
            setCurrentContent('');
        }
    }, [selectedNoteId]);

    const handleCreatePage = async () => {
        if (!user) return;
        try {
            const newPage = {
                title: notebook.type === 'journal' ? new Date().toLocaleDateString() : 'Untitled Page',
                content: '',
                userId: user.uid,
                notebookId: notebook.id,
                createdAt: Date.now(),
                tags: []
            };
            const ref = await db.collection('notes').add(newPage);
            setSelectedNoteId(ref.id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!selectedNoteId || !user) return;
        setIsSaving(true);
        try {
            await db.collection('notes').doc(selectedNoteId).update({
                title: currentTitle,
                content: currentContent
            });
            updateNote(selectedNoteId, { title: currentTitle, content: currentContent });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedNoteId || !confirm('Permanently rip out this page?')) return;
        try {
            await db.collection('notes').doc(selectedNoteId).delete();
            setSelectedNoteId(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAiPrompt = async () => {
        setAiPromptLoading(true);
        const apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) {
            alert('Please set API Key in Settings first.');
            setAiPromptLoading(false);
            return;
        }
        const service = new GeminiService(apiKey);
        const prompt = await service.generateJournalPrompt();
        const newContent = currentContent + (currentContent ? '\n\n' : '') + `**AI REFLECTION:** ${prompt}\n\n`;
        setCurrentContent(newContent);
        setAiPromptLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    return (
        <div className="fixed inset-0 z-50 bg-neutral-900/90 dark:bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="w-full max-w-6xl flex justify-between items-center text-white mb-6 animate-in slide-in-from-top-4 duration-500">
                <button onClick={onBack} className="group flex items-center gap-3 font-display uppercase tracking-widest text-sm hover:text-gray-300 transition-colors">
                    <div className="bg-white text-black p-1 rounded-sm group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft size={16} />
                    </div>
                    BACK_TO_SHELF
                </button>
                <div className="font-black font-display text-2xl tracking-widest border-b-2 border-white pb-1">{notebook.title.toUpperCase()}</div>
                <div className="w-24"></div> 
            </div>

            {/* The Book Container */}
            <div className="w-full max-w-6xl h-[85vh] bg-white dark:bg-neutral-900 flex shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border-r-[16px] border-b-[16px] border-black dark:border-neutral-800 relative animate-in zoom-in-95 duration-500">
                
                {/* Left Panel: Index */}
                <div className="w-1/3 md:w-64 bg-gray-50 dark:bg-neutral-800 border-r-2 border-gray-200 dark:border-neutral-700 flex flex-col z-20">
                    <div className="p-5 border-b border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex justify-between items-center">
                        <h3 className="font-display font-bold text-xs tracking-widest text-gray-500 dark:text-gray-400">TABLE_OF_CONTENTS</h3>
                        <button onClick={handleCreatePage} className="p-1.5 bg-black text-white dark:bg-white dark:text-black hover:scale-105 transition-transform shadow-sm">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow p-3 space-y-2 custom-scrollbar">
                        {notes.map(note => (
                            <div 
                                key={note.id}
                                onClick={() => setSelectedNoteId(note.id)}
                                className={`p-3 font-mono text-xs cursor-pointer border-l-4 transition-all relative group
                                    ${selectedNoteId === note.id 
                                        ? 'border-black dark:border-white bg-white dark:bg-neutral-900 text-black dark:text-white shadow-md' 
                                        : 'border-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400'}
                                `}
                            >
                                <div className="font-bold truncate">{note.title || 'Untitled'}</div>
                                <div className="flex items-center gap-2 mt-1 opacity-50 text-[10px]">
                                    <Calendar size={10} />
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {notes.length === 0 && (
                            <div className="p-8 text-center text-gray-400 font-mono text-xs italic opacity-50">
                                This notebook is empty.<br/>Start writing.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Content */}
                <div className="flex-1 flex flex-col relative bg-white dark:bg-neutral-900">
                    {/* Page Binding Shadow / Gradient for depth */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/5 dark:from-black/50 to-transparent pointer-events-none z-10"></div>

                    {selectedNoteId ? (
                        <>
                            <div className="p-8 md:p-12 lg:px-16 flex-grow flex flex-col relative h-full overflow-hidden">
                                {/* Top Metadata */}
                                <div className="flex justify-between items-center mb-6 z-20 opacity-50 font-mono text-[10px] uppercase tracking-wider">
                                    <span>ENTRY ID: {selectedNoteId.substring(0,8)}</span>
                                    <span>{new Date().toLocaleTimeString()}</span>
                                </div>

                                {/* Title Line */}
                                <input 
                                    value={currentTitle}
                                    onChange={(e) => setCurrentTitle(e.target.value)}
                                    className="w-full text-4xl font-display font-black text-black dark:text-white border-b-4 border-gray-100 dark:border-neutral-800 focus:border-black dark:focus:border-white outline-none bg-transparent py-4 mb-6 z-20 placeholder:text-gray-300 dark:placeholder:text-gray-700 transition-colors"
                                    placeholder="Untitled Entry"
                                />

                                {/* Ruled Paper Background */}
                                <div className="absolute inset-0 top-40 px-8 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                                     style={{ 
                                         backgroundImage: `linear-gradient(${settings.theme === 'dark' ? '#FFF' : '#000'} 1px, transparent 1px)`, 
                                         backgroundSize: '100% 2.5rem' 
                                     }}>
                                </div>

                                {/* Editor */}
                                <textarea
                                    ref={textareaRef}
                                    value={currentContent}
                                    onChange={(e) => setCurrentContent(e.target.value)}
                                    className="w-full flex-grow resize-none outline-none bg-transparent font-serif text-lg md:text-xl leading-[2.5rem] z-20 text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 selection:bg-yellow-200 dark:selection:bg-blue-900 custom-scrollbar"
                                    placeholder="Record your thoughts..."
                                    style={{ lineHeight: '2.5rem' }}
                                />
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 border-t-2 border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900 z-30">
                                <div className="flex gap-3">
                                    {notebook.type === 'journal' && (
                                        <button 
                                            onClick={handleAiPrompt}
                                            disabled={aiPromptLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-xs font-mono font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 rounded-sm"
                                        >
                                            <Sparkles size={14} className={aiPromptLoading ? "animate-spin" : ""} /> 
                                            {aiPromptLoading ? 'GENERATING...' : 'AI PROMPT'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                     <button 
                                        onClick={handleDelete}
                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-sm"
                                        title="Delete Page"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className={`flex items-center gap-2 px-6 py-2 border-2 border-black dark:border-white font-bold font-display text-xs uppercase tracking-wider text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px] active:shadow-none`}
                                    >
                                        <Save size={14} /> {isSaving ? 'SAVING...' : 'SAVE'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-700 font-mono space-y-4">
                            <ArrowLeft size={48} className="animate-pulse" />
                            <p>SELECT A PAGE FROM THE INDEX</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};