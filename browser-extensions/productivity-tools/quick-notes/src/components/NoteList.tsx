import React from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { Note } from '../types/note';

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const NoteList: React.FC<Props> = ({ notes, selectedId, onSelect, onDelete, onTogglePin }) => {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return d.toLocaleDateString();
    }
  };

  const getPreview = (content: string) => {
    // Remove title (first line)
    const lines = content.split('\n');
    const preview = lines.slice(1).join(' ').trim();
    return preview.substring(0, 100) || 'No content';
  };

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No notes yet. Start typing to create one!
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <div className="mb-2">
              {pinnedNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                  formatDate={formatDate}
                  getPreview={getPreview}
                />
              ))}
            </div>
          )}

          {unpinnedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              formatDate={formatDate}
              getPreview={getPreview}
            />
          ))}
        </>
      )}
    </div>
  );
};

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  formatDate: (date: Date) => string;
  getPreview: (content: string) => string;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onTogglePin,
  formatDate,
  getPreview,
}) => {
  return (
    <div
      className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onSelect(note.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.pinned && <Pin size={14} className="text-yellow-500 fill-yellow-500" />}
            <h3 className="font-semibold text-gray-800 dark:text-white truncate">
              {note.title}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {getPreview(note.content)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDate(note.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              note.pinned ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Pin size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
