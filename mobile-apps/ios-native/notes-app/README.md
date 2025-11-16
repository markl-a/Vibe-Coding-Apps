# SwiftUI 筆記應用

一個使用 SwiftUI 和 SwiftData 打造的現代化筆記應用，支援富文本編輯、資料夾分類、標籤系統、搜尋功能等完整特性。

## 功能特色

- 📝 **富文本編輯** - 支援 Markdown 格式和富文本編輯
- 📁 **資料夾管理** - 使用資料夾組織筆記
- 🏷️ **標籤系統** - 使用標籤快速分類和搜尋
- 🔍 **全文搜尋** - 快速搜尋筆記標題和內容
- ⭐ **我的最愛** - 標記重要筆記
- 🎨 **顏色標記** - 為筆記設定不同顏色
- 📌 **置頂功能** - 將重要筆記置頂顯示
- 💾 **自動儲存** - 即時自動儲存編輯內容
- 🌓 **深色模式** - 完整支援淺色/深色模式
- 📱 **iCloud 同步** - 跨設備同步筆記（SwiftData）
- 🗑️ **垃圾桶** - 刪除的筆記可恢復
- 🔐 **Face ID/Touch ID** - 保護私密筆記

## 核心功能

### 1. 筆記管理
- 創建、編輯、刪除筆記
- 富文本編輯器
- Markdown 預覽
- 自動儲存
- 版本歷史

### 2. 組織系統
- 資料夾層級結構
- 標籤分類
- 顏色標記
- 置頂筆記
- 我的最愛

### 3. 搜尋與篩選
- 全文搜尋
- 按資料夾篩選
- 按標籤篩選
- 按顏色篩選
- 按日期排序

### 4. 資料同步
- SwiftData 本地儲存
- iCloud 雲端同步
- 離線編輯
- 自動衝突解決

## 技術棧

- **語言**: Swift 5.9+
- **框架**: SwiftUI
- **資料庫**: SwiftData (iOS 17+)
- **架構**: MVVM
- **最低版本**: iOS 17.0+
- **同步**: iCloud (CloudKit)
- **搜尋**: SwiftData Queries
- **安全**: LocalAuthentication
- **套件管理**: Swift Package Manager

## 快速開始

### 環境需求

- macOS Sonoma 14.0+
- Xcode 15.0+
- iOS 17.0+ 模擬器或真機

### 運行應用

1. **打開專案**:
   ```bash
   open Package.swift
   ```

2. **配置 iCloud**（可選）:
   - 在 Xcode 中選擇專案
   - 前往 Signing & Capabilities
   - 添加 iCloud capability
   - 啟用 CloudKit

3. **運行應用**:
   - 選擇目標設備
   - 點擊運行按鈕 (⌘R)

### 使用 Xcode 專案

創建完整的 Xcode 專案：

1. 打開 Xcode
2. File > New > Project
3. 選擇 "App" 模板
4. Interface: SwiftUI
5. Storage: SwiftData
6. 將源代碼複製到專案
7. 配置 Capabilities（iCloud、App Groups）
8. 運行應用

## 專案結構

```
notes-app/
├── README.md
├── Package.swift
├── .gitignore
├── Sources/
│   └── NotesApp/
│       ├── NotesAppApp.swift        # 應用入口
│       ├── Models/                  # 資料模型
│       │   ├── Note.swift           # 筆記模型
│       │   ├── Folder.swift         # 資料夾模型
│       │   ├── Tag.swift            # 標籤模型
│       │   └── NoteColor.swift      # 顏色枚舉
│       ├── Views/                   # 視圖組件
│       │   ├── ContentView.swift    # 主視圖
│       │   ├── NoteListView.swift   # 筆記列表
│       │   ├── NoteDetailView.swift # 筆記詳情
│       │   ├── EditorView.swift     # 編輯器
│       │   ├── FolderView.swift     # 資料夾視圖
│       │   └── Components/          # UI 組件
│       │       ├── NoteCard.swift
│       │       ├── FolderCard.swift
│       │       └── TagView.swift
│       ├── Services/                # 服務層
│       │   └── DataService.swift    # 資料服務
│       └── Utilities/               # 工具類
│           ├── Extensions.swift
│           └── Constants.swift
└── Tests/
    └── NotesAppTests/
        └── NoteModelTests.swift
```

## SwiftData 模型

### Note 模型

```swift
import SwiftData
import Foundation

@Model
final class Note {
    var id: UUID
    var title: String
    var content: String
    var createdAt: Date
    var modifiedAt: Date
    var isFavorite: Bool
    var isPinned: Bool
    var color: NoteColor

    @Relationship(deleteRule: .nullify)
    var folder: Folder?

    @Relationship(deleteRule: .cascade)
    var tags: [Tag]

    init(
        title: String = "新筆記",
        content: String = "",
        folder: Folder? = nil,
        tags: [Tag] = [],
        color: NoteColor = .default
    ) {
        self.id = UUID()
        self.title = title
        self.content = content
        self.createdAt = Date()
        self.modifiedAt = Date()
        self.isFavorite = false
        self.isPinned = false
        self.color = color
        self.folder = folder
        self.tags = tags
    }
}
```

