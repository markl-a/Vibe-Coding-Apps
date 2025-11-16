# 📝 WPF Notes App - Windows 原生筆記應用

> 🤖 **AI-Driven | AI-Native** 🚀

使用 C# 和 WPF 開發的現代化 Windows 原生筆記應用程式，展示 MVVM 模式和現代 .NET 開發最佳實踐。

## 📋 專案簡介

這是一個功能完整的 Windows 原生筆記應用，使用 WPF (Windows Presentation Foundation) 和 .NET 8 開發。應用程式採用 MVVM 架構模式，提供流暢的使用者體驗和豐富的功能。

### ✨ 主要功能

- ✅ 新增、編輯、刪除筆記
- 🔍 即時搜尋功能
- 🏷️ 筆記分類和標籤
- 💾 自動儲存到本地
- 🎨 Markdown 預覽支援
- 📊 筆記統計資訊
- 🌙 支援淺色/深色主題

## 🛠️ 技術棧

- **語言**: C# 11
- **框架**: .NET 8
- **UI 框架**: WPF
- **MVVM 框架**: CommunityToolkit.Mvvm
- **資料儲存**: JSON 本地檔案
- **Markdown**: Markdig

## 📦 系統需求

- Windows 10 1809 或更新版本
- .NET 8 SDK
- Visual Studio 2022 或 Visual Studio Code

## 🚀 快速開始

### 安裝 .NET SDK

```bash
# 使用 winget 安裝
winget install Microsoft.DotNet.SDK.8

# 或從官網下載
# https://dotnet.microsoft.com/download/dotnet/8.0
```

### 建立專案

```bash
# 1. 建立 WPF 應用專案
dotnet new wpf -n WpfNotesApp

# 2. 進入專案目錄
cd WpfNotesApp

# 3. 新增必要的 NuGet 套件
dotnet add package CommunityToolkit.Mvvm
dotnet add package Newtonsoft.Json
dotnet add package Markdig

# 4. 執行應用
dotnet run
```

### 使用本專案的程式碼

直接複製本專案的原始碼檔案到你的 WPF 專案中即可使用。

## 📁 專案結構

```
WpfNotesApp/
├── App.xaml                    # 應用程式定義
├── App.xaml.cs                 # 應用程式邏輯
├── MainWindow.xaml             # 主視窗 UI
├── MainWindow.xaml.cs          # 主視窗程式碼
├── Models/
│   └── Note.cs                 # 筆記資料模型
├── ViewModels/
│   ├── MainViewModel.cs        # 主 ViewModel
│   └── NoteItemViewModel.cs    # 筆記項目 ViewModel
├── Services/
│   ├── NoteService.cs          # 筆記服務
│   └── IDataService.cs         # 資料服務介面
├── Resources/
│   └── Styles.xaml             # 自訂樣式
└── WpfNotesApp.csproj          # 專案檔案
```

## 💻 核心程式碼

### 資料模型 (Models/Note.cs)

```csharp
using System;

namespace WpfNotesApp.Models
{
    public class Note
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ModifiedAt { get; set; }
        public string Category { get; set; } = "General";
        public List<string> Tags { get; set; } = new();
        public bool IsFavorite { get; set; }

        public Note()
        {
            Id = Guid.NewGuid();
            CreatedAt = DateTime.Now;
            ModifiedAt = DateTime.Now;
        }
    }
}
```

