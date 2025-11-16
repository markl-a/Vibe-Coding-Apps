import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { NoteEditor } from '../components/NoteEditor';
import { NoteList } from '../components/NoteList';
import { Note, DEFAULT_SETTINGS } from '../types/note';
import { getNotes, saveNotes, generateId, extractTitle } from '../utils/storage';

type ViewMode = 'list' | 'editor';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [settings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const loadedNotes = await getNotes();
    setNotes(loadedNotes);
    if (loadedNotes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(loadedNotes[0].id);
      setViewMode('editor');
    }
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      tags: [],
    };

    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setViewMode('editor');
  };

  const updateNoteContent = useCallback((noteId: string, content: string) => {
    setNotes(prevNotes => {
      const updated = prevNotes.map(note =>
        note.id === noteId
          ? {
              ...note,
              content,
              title: extractTitle(content),
              updatedAt: new Date(),
            }
          : note
      );
      // Save to storage
      saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await saveNotes(updated);

    if (selectedNoteId === id) {
      setSelectedNoteId(updated[0]?.id || null);
      setViewMode(updated.length > 0 ? 'editor' : 'list');
    }
  };

  const togglePin = async (id: string) => {
    const updated = notes.map(note =>
      note.id === id ? { ...note, pinned: !note.pinned } : note
    );
    setNotes(updated);
    await saveNotes(updated);
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="w-[700px] h-[600px] bg-white dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
            📝 Quick Notes
          </h1>

          <button
            onClick={createNewNote}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} />
            New Note
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <NoteList
            notes={filteredNotes}
            selectedId={selectedNoteId}
            onSelect={(id) => {
              setSelectedNoteId(id);
              setViewMode('editor');
            }}
            onDelete={deleteNote}
            onTogglePin={togglePin}
          />
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onChange={(content) => updateNoteContent(selectedNote.id, content)}
            fontSize={settings.fontSize}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg">No note selected</p>
              <button
                onClick={createNewNote}
                className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