### Folder 模型

```swift
import SwiftData
import Foundation

@Model
final class Folder {
    var id: UUID
    var name: String
    var icon: String
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \Note.folder)
    var notes: [Note]

    init(name: String, icon: String = "folder.fill") {
        self.id = UUID()
        self.name = name
        self.icon = icon
        self.createdAt = Date()
        self.notes = []
    }
}
```

### Tag 模型

```swift
import SwiftData
import Foundation

@Model
final class Tag {
    var id: UUID
    var name: String
    var color: String

    @Relationship(deleteRule: .nullify, inverse: \Note.tags)
    var notes: [Note]

    init(name: String, color: String = "blue") {
        self.id = UUID()
        self.name = name
        self.color = color
        self.notes = []
    }
}
```

## SwiftData 查詢

### 使用 @Query

```swift
import SwiftUI
import SwiftData

struct NoteListView: View {
    // 查詢所有筆記
    @Query(sort: \Note.modifiedAt, order: .reverse)
    private var allNotes: [Note]

    // 查詢我的最愛
    @Query(filter: #Predicate<Note> { $0.isFavorite })
    private var favoriteNotes: [Note]

    // 查詢置頂筆記
    @Query(filter: #Predicate<Note> { $0.isPinned })
    private var pinnedNotes: [Note]

    var body: some View {
        List {
            ForEach(allNotes) { note in
                NoteCard(note: note)
            }
        }
    }
}
```

### 複雜查詢

```swift
// 搜尋筆記
func searchNotes(searchText: String) -> [Note] {
    let predicate = #Predicate<Note> { note in
        note.title.contains(searchText) || note.content.contains(searchText)
    }

    let descriptor = FetchDescriptor<Note>(
        predicate: predicate,
        sortBy: [SortDescriptor(\.modifiedAt, order: .reverse)]
    )

    return try? modelContext.fetch(descriptor) ?? []
}

// 按資料夾查詢
@Query(filter: #Predicate<Note> { note in
    note.folder?.id == folderId
})
private var folderNotes: [Note]

// 按標籤查詢
func notesWith(tag: Tag) -> [Note] {
    tag.notes.sorted { $0.modifiedAt > $1.modifiedAt }
}
```

## 主要視圖範例

### 主視圖

```swift
import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var folders: [Folder]
    @Query(sort: \Note.modifiedAt, order: .reverse)
    private var recentNotes: [Note]

    @State private var showingNewNote = false
    @State private var selectedNote: Note?

    var body: some View {
        NavigationSplitView {
            // 側邊欄
            List {
                Section("快速訪問") {
                    NavigationLink {
                        AllNotesView()
                    } label: {
                        Label("所有筆記", systemImage: "note.text")
                    }

                    NavigationLink {
                        FavoriteNotesView()
                    } label: {
                        Label("我的最愛", systemImage: "star.fill")
                            .symbolRenderingMode(.multicolor)
                    }
                }

                Section("資料夾") {
                    ForEach(folders) { folder in
                        NavigationLink {
                            FolderNotesView(folder: folder)
                        } label: {
                            Label(folder.name, systemImage: folder.icon)
                        }
                    }
                }
            }
            .navigationTitle("筆記")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingNewNote = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
        } detail: {
            if let note = selectedNote {
                NoteDetailView(note: note)
            } else {
                ContentUnavailableView(
                    "選擇筆記",
                    systemImage: "note.text",
                    description: Text("選擇一個筆記來查看內容")
                )
            }
        }
        .sheet(isPresented: $showingNewNote) {
            NewNoteView()
        }
    }
}
```

### 筆記編輯器

```swift
struct EditorView: View {
    @Bindable var note: Note
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        VStack(spacing: 0) {
            // 標題
            TextField("標題", text: $note.title, axis: .vertical)
                .font(.title)
                .fontWeight(.bold)
                .textFieldStyle(.plain)
                .padding()

            Divider()

            // 內容
            TextEditor(text: $note.content)
                .font(.body)
                .padding()
        }
        .onChange(of: note.title) { _, _ in
            note.modifiedAt = Date()
        }
        .onChange(of: note.content) { _, _ in
            note.modifiedAt = Date()
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                // 顏色選擇器
                Menu {
                    ForEach(NoteColor.allCases) { color in
                        Button {
                            note.color = color
                        } label: {
                            Label(color.rawValue, systemImage: "circle.fill")
                                .foregroundStyle(color.color)
                        }
                    }
                } label: {
                    Image(systemName: "paintpalette")
                }

                // 我的最愛
                Button {
                    note.isFavorite.toggle()
                } label: {
                    Image(systemName: note.isFavorite ? "star.fill" : "star")
                        .foregroundStyle(note.isFavorite ? .yellow : .primary)
                }

                // 置頂
                Button {
                    note.isPinned.toggle()
                } label: {
                    Image(systemName: note.isPinned ? "pin.fill" : "pin")
                }
            }
        }
    }
}
```