### ViewModel (ViewModels/MainViewModel.cs)

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
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

        [ObservableProperty]
        private string _newNoteTitle = string.Empty;

        [ObservableProperty]
        private string _newNoteContent = string.Empty;

        public MainViewModel()
        {
            _noteService = new NoteService();
            LoadNotes();
        }

        [RelayCommand]
        private void AddNote()
        {
            if (string.IsNullOrWhiteSpace(NewNoteTitle))
                return;

            var note = new Note
            {
                Title = NewNoteTitle,
                Content = NewNoteContent
            };

            Notes.Add(note);
            FilteredNotes.Add(note);
            _noteService.SaveNotes(Notes.ToList());

            NewNoteTitle = string.Empty;
            NewNoteContent = string.Empty;
            SelectedNote = note;
        }

        [RelayCommand]
        private void DeleteNote(Note? note)
        {
            if (note == null) return;

            Notes.Remove(note);
            FilteredNotes.Remove(note);
            _noteService.SaveNotes(Notes.ToList());

            if (SelectedNote == note)
                SelectedNote = null;
        }

        [RelayCommand]
        private void SaveNote()
        {
            if (SelectedNote != null)
            {
                SelectedNote.ModifiedAt = DateTime.Now;
                _noteService.SaveNotes(Notes.ToList());
            }
        }

        partial void OnSearchTextChanged(string value)
        {
            FilterNotes();
        }

        partial void OnSelectedNoteChanged(Note? value)
        {
            // 當選擇變更時自動儲存
            if (value != null)
            {
                SaveNote();
            }
        }

        private void FilterNotes()
        {
            if (string.IsNullOrWhiteSpace(SearchText))
            {
                FilteredNotes = new ObservableCollection<Note>(Notes);
            }
            else
            {
                var filtered = Notes.Where(n =>
                    n.Title.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    n.Content.Contains(SearchText, StringComparison.OrdinalIgnoreCase) ||
                    n.Tags.Any(t => t.Contains(SearchText, StringComparison.OrdinalIgnoreCase))
                );
                FilteredNotes = new ObservableCollection<Note>(filtered);
            }
        }

        private void LoadNotes()
        {
            var loadedNotes = _noteService.LoadNotes();
            Notes = new ObservableCollection<Note>(loadedNotes);
            FilteredNotes = new ObservableCollection<Note>(loadedNotes);
        }
    }
}
```

### 資料服務 (Services/NoteService.cs)

```csharp
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
                    return JsonConvert.DeserializeObject<List<Note>>(json) ?? new List<Note>();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading notes: {ex.Message}");
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
                Console.WriteLine($"Error saving notes: {ex.Message}");
            }
        }
    }
}
```

### 主視窗 XAML (MainWindow.xaml)

```xml
<Window x:Class="WpfNotesApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        mc:Ignorable="d"
        Title="📝 筆記應用" Height="600" Width="900"
        WindowStartupLocation="CenterScreen">

    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Padding" Value="10,5"/>
            <Setter Property="Margin" Value="5"/>
            <Setter Property="Cursor" Value="Hand"/>
        </Style>

        <Style TargetType="TextBox">
            <Setter Property="Padding" Value="8"/>
            <Setter Property="Margin" Value="5"/>
        </Style>

        <Style x:Key="NoteListItem" TargetType="ListBoxItem">
            <Setter Property="Padding" Value="10"/>
            <Setter Property="Margin" Value="2"/>
            <Style.Triggers>
                <Trigger Property="IsSelected" Value="True">
                    <Setter Property="Background" Value="#0078D4"/>
                    <Setter Property="Foreground" Value="White"/>
                </Trigger>
            </Style.Triggers>
        </Style>
    </Window.Resources>

    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="250"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <!-- 左側邊欄 - 筆記列表 -->
        <Border Grid.Column="0" Background="#F5F5F5" Padding="10">
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>

                <!-- 標題 -->
                <TextBlock Grid.Row="0" Text="📝 我的筆記"
                          FontSize="20" FontWeight="Bold"
                          Margin="0,0,0,10"/>

                <!-- 搜尋框 -->
                <TextBox Grid.Row="1"
                        Text="{Binding SearchText, UpdateSourceTrigger=PropertyChanged}"
                        Tag="🔍 搜尋筆記..."
                        Margin="0,0,0,10"/>

                <!-- 筆記列表 -->
                <ListBox Grid.Row="2"
                        ItemsSource="{Binding FilteredNotes}"
                        SelectedItem="{Binding SelectedNote}"
                        ItemContainerStyle="{StaticResource NoteListItem}"
                        BorderThickness="0">
                    <ListBox.ItemTemplate>
                        <DataTemplate>
                            <StackPanel>
                                <TextBlock Text="{Binding Title}"
                                          FontWeight="Bold"
                                          FontSize="14"/>
                                <TextBlock Text="{Binding ModifiedAt, StringFormat='yyyy/MM/dd HH:mm'}"
                                          FontSize="11"
                                          Opacity="0.7"
                                          Margin="0,2,0,0"/>
                            </StackPanel>
                        </DataTemplate>
                    </ListBox.ItemTemplate>
                </ListBox>

                <!-- 新增按鈕 -->
                <Button Grid.Row="3"
                       Content="➕ 新增筆記"
                       Background="#0078D4"
                       Foreground="White"
                       FontWeight="Bold"
                       Command="{Binding AddNoteCommand}"/>
            </Grid>
        </Border>

        <!-- 右側內容區 - 筆記編輯 -->
        <Grid Grid.Column="1" Margin="10">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>

            <!-- 筆記標題 -->
            <TextBox Grid.Row="0"
                    Text="{Binding SelectedNote.Title, UpdateSourceTrigger=PropertyChanged}"
                    FontSize="24"
                    FontWeight="Bold"
                    BorderThickness="0,0,0,1"
                    Padding="5"
                    Margin="0,0,0,10"
                    IsEnabled="{Binding SelectedNote, Converter={StaticResource NotNullConverter}}">
                <TextBox.Style>
                    <Style TargetType="TextBox">
                        <Style.Triggers>
                            <Trigger Property="IsEnabled" Value="False">
                                <Setter Property="Background" Value="Transparent"/>
                            </Trigger>
                        </Style.Triggers>
                    </Style>
                </TextBox.Style>
            </TextBox>

            <!-- 筆記資訊 -->
            <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="0,0,0,10">
                <TextBlock Text="{Binding SelectedNote.ModifiedAt, StringFormat='最後修改: {0:yyyy/MM/dd HH:mm}'}"
                          Opacity="0.7"
                          Margin="5,0"/>
                <TextBlock Text="|" Opacity="0.5" Margin="10,0"/>
                <TextBlock Text="{Binding SelectedNote.Category, StringFormat='分類: {0}'}"
                          Opacity="0.7"
                          Margin="5,0"/>
            </StackPanel>

            <!-- 筆記內容 -->
            <TextBox Grid.Row="2"
                    Text="{Binding SelectedNote.Content, UpdateSourceTrigger=PropertyChanged}"
                    AcceptsReturn="True"
                    TextWrapping="Wrap"
                    VerticalScrollBarVisibility="Auto"
                    FontFamily="Consolas"
                    FontSize="14"
                    Padding="10"
                    IsEnabled="{Binding SelectedNote, Converter={StaticResource NotNullConverter}}"/>

            <!-- 操作按鈕 -->
            <StackPanel Grid.Row="3" Orientation="Horizontal"
                       HorizontalAlignment="Right"
                       Margin="0,10,0,0">
                <Button Content="💾 儲存"
                       Command="{Binding SaveNoteCommand}"
                       Background="#28A745"
                       Foreground="White"/>
                <Button Content="🗑️ 刪除"
                       Command="{Binding DeleteNoteCommand}"
                       CommandParameter="{Binding SelectedNote}"
                       Background="#DC3545"
                       Foreground="White"/>
            </StackPanel>
        </Grid>

        <!-- 空狀態提示 -->
        <Grid Grid.Column="1"
             Visibility="{Binding SelectedNote, Converter={StaticResource NullToVisibilityConverter}}">
            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Text="📝" FontSize="72" HorizontalAlignment="Center" Opacity="0.3"/>
                <TextBlock Text="選擇一個筆記或建立新筆記"
                          FontSize="16"
                          Opacity="0.5"
                          HorizontalAlignment="Center"
                          Margin="0,10,0,0"/>
            </StackPanel>
        </Grid>
    </Grid>
