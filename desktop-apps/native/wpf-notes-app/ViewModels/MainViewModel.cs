using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using WpfNotesApp.Models;
using WpfNotesApp.Services;

namespace WpfNotesApp.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly NoteService _noteService;

        [ObservableProperty]
        private ObservableCollection<Note> _notes = new();

        [ObservableProperty]
        private ObservableCollection<Note> _filteredNotes = new();

        [ObservableProperty]
        private Note? _selectedNote;

        [ObservableProperty]
        private string _searchText = string.Empty;

        public MainViewModel()
        {
            _noteService = new NoteService();
            LoadNotes();
        }

        [RelayCommand]
        private void AddNote()
        {
            var note = new Note
            {
                Title = "新筆記",
                Content = "開始寫下你的想法..."
            };

            Notes.Add(note);
            FilteredNotes.Add(note);
            SelectedNote = note;

            _noteService.SaveNotes(Notes.ToList());
        }

        [RelayCommand]
        private void DeleteNote(Note? note)
        {
            if (note == null) return;

            var result = System.Windows.MessageBox.Show(
                $"確定要刪除筆記「{note.Title}」嗎？",
                "確認刪除",
                System.Windows.MessageBoxButton.YesNo,
                System.Windows.MessageBoxImage.Question);

            if (result == System.Windows.MessageBoxResult.Yes)
            {
                Notes.Remove(note);
                FilteredNotes.Remove(note);
                _noteService.SaveNotes(Notes.ToList());

                if (SelectedNote == note)
                {
                    SelectedNote = FilteredNotes.FirstOrDefault();
                }
            }
        }

        [RelayCommand]
        private void SaveNote()
        {
            if (SelectedNote != null)
            {
                SelectedNote.UpdateModifiedTime();
                _noteService.SaveNotes(Notes.ToList());

                System.Windows.MessageBox.Show(
                    "筆記已儲存！",
                    "儲存成功",
                    System.Windows.MessageBoxButton.OK,
                    System.Windows.MessageBoxImage.Information);
            }
        }

        partial void OnSearchTextChanged(string value)
        {
            FilterNotes();
        }

        partial void OnSelectedNoteChanged(Note? oldValue, Note? newValue)
        {
            // 當切換選擇時，自動儲存前一個筆記
            if (oldValue != null)
            {
                oldValue.UpdateModifiedTime();
                _noteService.SaveNotes(Notes.ToList());
            }
        }

        private void FilterNotes()
        {
            if (string.IsNullOrWhiteSpace(SearchText))
            {
                FilteredNotes = new ObservableCollection<Note>(Notes.OrderByDescending(n => n.ModifiedAt));
            }
            else
            {
                var filtered = Notes.Where(n =>
                    n.Title.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    n.Content.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    n.Tags.Any(t => t.Contains(SearchText, StringComparison.OrdinalIgnoreCase))
                ).OrderByDescending(n => n.ModifiedAt);

                FilteredNotes = new ObservableCollection<Note>(filtered);
            }
        }

        private void LoadNotes()
        {
            var loadedNotes = _noteService.LoadNotes();

            if (loadedNotes.Count == 0)
            {
                // 新增歡迎筆記
                var welcomeNote = new Note
                {
                    Title = "歡迎使用 WPF 筆記應用！",
                    Content = @"這是一個使用 C# 和 WPF 開發的原生 Windows 筆記應用。

主要功能：
• 新增、編輯、刪除筆記
• 即時搜尋功能
• 自動儲存
• 簡潔美觀的介面

快速開始：
1. 點擊左下角的「➕ 新增筆記」按鈕
2. 在右側編輯器中輸入標題和內容
3. 點擊「💾 儲存」按鈕儲存筆記
4. 使用搜尋框快速找到你的筆記

技術特點：
- MVVM 架構模式
- 資料繫結與命令
- JSON 本地儲存
- 流暢的 UI 體驗

開始記錄你的想法吧！",
                    Category = "系統"
                };
                loadedNotes.Add(welcomeNote);
                _noteService.SaveNotes(loadedNotes);
            }

            Notes = new ObservableCollection<Note>(loadedNotes.OrderByDescending(n => n.ModifiedAt));
            FilteredNotes = new ObservableCollection<Note>(Notes);
            SelectedNote = FilteredNotes.FirstOrDefault();
        }
    }
}