## iCloud 同步設置

### 1. 啟用 iCloud

在 Xcode 中：
1. 選擇專案 target
2. Signing & Capabilities
3. 點擊 "+ Capability"
4. 添加 "iCloud"
5. 啟用 "CloudKit"

### 2. 配置 SwiftData

```swift
@main
struct NotesAppApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Note.self, Folder.self, Tag.self],
                       isAutosaveEnabled: true,
                       isUndoEnabled: true)
    }
}
```

## 進階功能建議

想要擴展這個應用？以下是一些建議：

- 🖼️ **圖片附件** - 在筆記中插入圖片
- 📎 **文件附件** - 附加 PDF、文檔等文件
- ✅ **待辦清單** - 在筆記中創建 Checklist
- 🎙️ **語音筆記** - 錄音並轉文字
- 📊 **統計分析** - 筆記數量、字數統計
- 🔗 **筆記連結** - 筆記之間互相連結
- 📤 **匯出功能** - 匯出為 PDF、Markdown
- 🔒 **筆記加密** - 加密敏感筆記
- 🎨 **自訂主題** - 更多編輯器主題
- ⌚ **Apple Watch** - 快速筆記和語音轉文字
- 📱 **Widget** - 主畫面小工具顯示最近筆記
- 🗣️ **Siri 整合** - 語音創建筆記

## 效能優化

### SwiftData 最佳實踐

```swift
// 1. 使用批次更新
func updateMultipleNotes(_ notes: [Note]) {
    for note in notes {
        note.modifiedAt = Date()
    }
    // SwiftData 會自動批次處理
}

// 2. 延遲載入關聯資料
@Query private var notes: [Note]
// 僅在需要時訪問 note.folder 和 note.tags

// 3. 使用適當的刪除規則
@Relationship(deleteRule: .cascade) // 級聯刪除
@Relationship(deleteRule: .nullify) // 設為 nil
@Relationship(deleteRule: .deny)    // 禁止刪除

// 4. 優化查詢
@Query(
    filter: #Predicate<Note> { $0.isFavorite },
    sort: [SortDescriptor(\.modifiedAt, order: .reverse)],
    animation: .default
)
private var favoriteNotes: [Note]
```

## 常見問題

### Q: SwiftData 和 Core Data 有什麼區別？
A: SwiftData 是 iOS 17+ 的新框架，使用 Swift 宏提供更簡潔的 API，完全類型安全，但底層仍使用 Core Data。

### Q: 如何遷移現有的 Core Data 資料？
A: SwiftData 可以讀取 Core Data 的資料庫，但建議使用遷移工具進行轉換。

### Q: iCloud 同步如何工作？
A: SwiftData 與 CloudKit 整合，自動同步資料到 iCloud，無需額外程式碼。

### Q: 如何處理同步衝突？
A: SwiftData 會自動處理大部分衝突，使用最新時間戳的版本。

## 測試

### SwiftData 測試範例

```swift
import XCTest
import SwiftData
@testable import NotesApp

@MainActor
final class NoteModelTests: XCTestCase {
    var container: ModelContainer!
    var context: ModelContext!

    override func setUp() async throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        container = try ModelContainer(
            for: Note.self, Folder.self, Tag.self,
            configurations: config
        )
        context = ModelContext(container)
    }

    func testCreateNote() throws {
        let note = Note(title: "測試筆記", content: "測試內容")
        context.insert(note)
        try context.save()

        let descriptor = FetchDescriptor<Note>()
        let notes = try context.fetch(descriptor)

        XCTAssertEqual(notes.count, 1)
        XCTAssertEqual(notes.first?.title, "測試筆記")
    }

    func testDeleteNote() throws {
        let note = Note(title: "測試筆記")
        context.insert(note)
        try context.save()

        context.delete(note)
        try context.save()

        let descriptor = FetchDescriptor<Note>()
        let notes = try context.fetch(descriptor)

        XCTAssertEqual(notes.count, 0)
    }
}
```

## 學習資源

### 官方文檔
- [SwiftData 官方文檔](https://developer.apple.com/documentation/swiftdata)
- [WWDC 2023 - Meet SwiftData](https://developer.apple.com/videos/play/wwdc2023/10187/)
- [SwiftUI 教程](https://developer.apple.com/tutorials/swiftui)

### 推薦閱讀
- Apple Developer - SwiftData by Example
- Hacking with Swift - SwiftData Tutorial
- WWDC Sessions - SwiftData 相關

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 作者

Vibe Coding Apps - iOS 開發學習專案

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**最低 iOS 版本**: iOS 17.0+
**資料庫**: SwiftData
