import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../firebase';
import { Notebook } from '../../types';
import { NoirButton } from '../ui/NoirButton';
import { Plus, Book, Settings } from 'lucide-react';
import { NotebookReader } from './NotebookReader';
import { EditNotebookModal } from './EditNotebookModal';

export const NotebookShelf: React.FC = () => {
    const { user, notebooks, setNotebooks, setNotebookModalOpen, selectedNotebookId, setSelectedNotebookId } = useAppStore();
    const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('notebooks')
            .where('userId', '==', user.uid)
            .onSnapshot((snapshot) => {
                const fetched: Notebook[] = [];
                snapshot.forEach(d => fetched.push({ id: d.id, ...d.data() } as Notebook));
                // Client sort
                fetched.sort((a,b) => b.createdAt - a.createdAt);
                setNotebooks(fetched);
            }, (error) => {
                console.error("Error fetching notebooks:", error);
            });
            
        return () => unsubscribe();
    }, [user, setNotebooks]);

    const activeNotebook = notebooks.find(n => n.id === selectedNotebookId);

    if (activeNotebook) {
        return <NotebookReader notebook={activeNotebook} onBack={() => setSelectedNotebookId(null)} />;
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-4">
                <h2 className="text-3xl font-display font-black uppercase tracking-tighter text-black dark:text-white">My Bookshelf</h2>
                <NoirButton onClick={() => setNotebookModalOpen(true)}>
                    <div className="flex items-center gap-2">
                        <Plus size={18} />
                        <span>BIND NEW BOOK</span>
                    </div>
                </NoirButton>
            </div>

            {notebooks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 font-mono">
                    <Book size={48} className="mb-4 opacity-20" />
                    <p>SHELF EMPTY</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 px-4">
                    {notebooks.map(notebook => (
                        <div 
                            key={notebook.id}
                            className="group perspective-1000 relative"
                        >
                            {/* 3D Notebook Component */}
                            <div 
                                onClick={() => setSelectedNotebookId(notebook.id)}
                                className={`
                                    cursor-pointer relative h-72 w-full transition-all duration-300 transform-style-3d group-hover:-translate-y-4 group-hover:rotate-y-[-10deg]
                                    ${notebook.coverColor === 'black' ? 'bg-neutral-900 text-white dark:border-white' : 'bg-white text-black'}
                                    border-4 border-black
                                    shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)]
                                    dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]
                                    flex flex-col
                                `}
                            >
                                {/* Spine */}
                                <div className="absolute top-0 bottom-0 left-0 w-6 bg-black dark:bg-neutral-800 border-r border-gray-700 z-10"></div>
                                
                                {/* Label Area */}
                                <div className="ml-8 mt-8 mr-4 p-4 border-2 border-current flex-grow flex flex-col items-center justify-center text-center">
                                    <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">
                                        {notebook.type === 'journal' ? 'DAILY LOG' : 'NOTEBOOK'}
                                    </span>
                                    <h3 className="font-display font-bold text-xl leading-tight line-clamp-3">
                                        {notebook.title}
                                    </h3>
                                </div>

                                {/* Footer decoration */}
                                <div className="ml-6 p-4 flex justify-between items-end opacity-50">
                                    <div className="w-8 h-8 border border-current rounded-full flex items-center justify-center font-mono text-xs">
                                        {notebook.type === 'journal' ? 'J' : 'N'}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="w-12 h-0.5 bg-current"></div>
                                        <div className="w-8 h-0.5 bg-current ml-auto"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Edit Button (Absolute outside the rotate container) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingNotebook(notebook); }}
                                className="absolute top-2 right-2 z-20 bg-white text-black dark:bg-black dark:text-white p-1.5 border border-black dark:border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                            >
                                <Settings size={14} />
                            </button>

                            {/* Shelf Shadow */}
                            <div className="absolute -bottom-8 left-2 right-2 h-4 bg-black/10 dark:bg-white/10 rounded-full blur-md group-hover:scale-90 transition-all"></div>
                        </div>
                    ))}
                </div>
            )}
            
            {editingNotebook && (
                <EditNotebookModal notebook={editingNotebook} onClose={() => setEditingNotebook(null)} />
            )}
        </div>
    );
};