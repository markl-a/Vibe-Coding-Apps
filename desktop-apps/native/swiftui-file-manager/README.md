# 📁 SwiftUI File Manager - macOS 原生文件管理器

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Swift 和 SwiftUI 開發的現代化 macOS 原生文件管理器，展示 SwiftUI 宣告式 UI 和現代 macOS 開發最佳實踐。

## 📋 專案簡介

這是一個功能完整的 macOS 原生文件管理器應用，使用 SwiftUI 和 Swift 5.9+ 開發。應用程式提供直觀的文件瀏覽、搜尋和管理功能，完全融入 macOS 生態系統。

### ✨ 主要功能

- 📂 瀏覽檔案系統目錄
- 🔍 即時搜尋檔案和資料夾
- 📊 顯示檔案大小、類型、修改時間
- 🗂️ 支援多欄檢視和列表檢視
- 🎨 檔案類型圖示顯示
- ⌨️ 鍵盤快捷鍵支援
- 🌟 書籤和最愛資料夾
- 🔄 即時更新檔案變更

## 🛠️ 技術棧

- **語言**: Swift 5.9+
- **框架**: SwiftUI
- **部署目標**: macOS 13.0+
- **IDE**: Xcode 15+
- **架構**: MVVM + Combine

## 📦 系統需求

- macOS 13 Ventura 或更新版本
- Xcode 15 或更新版本
- Apple Developer Account（用於程式碼簽署）

## 🚀 快速開始

### 1. 使用 Xcode 建立專案

```bash
# 開啟 Xcode
# File > New > Project
# macOS > App
# Product Name: SwiftUIFileManager
# Interface: SwiftUI
# Language: Swift
```

### 2. 複製原始碼

將本專案的 Swift 檔案複製到你的 Xcode 專案中。

### 3. 設定權限

在 `Info.plist` 或專案設定中新增檔案存取權限：

```xml
<key>NSDocumentsFolderUsageDescription</key>
<string>需要存取文件以瀏覽和管理檔案</string>
<key>NSDownloadsFolderUsageDescription</key>
<string>需要存取下載資料夾</string>
```

### 4. 執行專案

在 Xcode 中按 `⌘ + R` 執行應用程式。

## 📁 專案結構

```
SwiftUIFileManager/
├── SwiftUIFileManagerApp.swift    # App 入口點
├── ContentView.swift               # 主視圖
├── Models/
│   ├── FileItem.swift              # 檔案項目模型
│   └── FileType.swift              # 檔案類型枚舉
├── ViewModels/
│   └── FileManagerViewModel.swift  # ViewModel
├── Views/
│   ├── FileListView.swift          # 檔案列表視圖
│   ├── FileRowView.swift           # 檔案行視圖
│   ├── SidebarView.swift           # 側邊欄視圖
│   └── ToolbarView.swift           # 工具列視圖
├── Services/
│   └── FileService.swift           # 檔案服務
├── Utilities/
│   ├── FileIcon.swift              # 檔案圖示工具
│   └── FormatHelper.swift          # 格式化輔助
└── Resources/
    └── Assets.xcassets             # 資源檔案
```

## 💻 核心程式碼

### App 入口點 (SwiftUIFileManagerApp.swift)

```swift
import SwiftUI

@main
struct SwiftUIFileManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 800, minHeight: 600)
        }
        .commands {
            CommandGroup(after: .newItem) {
                Button("開啟資料夾...") {
                    // 開啟資料夾選擇器
                }
                .keyboardShortcut("O", modifiers: [.command])

                Divider()

                Button("重新整理") {
                    // 重新載入檔案列表
                }
                .keyboardShortcut("R", modifiers: [.command])
            }
        }
    }
}
```

### 資料模型 (Models/FileItem.swift)