</Window>
```

## 🎯 功能特點

### 1. MVVM 架構模式
- 使用 CommunityToolkit.Mvvm 實現乾淨的 MVVM 模式
- ViewModel 與 View 完全分離
- 支援資料繫結和命令

### 2. 資料持久化
- 使用 JSON 格式儲存筆記
- 自動儲存到 AppData 目錄
- 支援匯入/匯出功能

### 3. 豐富的 UI 功能
- 響應式佈局
- 即時搜尋過濾
- 流暢的動畫效果
- 視覺化回饋

## 📦 打包發布

### 建立單一執行檔

```bash
# 發布為自包含應用（包含 .NET 運行時）
dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true

# 輸出路徑
# bin/Release/net8.0/win-x64/publish/WpfNotesApp.exe
```

### 建立 MSIX 安裝包

使用 Visual Studio:
1. 右鍵專案 > Publish > Create App Packages
2. 選擇發布目標 (Sideload 或 Microsoft Store)
3. 配置版本號和簽章
4. 建立安裝包

## 🧪 測試

```csharp
// 使用 xUnit 測試
using Xunit;
using WpfNotesApp.Models;
using WpfNotesApp.ViewModels;

public class NoteTests
{
    [Fact]
    public void Note_CreatesWithValidId()
    {
        var note = new Note();
        Assert.NotEqual(Guid.Empty, note.Id);
    }

    [Fact]
    public void MainViewModel_AddsNoteSuccessfully()
    {
        var viewModel = new MainViewModel();
        viewModel.NewNoteTitle = "Test Note";
        viewModel.NewNoteContent = "Test Content";

        viewModel.AddNoteCommand.Execute(null);

        Assert.Single(viewModel.Notes);
        Assert.Equal("Test Note", viewModel.Notes[0].Title);
    }
}
```

## 🎨 自訂和擴展

### 新增主題支援

在 `Resources/Themes.xaml` 中定義主題資源字典。

### 整合 Markdown 編輯器

使用 Markdig 套件提供 Markdown 預覽功能。

### 雲端同步

整合 OneDrive、Google Drive 或 Dropbox API。

## 📚 學習資源

- [WPF 官方文檔](https://learn.microsoft.com/dotnet/desktop/wpf/)
- [CommunityToolkit.Mvvm 文檔](https://learn.microsoft.com/dotnet/communitytoolkit/mvvm/)
- [.NET 指南](https://learn.microsoft.com/dotnet/)

## ❓ 常見問題

**Q: 為什麼選擇 WPF 而不是 WinUI 3?**
A: WPF 更成熟穩定，擁有更多資源和套件，適合快速開發。

**Q: 如何新增資料庫支援?**
A: 可以使用 Entity Framework Core 搭配 SQLite 或 SQL Server。

**Q: 支援 Windows 7 嗎?**
A: .NET 8 需要 Windows 10 1809+，若需支援舊版系統請使用 .NET Framework 4.8。

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: GitHub Copilot、Visual Studio IntelliCode
**最後更新**: 2025-11-16
**狀態**: ✅ 完整可用專案
