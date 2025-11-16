# SwiftUI 待辦事項應用

一個使用 SwiftUI 和 MVVM 架構開發的現代化待辦事項管理應用，具備完整的 CRUD 功能、本地持久化、優雅的動畫效果和深色模式支援。

## 功能特色

- ✨ **簡潔美觀的 UI** - 遵循 Apple 設計規範的現代化介面
- ✅ **完整的待辦事項管理** - 新增、編輯、刪除、標記完成
- 🎨 **優先級管理** - 高、中、低三種優先級，不同顏色標示
- 📅 **到期日設定** - 支援設定到期日期和時間提醒
- 🔍 **搜尋與篩選** - 快速搜尋和按狀態篩選待辦事項
- 💾 **本地持久化** - 使用 UserDefaults 自動保存資料
- 🌓 **深色模式** - 完整支援淺色/深色模式切換
- ⚡ **流暢動畫** - SwiftUI 原生動畫效果
- 📱 **完全響應式** - 支援所有 iPhone 和 iPad 尺寸
- 🏗️ **MVVM 架構** - 清晰的程式碼架構，易於維護和擴展

## 核心功能

### 1. 待辦事項管理
- 新增待辦事項（標題、備註、優先級、到期日）
- 標記完成/未完成
- 編輯待辦事項資訊
- 滑動刪除
- 拖曳排序（長按拖曳）

### 2. 分類與篩選
- 全部待辦事項
- 進行中（未完成）
- 已完成
- 依優先級篩選
- 依到期日排序

### 3. 搜尋功能
- 即時搜尋
- 搜尋標題和備註內容
- 搜尋結果高亮顯示

### 4. 統計資訊
- 待辦事項總數
- 已完成數量
- 完成百分比
- 今日待辦
- 逾期待辦

## 技術棧

- **語言**: Swift 5.9+
- **框架**: SwiftUI
- **架構**: MVVM (Model-View-ViewModel)
- **最低版本**: iOS 17.0+
- **資料持久化**: UserDefaults (Codable)
- **狀態管理**: @Observable (iOS 17+) / ObservableObject
- **並發**: Swift Concurrency (async/await)
- **套件管理**: Swift Package Manager

## 快速開始

### 環境需求

- macOS Sonoma 14.0+
- Xcode 15.0+
- iOS 17.0+ 模擬器或真機

### 在 Xcode 中打開專案

1. **使用 Swift Package**:
   ```bash
   # 打開 Package.swift
   open Package.swift
   ```

2. **創建 Xcode 專案**:
   - 打開 Xcode
   - File > New > Project
   - 選擇 "App" 模板
   - Interface: SwiftUI
   - Language: Swift
   - 將源代碼複製到專案中

### 運行應用

1. 選擇目標設備（模擬器或真機）
2. 點擊運行按鈕 (⌘R)
3. 應用將在選定設備上啟動

## 專案結構

```
swiftui-todo-app/
├── README.md                    # 專案說明文檔
├── Package.swift                # Swift Package 配置
├── .gitignore                   # Git 忽略文件
├── Sources/
│   └── TodoApp/
│       ├── TodoAppApp.swift     # 應用入口點
│       ├── Models/              # 資料模型
│       │   ├── Todo.swift       # 待辦事項模型
│       │   └── Priority.swift   # 優先級枚舉
│       ├── ViewModels/          # 視圖模型（MVVM）
│       │   └── TodoViewModel.swift  # 主要業務邏輯
│       ├── Views/               # 視圖組件
│       │   ├── ContentView.swift    # 主視圖
│       │   ├── TodoListView.swift   # 待辦列表
│       │   ├── TodoRowView.swift    # 單項待辦
│       │   ├── AddTodoView.swift    # 新增待辦
│       │   ├── EditTodoView.swift   # 編輯待辦
│       │   └── StatsView.swift      # 統計視圖
│       ├── Services/            # 服務層
│       │   └── PersistenceService.swift  # 資料持久化
│       └── Utilities/           # 工具類
│           ├── Extensions.swift     # 擴展方法
│           └── Constants.swift      # 常數定義
└── Tests/
    └── TodoAppTests/            # 單元測試
        └── TodoViewModelTests.swift
```

## 核心代碼示例

### 資料模型 (Todo.swift)

```swift
import Foundation

struct Todo: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var notes: String
    var isCompleted: Bool
    var priority: Priority
    var dueDate: Date?
    var createdAt: Date
    var completedAt: Date?

    init(
        id: UUID = UUID(),
        title: String,
        notes: String = "",
        isCompleted: Bool = false,
        priority: Priority = .medium,
        dueDate: Date? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.notes = notes
        self.isCompleted = isCompleted
        self.priority = priority
        self.dueDate = dueDate
        self.createdAt = createdAt
    }

    var isOverdue: Bool {
        guard let dueDate = dueDate, !isCompleted else { return false }
        return dueDate < Date()
    }
}

enum Priority: String, Codable, CaseIterable {
    case low = "低"
    case medium = "中"
    case high = "高"

    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }
}
```

