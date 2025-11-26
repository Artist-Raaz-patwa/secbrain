import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Trash2, Activity } from 'lucide-react';
import { db } from '../../firebase';

interface Props {
  onClose: () => void;
}

export const ManageHabitsModal: React.FC<Props> = ({ onClose }) => {
  const { habits } = useAppStore();

  const handleDelete = async (id: string) => {
    if(confirm('Permanently delete this habit tracker? All progress history will be retained in raw logs but the tracker will be removed.')) {
        try {
            await db.collection('habits').doc(id).delete();
        } catch (e) {
            console.error("Failed to delete habit", e);
            alert("Could not delete habit. Check console.");
        }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-md border-4 border-black dark:border-white shadow-hard-lg dark:shadow-hard-lg-white relative">
            <div className="bg-black dark:bg-white text-white dark:text-black p-4 flex justify-between items-center border-b-2 border-black dark:border-white">
                <h3 className="font-mono font-bold flex items-center gap-2">
                    <Activity size={18} /> MANAGE_TRACKERS
                </h3>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-dots-sm">
                {habits.length === 0 ? (
                    <div className="text-center text-gray-400 font-mono py-8 border-2 border-dashed border-gray-300 dark:border-neutral-700">
                        NO ACTIVE TRACKERS
                    </div>
                ) : (
                    habits.map(habit => (
                        <div key={habit.id} className="flex justify-between items-center p-4 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-hard-sm dark:shadow-hard-sm-white">
                            <span className="font-display font-bold uppercase tracking-wide">{habit.title}</span>
                            <button 
                                onClick={() => handleDelete(habit.id)} 
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-all"
                                title="Delete Tracker"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t-2 border-black dark:border-white bg-gray-50 dark:bg-neutral-800 text-center">
                <p className="font-mono text-[10px] text-gray-500">DELETING A TRACKER DOES NOT DELETE HISTORICAL LOGS.</p>
            </div>
        </div>
    </div>
  )
}