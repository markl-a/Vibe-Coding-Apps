import { create } from 'zustand';
import { VoiceNote } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotesStore {
  notes: VoiceNote[];
  addNote: (note: VoiceNote) => void;
  updateNote: (id: string, updates: Partial<VoiceNote>) => void;
  deleteNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
  loadNotes: () => Promise<void>;
  saveNotes: () => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],

  addNote: (note) => {
    set((state) => ({
      notes: [note, ...state.notes],
    }));
    get().saveNotes();
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
      ),
    }));
    get().saveNotes();
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
    get().saveNotes();
  },

  toggleFavorite: (id) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
      ),
    }));
    get().saveNotes();
  },

  loadNotes: async () => {
    try {
      const stored = await AsyncStorage.getItem('voice_notes');
      if (stored) {
        const notes = JSON.parse(stored);
        // 转换日期字符串为 Date 对象
        const parsedNotes = notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        set({ notes: parsedNotes });
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
    }
  },

  saveNotes: async () => {
    try {
      const { notes } = get();
      await AsyncStorage.setItem('voice_notes', JSON.stringify(notes));
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  },
}));