### 視圖模型 (TodoViewModel.swift)

```swift
import Foundation
import SwiftUI

@Observable
class TodoViewModel {
    var todos: [Todo] = []
    var searchText: String = ""
    var filterOption: FilterOption = .all

    private let persistenceService = PersistenceService()

    init() {
        loadTodos()
    }

    // MARK: - Computed Properties

    var filteredTodos: [Todo] {
        var result = todos

        // 篩選
        switch filterOption {
        case .all:
            break
        case .active:
            result = result.filter { !$0.isCompleted }
        case .completed:
            result = result.filter { $0.isCompleted }
        case .overdue:
            result = result.filter { $0.isOverdue }
        }

        // 搜尋
        if !searchText.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.notes.localizedCaseInsensitiveContains(searchText)
            }
        }

        return result.sorted { !$0.isCompleted && $1.isCompleted }
    }

    var stats: (total: Int, completed: Int, percentage: Double) {
        let total = todos.count
        let completed = todos.filter { $0.isCompleted }.count
        let percentage = total > 0 ? Double(completed) / Double(total) * 100 : 0
        return (total, completed, percentage)
    }

    // MARK: - CRUD Operations

    func addTodo(_ todo: Todo) {
        todos.append(todo)
        saveTodos()
    }

    func updateTodo(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            todos[index] = todo
            saveTodos()
        }
    }

    func toggleComplete(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            todos[index].isCompleted.toggle()
            todos[index].completedAt = todos[index].isCompleted ? Date() : nil
            saveTodos()
        }
    }

    func deleteTodos(at offsets: IndexSet) {
        let todosToDelete = offsets.map { filteredTodos[$0] }
        todos.removeAll { todo in
            todosToDelete.contains(where: { $0.id == todo.id })
        }
        saveTodos()
    }

    // MARK: - Persistence

    private func saveTodos() {
        persistenceService.save(todos)
    }

    private func loadTodos() {
        todos = persistenceService.load()
    }
}

enum FilterOption: String, CaseIterable {
    case all = "全部"
    case active = "進行中"
    case completed = "已完成"
    case overdue = "逾期"
}
```

### 主視圖 (ContentView.swift)

```swift
import SwiftUI

struct ContentView: View {
    @State private var viewModel = TodoViewModel()
    @State private var showingAddSheet = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 統計卡片
                StatsView(stats: viewModel.stats)
                    .padding()

                // 篩選器
                FilterPickerView(selection: $viewModel.filterOption)
                    .padding(.horizontal)

                // 待辦列表
                if viewModel.filteredTodos.isEmpty {
                    EmptyStateView()
                } else {
                    List {
                        ForEach(viewModel.filteredTodos) { todo in
                            TodoRowView(todo: todo) {
                                viewModel.toggleComplete(todo)
                            }
                        }
                        .onDelete(perform: viewModel.deleteTodos)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("待辦事項")
            .searchable(text: $viewModel.searchText, prompt: "搜尋待辦事項")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddTodoView { todo in
                    viewModel.addTodo(todo)
                }
            }
        }
    }
}
```

## MVVM 架構說明

### Model（模型）
- `Todo.swift` - 待辦事項資料結構
- `Priority.swift` - 優先級枚舉
- 純資料結構，不包含業務邏輯

### View（視圖）
- `ContentView.swift` - 主畫面
- `TodoRowView.swift` - 待辦事項單項
- `AddTodoView.swift` - 新增畫面
- 僅負責 UI 顯示，不包含業務邏輯

### ViewModel（視圖模型）
- `TodoViewModel.swift` - 核心業務邏輯
- 處理資料操作（CRUD）
- 管理狀態和篩選邏輯
- 與 Service 層通訊

### Service（服務）
- `PersistenceService.swift` - 資料持久化
- 封裝 UserDefaults 操作
- 可輕鬆替換為其他儲存方案

## SwiftUI 特性展示

### 1. 狀態管理

```swift
// iOS 17+ 使用 @Observable
@Observable
class TodoViewModel {
    var todos: [Todo] = []
}

// View 中使用
struct ContentView: View {
    @State private var viewModel = TodoViewModel()
}
```

### 2. 動畫效果

```swift
// 完成動畫
Text(todo.title)
    .strikethrough(todo.isCompleted, color: .gray)
    .foregroundStyle(todo.isCompleted ? .secondary : .primary)
    .animation(.easeInOut, value: todo.isCompleted)
```

