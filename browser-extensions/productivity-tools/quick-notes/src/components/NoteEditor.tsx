import React, { useEffect, useRef } from 'react';
import { Note } from '../types/note';

interface Props {
  note: Note;
  onChange: (content: string) => void;
  fontSize: 'small' | 'medium' | 'large';
}

export const NoteEditor: React.FC<Props> = ({ note, onChange, fontSize }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    textareaRef.current?.focus();
  }, []);

  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[fontSize];

  return (
    <div className="flex-1 flex flex-col">
      <textarea
        ref={textareaRef}
        value={note.content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your note... (Markdown supported)"
        className={`flex-1 w-full p-4 border-none outline-none resize-none bg-white dark:bg-gray-900 text-gray-800 dark:text-white ${fontSizeClass} font-mono`}
        spellCheck={true}
      />

      <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border-t border-gray-200 dark:border-gray-700">
        Last saved: {new Date(note.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
};