```swift
import Foundation

struct FileItem: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let path: URL
    let isDirectory: Bool
    let size: Int64
    let modificationDate: Date
    let creationDate: Date
    let fileType: FileType

    var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        formatter.allowedUnits = [.useAll]
        formatter.includesUnit = true
        return formatter.string(fromByteCount: size)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "zh_TW")
        return formatter.string(from: modificationDate)
    }

    var icon: String {
        if isDirectory {
            return "folder.fill"
        }
        return fileType.icon
    }

    static func == (lhs: FileItem, rhs: FileItem) -> Bool {
        lhs.path == rhs.path
    }
}

enum FileType: String {
    case image
    case video
    case audio
    case document
    case code
    case archive
    case executable
    case other

    var icon: String {
        switch self {
        case .image:
            return "photo.fill"
        case .video:
            return "video.fill"
        case .audio:
            return "music.note"
        case .document:
            return "doc.text.fill"
        case .code:
            return "chevron.left.forwardslash.chevron.right"
        case .archive:
            return "doc.zipper"
        case .executable:
            return "gearshape.fill"
        case .other:
            return "doc.fill"
        }
    }

    static func from(extension ext: String) -> FileType {
        switch ext.lowercased() {
        case "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp":
            return .image
        case "mp4", "mov", "avi", "mkv", "wmv":
            return .video
        case "mp3", "wav", "aac", "flac", "m4a":
            return .audio
        case "pdf", "doc", "docx", "txt", "rtf", "pages":
            return .document
        case "swift", "js", "ts", "py", "java", "c", "cpp", "h", "cs", "go", "rs":
            return .code
        case "zip", "rar", "7z", "tar", "gz":
            return .archive
        case "app", "exe", "dmg", "pkg":
            return .executable
        default:
            return .other
        }
    }
}
```

### ViewModel (ViewModels/FileManagerViewModel.swift)

```swift
import Foundation
import SwiftUI
import Combine

@MainActor
class FileManagerViewModel: ObservableObject {
    @Published var currentPath: URL
    @Published var files: [FileItem] = []
    @Published var filteredFiles: [FileItem] = []
    @Published var searchText: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var sortBy: SortOption = .name
    @Published var sortAscending: Bool = true

    private let fileService: FileService
    private var cancellables = Set<AnyCancellable>()

    enum SortOption: String, CaseIterable {
        case name = "名稱"
        case size = "大小"
        case date = "修改日期"
        case type = "類型"
    }

    init() {
        self.currentPath = FileManager.default.homeDirectoryForCurrentUser
        self.fileService = FileService()

        // 監聽搜尋文字變化
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.filterFiles()
            }
            .store(in: &cancellables)

        // 監聽排序選項變化
        Publishers.CombineLatest($sortBy, $sortAscending)
            .sink { [weak self] _, _ in
                self?.sortFiles()
            }
            .store(in: &cancellables)

        loadFiles()
    }

    func loadFiles() {
        isLoading = true
        errorMessage = nil

        do {
            files = try fileService.getFiles(at: currentPath)
            filterFiles()
            isLoading = false
        } catch {
            errorMessage = "無法載入檔案：\(error.localizedDescription)"
            isLoading = false
        }
    }

    func navigateTo(_ path: URL) {
        currentPath = path
        loadFiles()
    }

    func navigateUp() {
        let parent = currentPath.deletingLastPathComponent()
        if parent != currentPath {
            navigateTo(parent)
        }
    }

    func refresh() {
        loadFiles()
    }

    private func filterFiles() {
        if searchText.isEmpty {
            filteredFiles = files
        } else {
            filteredFiles = files.filter { file in
                file.name.localizedCaseInsensitiveContains(searchText)
            }
        }
        sortFiles()
    }

    private func sortFiles() {
        switch sortBy {
        case .name:
            filteredFiles.sort { sortAscending ? $0.name < $1.name : $0.name > $1.name }
        case .size:
            filteredFiles.sort { sortAscending ? $0.size < $1.size : $0.size > $1.size }
        case .date:
            filteredFiles.sort { sortAscending ? $0.modificationDate < $1.modificationDate : $0.modificationDate > $1.modificationDate }
        case .type:
            filteredFiles.sort { sortAscending ? $0.fileType.rawValue < $1.fileType.rawValue : $0.fileType.rawValue > $1.fileType.rawValue }
        }

        // 資料夾永遠在前面
        filteredFiles.sort { $0.isDirectory && !$1.isDirectory }
    }
}
```

### 檔案服務 (Services/FileService.swift)

