import { Note } from '../types/note';

export async function getNotes(): Promise<Note[]> {
  const result = await chrome.storage.local.get(['notes']);
  return result.notes || [];
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await chrome.storage.local.set({ notes });
}

export async function addNote(note: Note): Promise<void> {
  const notes = await getNotes();
  notes.unshift(note); // Add to beginning
  await saveNotes(notes);
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const notes = await getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    notes[index] = { ...notes[index], ...updates, updatedAt: new Date() };
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveNotes(filtered);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  if (!firstLine) return 'Untitled Note';

  // Remove markdown heading syntax
  const title = firstLine.replace(/^#+\s*/, '');

  // Truncate if too long
  return title.length > 50 ? title.substring(0, 50) + '...' : title;
}