### 3. 列表操作

```swift
List {
    ForEach(todos) { todo in
        TodoRowView(todo: todo)
    }
    .onDelete(perform: deleteTodos)  // 滑動刪除
    .onMove(perform: moveTodos)      // 拖曳排序
}
```

## 資料持久化

使用 UserDefaults + Codable 實現輕量級資料持久化：

```swift
class PersistenceService {
    private let todosKey = "todos"

    func save(_ todos: [Todo]) {
        if let encoded = try? JSONEncoder().encode(todos) {
            UserDefaults.standard.set(encoded, forKey: todosKey)
        }
    }

    func load() -> [Todo] {
        guard let data = UserDefaults.standard.data(forKey: todosKey),
              let todos = try? JSONDecoder().decode([Todo].self, from: data) else {
            return []
        }
        return todos
    }
}
```

## 進階功能建議

想要擴展這個應用？以下是一些建議：

- 📱 **Widget 支援** - 使用 WidgetKit 在主畫面顯示今日待辦
- ⏰ **本地通知** - 使用 UserNotifications 設定到期提醒
- 🗂️ **分類標籤** - 新增標籤系統組織待辦事項
- ☁️ **iCloud 同步** - 使用 CloudKit 跨設備同步
- 🎨 **自訂主題** - 支援更多顏色主題選擇
- 📊 **統計圖表** - 使用 Swift Charts 展示完成趨勢
- 🔄 **重複待辦** - 支援每日/每週重複任務
- 📎 **附件支援** - 支援新增圖片或檔案
- 🗣️ **Siri 整合** - 使用 SiriKit 語音建立待辦
- ⌚ **Apple Watch** - 開發 watchOS 版本

## 測試

### 單元測試範例

```swift
import XCTest
@testable import TodoApp

final class TodoViewModelTests: XCTestCase {
    var viewModel: TodoViewModel!

    override func setUp() {
        viewModel = TodoViewModel()
    }

    func testAddTodo() {
        let todo = Todo(title: "測試待辦")
        viewModel.addTodo(todo)

        XCTAssertEqual(viewModel.todos.count, 1)
        XCTAssertEqual(viewModel.todos.first?.title, "測試待辦")
    }

    func testToggleComplete() {
        let todo = Todo(title: "測試待辦")
        viewModel.addTodo(todo)
        viewModel.toggleComplete(todo)

        XCTAssertTrue(viewModel.todos.first?.isCompleted ?? false)
    }

    func testDeleteTodo() {
        let todo = Todo(title: "測試待辦")
        viewModel.addTodo(todo)
        viewModel.deleteTodos(at: IndexSet(integer: 0))

        XCTAssertEqual(viewModel.todos.count, 0)
    }
}
```

## 效能優化

- ✅ 使用 `@Observable` (iOS 17+) 減少不必要的視圖更新
- ✅ 列表使用 `LazyVStack` 延遲載入
- ✅ 合理使用 `.equatable()` 避免過度渲染
- ✅ 資料操作使用批次更新
- ✅ 搜尋使用防抖動（debounce）

## 常見問題

### Q: 為什麼使用 UserDefaults 而不是 Core Data？
A: UserDefaults 適合輕量級資料儲存，程式碼更簡潔。如需更複雜的資料關係，建議使用 SwiftData (iOS 17+) 或 Core Data。

### Q: 支援 iPad 嗎？
A: 是的，SwiftUI 自動適配 iPad，可以考慮使用 `NavigationSplitView` 優化大螢幕體驗。

### Q: 如何遷移到 SwiftData？
A: 將 `PersistenceService` 替換為 SwiftData 的 `ModelContext`，模型添加 `@Model` 宏即可。

## 學習資源

### 官方文檔
- [SwiftUI 教程](https://developer.apple.com/tutorials/swiftui)
- [Swift 官方文檔](https://docs.swift.org)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)

### 推薦閱讀
- Hacking with Swift - 100 Days of SwiftUI
- SwiftUI by Example (Paul Hudson)
- WWDC SwiftUI 相關 Sessions

## 貢獻

歡迎提交 Issue 和 Pull Request！

### 貢獻指南
1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## License

MIT License - 詳見 LICENSE 文件

## 作者

Vibe Coding Apps - iOS 開發學習專案

## 更新日誌

### v1.0.0 (2025-11-16)
- ✅ 初始版本發布
- ✅ 完整的 CRUD 功能
- ✅ 優先級和到期日支援
- ✅ 搜尋和篩選功能
- ✅ 本地資料持久化
- ✅ 深色模式支援

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**最低 iOS 版本**: iOS 17.0+