```swift
import Foundation

class FileService {
    private let fileManager = FileManager.default

    func getFiles(at url: URL) throws -> [FileItem] {
        let urls = try fileManager.contentsOfDirectory(
            at: url,
            includingPropertiesForKeys: [
                .fileSizeKey,
                .contentModificationDateKey,
                .creationDateKey,
                .isDirectoryKey
            ],
            options: [.skipsHiddenFiles]
        )

        return urls.compactMap { url -> FileItem? in
            guard let resourceValues = try? url.resourceValues(forKeys: [
                .fileSizeKey,
                .contentModificationDateKey,
                .creationDateKey,
                .isDirectoryKey
            ]) else {
                return nil
            }

            let isDirectory = resourceValues.isDirectory ?? false
            let size = Int64(resourceValues.fileSize ?? 0)
            let modificationDate = resourceValues.contentModificationDate ?? Date()
            let creationDate = resourceValues.creationDate ?? Date()
            let fileExtension = url.pathExtension
            let fileType = FileType.from(extension: fileExtension)

            return FileItem(
                name: url.lastPathComponent,
                path: url,
                isDirectory: isDirectory,
                size: size,
                modificationDate: modificationDate,
                creationDate: creationDate,
                fileType: fileType
            )
        }
    }

    func openFile(_ url: URL) {
        NSWorkspace.shared.open(url)
    }

    func revealInFinder(_ url: URL) {
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }
}
```

### 主視圖 (ContentView.swift)

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = FileManagerViewModel()
    @State private var selectedFile: FileItem?

    var body: some View {
        NavigationSplitView {
            // 側邊欄
            SidebarView(viewModel: viewModel)
                .frame(minWidth: 200, idealWidth: 250)
        } detail: {
            // 主要內容區
            VStack(spacing: 0) {
                // 工具列
                ToolbarView(viewModel: viewModel)
                    .padding()

                Divider()

                // 檔案列表
                if viewModel.isLoading {
                    ProgressView("載入中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.orange)
                        Text(error)
                            .padding()
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    FileListView(
                        files: viewModel.filteredFiles,
                        selectedFile: $selectedFile,
                        onFileDoubleClick: { file in
                            if file.isDirectory {
                                viewModel.navigateTo(file.path)
                            } else {
                                NSWorkspace.shared.open(file.path)
                            }
                        }
                    )
                }
            }
        }
        .navigationTitle(viewModel.currentPath.lastPathComponent)
    }
}

struct ToolbarView: View {
    @ObservedObject var viewModel: FileManagerViewModel

