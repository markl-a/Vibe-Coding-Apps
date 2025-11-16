export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  tags: string[];
}

export interface NotesSettings {
  autoSaveDelay: number; // milliseconds
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  syncEnabled: boolean;
  defaultExportFormat: 'txt' | 'md' | 'html';
}

export const DEFAULT_SETTINGS: NotesSettings = {
  autoSaveDelay: 1000,
  theme: 'auto',
  fontSize: 'medium',
  syncEnabled: true,
  defaultExportFormat: 'md',
};
