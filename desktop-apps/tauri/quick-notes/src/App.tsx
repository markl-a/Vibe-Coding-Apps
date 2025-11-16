import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface NoteMetadata {
  id: string;
  title: string;
  updated_at: number;
}

function App() {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 載入筆記列表
  useEffect(() => {
    loadNotesList();
  }, []);

  const loadNotesList = async () => {
    try {
      const notesList = await invoke<NoteMetadata[]>('get_notes_list');
      setNotes(notesList);
    } catch (error) {
      console.error('Failed to load notes list:', error);
    }
  };

  // 載入特定筆記
  const loadNote = async (id: string) => {
    try {
      setIsLoading(true);
      const note = await invoke<Note>('load_note', { id });
      setCurrentNote(note);
    } catch (error) {
      console.error('Failed to load note:', error);
      alert('載入筆記失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 新增筆記
  const createNewNote = async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '新筆記',
      content: '',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      await invoke('save_note', {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        createdAt: newNote.created_at,
        updatedAt: newNote.updated_at,
      });

      setCurrentNote(newNote);
      await loadNotesList();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('建立筆記失敗');
    }
  };

  // 儲存筆記
  const saveNote = async () => {
    if (!currentNote) return;

    try {
      const updatedNote = {
        ...currentNote,
        updated_at: Date.now(),
      };

      await invoke('save_note', {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        createdAt: updatedNote.created_at,
        updatedAt: updatedNote.updated_at,
      });

      setCurrentNote(updatedNote);
      await loadNotesList();
      alert('筆記已儲存');
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('儲存筆記失敗');
    }
  };

  // 刪除筆記
  const deleteNote = async () => {
    if (!currentNote) return;

    if (!confirm('確定要刪除這篇筆記嗎？')) return;

    try {
      await invoke('delete_note', { id: currentNote.id });
      setCurrentNote(null);
      await loadNotesList();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('刪除筆記失敗');
    }
  };

  // 更新筆記標題
  const updateTitle = (title: string) => {
    if (currentNote) {
      setCurrentNote({ ...currentNote, title });
    }
  };

  // 更新筆記內容
  const updateContent = (content: string) => {
    if (currentNote) {
      setCurrentNote({ ...currentNote, content });
    }
  };

  // 格式化時間
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  };

  // 過濾筆記
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗒️ Quick Notes</h1>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="搜尋筆記..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={createNewNote}>
            ➕ 新增筆記
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* 筆記列表 */}
        <aside className="notes-sidebar">
          <h2>所有筆記 ({filteredNotes.length})</h2>
          <div className="notes-list">
            {filteredNotes.length === 0 ? (
              <div className="empty-state">
                <p>還沒有筆記</p>
                <p>點擊「新增筆記」開始</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => loadNote(note.id)}
                >
                  <div className="note-title">{note.title || '無標題'}</div>
                  <div className="note-time">{formatTime(note.updated_at)}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 編輯區域 */}
        <main className="editor-area">
          {isLoading ? (
            <div className="loading">載入中...</div>
          ) : currentNote ? (
            <>
              <div className="editor-header">
                <input
                  type="text"
                  className="title-input"
                  placeholder="筆記標題"
                  value={currentNote.title}
                  onChange={(e) => updateTitle(e.target.value)}
                />
                <div className="editor-actions">
                  <button className="btn btn-success" onClick={saveNote}>
                    💾 儲存
                  </button>
                  <button className="btn btn-danger" onClick={deleteNote}>
                    🗑️ 刪除
                  </button>
                </div>
              </div>
              <textarea
                className="content-textarea"
                placeholder="開始寫筆記..."
                value={currentNote.content}
                onChange={(e) => updateContent(e.target.value)}
              />
              <div className="editor-footer">
                最後修改: {new Date(currentNote.updated_at).toLocaleString('zh-TW')}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>選擇一篇筆記開始編輯</h2>
              <p>或點擊「新增筆記」建立新的筆記</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