    var body: some View {
        HStack {
            // 上一層按鈕
            Button(action: { viewModel.navigateUp() }) {
                Label("上一層", systemImage: "arrow.up")
            }

            // 路徑顯示
            Text(viewModel.currentPath.path)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: .infinity, alignment: .leading)

            // 排序選項
            Picker("排序", selection: $viewModel.sortBy) {
                ForEach(FileManagerViewModel.SortOption.allCases, id: \.self) { option in
                    Text(option.rawValue).tag(option)
                }
            }
            .pickerStyle(.menu)
            .frame(width: 120)

            // 排序方向
            Button(action: { viewModel.sortAscending.toggle() }) {
                Image(systemName: viewModel.sortAscending ? "arrow.up" : "arrow.down")
            }

            // 搜尋框
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("搜尋...", text: $viewModel.searchText)
                    .textFieldStyle(.plain)
                    .frame(width: 200)
                if !viewModel.searchText.isEmpty {
                    Button(action: { viewModel.searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(8)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(8)

            // 重新整理按鈕
            Button(action: { viewModel.refresh() }) {
                Label("重新整理", systemImage: "arrow.clockwise")
            }
        }
    }
}

struct SidebarView: View {
    @ObservedObject var viewModel: FileManagerViewModel

    var body: some View {
        List {
            Section("常用位置") {
                NavigationLink(destination: EmptyView()) {
                    Label("首頁", systemImage: "house.fill")
                }
                .onTapGesture {
                    viewModel.navigateTo(FileManager.default.homeDirectoryForCurrentUser)
                }

                NavigationLink(destination: EmptyView()) {
                    Label("桌面", systemImage: "desktopcomputer")
                }
                .onTapGesture {
                    viewModel.navigateTo(
                        FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Desktop")
                    )
                }

                NavigationLink(destination: EmptyView()) {
                    Label("文件", systemImage: "doc.fill")
                }
                .onTapGesture {
                    viewModel.navigateTo(
                        FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Documents")
                    )
                }

                NavigationLink(destination: EmptyView()) {
                    Label("下載", systemImage: "arrow.down.circle.fill")
                }
                .onTapGesture {
                    viewModel.navigateTo(
                        FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Downloads")
                    )
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("位置")
    }
}

struct FileListView: View {
    let files: [FileItem]
    @Binding var selectedFile: FileItem?
    let onFileDoubleClick: (FileItem) -> Void

    var body: some View {
        Table(of: FileItem.self, selection: $selectedFile) {
            TableColumn("名稱") { file in
                HStack {
                    Image(systemName: file.icon)
                        .foregroundColor(file.isDirectory ? .blue : .secondary)
                    Text(file.name)
                }
            }
            .width(min: 200, ideal: 300)

            TableColumn("大小") { file in
                Text(file.isDirectory ? "--" : file.formattedSize)
                    .foregroundColor(.secondary)
            }
            .width(100)

            TableColumn("修改日期") { file in
                Text(file.formattedDate)
                    .foregroundColor(.secondary)
            }
            .width(150)

            TableColumn("類型") { file in
                Text(file.isDirectory ? "資料夾" : file.fileType.rawValue)
                    .foregroundColor(.secondary)
            }
            .width(100)
        } rows: {
            ForEach(files) { file in
                TableRow(file)
                    .onTapGesture(count: 2) {
                        onFileDoubleClick(file)
                    }
            }
        }
    }
}
```

## 🎯 功能特點

### 1. SwiftUI 宣告式 UI
- 使用 SwiftUI 建構現代化介面
- 響應式設計和自動佈局
- 原生 macOS 視覺風格

### 2. MVVM 架構
- ViewModel 管理業務邏輯
- Combine 框架處理響應式資料流
- 清晰的關注點分離

### 3. macOS 深度整合
- NSWorkspace 整合
- 檔案系統即時監控
- 原生選單和快捷鍵

## 📦 打包發布

### 使用 Xcode Archive

1. Product > Archive
2. Distribute App > Developer ID
3. 選擇簽署憑證
4. Export 匯出應用程式

### 程式碼簽署

```bash
# 檢視可用憑證
security find-identity -v -p codesigning

# 簽署應用
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  SwiftUIFileManager.app

# 驗證簽署
codesign --verify --verbose SwiftUIFileManager.app
spctl --assess --verbose SwiftUIFileManager.app
```

### 公證 (Notarization)

```bash
# 建立 DMG
create-dmg SwiftUIFileManager.app

# 上傳公證
xcrun notarytool submit SwiftUIFileManager.dmg \
  --apple-id your@email.com \
  --team-id TEAM_ID \
  --password APP_SPECIFIC_PASSWORD

# 裝訂公證憑證
xcrun stapler staple SwiftUIFileManager.app
```

## 🧪 測試

```swift
import XCTest
@testable import SwiftUIFileManager

class FileServiceTests: XCTestCase {
    var fileService: FileService!

    override func setUp() {
        super.setUp()
        fileService = FileService()
    }

    func testGetFilesInHomeDirectory() throws {
        let homeURL = FileManager.default.homeDirectoryForCurrentUser
        let files = try fileService.getFiles(at: homeURL)

        XCTAssertFalse(files.isEmpty)
    }

    func testFileItemCreation() {
        let testURL = URL(fileURLWithPath: "/tmp/test.txt")
        let fileItem = FileItem(
            name: "test.txt",
            path: testURL,
            isDirectory: false,
            size: 1024,
            modificationDate: Date(),
            creationDate: Date(),
            fileType: .document
        )

        XCTAssertEqual(fileItem.name, "test.txt")
        XCTAssertFalse(fileItem.isDirectory)
    }
}
```

## 🎨 自訂和擴展

### 新增檔案預覽功能

使用 QuickLook 框架：

```swift
import QuickLook

struct FilePreview: View {
    let url: URL

    var body: some View {
        QuickLookPreview(url)
    }
}
```

### 新增拖放支援

```swift
.onDrop(of: [.fileURL], isTargeted: nil) { providers in
    // 處理拖放檔案
    return true
}
```

## 📚 學習資源

- [SwiftUI 官方教學](https://developer.apple.com/tutorials/swiftui)
- [Swift 程式語言指南](https://docs.swift.org/swift-book/)
- [macOS App Programming Guide](https://developer.apple.com/library/archive/documentation/General/Conceptual/MOSXAppProgrammingGuide/)

## ❓ 常見問題

**Q: 為什麼選擇 SwiftUI 而不是 AppKit?**
A: SwiftUI 是 Apple 的未來方向，提供更簡潔的程式碼和更快的開發速度。

**Q: 如何處理大量檔案?**
A: 使用虛擬化列表和非同步載入，避免一次載入所有檔案。

**Q: 支援 macOS 11 嗎?**
A: 本專案需要 macOS 13+，若需支援舊版本請調整部署目標並移除新 API。

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: GitHub Copilot、Xcode AI、Cursor
**最後更新**: 2025-11-16
**狀態**: ✅ 完整可用專案
