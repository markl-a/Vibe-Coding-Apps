using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using WpfNotesApp.Models;

namespace WpfNotesApp.Services
{
    public class NoteService
    {
        private readonly string _dataPath;

        public NoteService()
        {
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var appFolder = Path.Combine(appDataPath, "WpfNotesApp");
            Directory.CreateDirectory(appFolder);
            _dataPath = Path.Combine(appFolder, "notes.json");
        }

        public List<Note> LoadNotes()
        {
            try
            {
                if (File.Exists(_dataPath))
                {
                    var json = File.ReadAllText(_dataPath);
                    var notes = JsonConvert.DeserializeObject<List<Note>>(json);
                    return notes ?? new List<Note>();
                }
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    $"載入筆記時發生錯誤：{ex.Message}",
                    "錯誤",
                    System.Windows.MessageBoxButton.OK,
                    System.Windows.MessageBoxImage.Error);
            }

            return new List<Note>();
        }

        public void SaveNotes(List<Note> notes)
        {
            try
            {
                var json = JsonConvert.SerializeObject(notes, Formatting.Indented);
                File.WriteAllText(_dataPath, json);
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show(
                    $"儲存筆記時發生錯誤：{ex.Message}",
                    "錯誤",
                    System.Windows.MessageBoxButton.OK,
                    System.Windows.MessageBoxImage.Error);
            }
        }

        public string GetDataPath()
        {
            return _dataPath;
        }
    }
}
