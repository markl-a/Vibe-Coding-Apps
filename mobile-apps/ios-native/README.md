# iOS 原生應用開發
🤖 **AI-Driven | AI-Native** 🚀

使用 Swift 和 SwiftUI 開發原生 iOS 應用，充分利用 Apple 生態系統的最新特性。

## 📋 專案概述

iOS 原生開發使用 Apple 官方的 Swift 程式語言和 SwiftUI/UIKit 框架，能夠最大化發揮 iPhone 和 iPad 的性能，並獲得最佳的用戶體驗。透過 AI 輔助開發，即使是 iOS 開發新手也能快速上手。

### 為什麼選擇 iOS 原生開發？

- **最佳性能**：直接使用原生 API，性能極致優化
- **完整功能**：優先獲得 Apple 最新功能和 API
- **用戶體驗**：符合 Apple 設計規範，用戶接受度高
- **App Store 優勢**：原生應用更容易通過審核
- **Apple 生態整合**：iCloud、HealthKit、HomeKit 等完整支援
- **Swift 語言**：現代化、安全、易讀的程式語言
- **SwiftUI**：聲明式 UI，開發效率高
- **AI 友好**：Swift 語法清晰，AI 輔助效果優秀

## 🎯 適合開發的應用類型

### 生產力工具
- 筆記應用（類似 Bear、Notion）
- 待辦事項（類似 Things、OmniFocus）
- 日曆與行事曆
- 文件掃描器
- Markdown 編輯器

### 創意工具
- 圖片編輯器
- 繪圖應用
- 影片編輯
- 音樂創作
- 設計工具

### 健康健身
- 運動追蹤（整合 HealthKit）
- 冥想與正念
- 睡眠追蹤
- 飲食記錄
- 健身計劃

### 社交與通訊
- 即時通訊
- 社交網絡
- 論壇客戶端
- 照片分享

### 娛樂媒體
- 影片播放器
- 音樂播放器
- 播客應用
- 電子書閱讀器
- 遊戲

### 工具類
- 天氣應用
- 計算機
- 單位轉換
- 二維碼工具
- 檔案管理器

### 金融理財
- 記帳軟體
- 預算管理
- 投資追蹤
- 加密貨幣錢包

### 教育學習
- 語言學習
- 閃卡記憶
- 線上課程
- 題庫練習

### 商業應用
- CRM 系統
- 銷售管理
- 庫存管理
- 行動 POS

## 🛠️ 技術棧

### 核心框架與語言

#### Swift 6.0+
- **現代化語言**：安全、快速、表達力強
- **類型安全**：編譯時期錯誤檢查
- **並發支援**：async/await、Actor
- **泛型與協議**：靈活的程式設計

#### SwiftUI（推薦）
- **聲明式 UI**：類似 React 的開發體驗
- **即時預覽**：Xcode Canvas 即時查看效果
- **跨平台**：iOS、macOS、watchOS、tvOS 共用程式碼
- **資料綁定**：自動 UI 更新

#### UIKit（傳統）
- **成熟穩定**：久經考驗的 UI 框架
- **精細控制**：更多客製化選項
- **向後兼容**：支援舊版 iOS

### 狀態管理

#### SwiftUI 內建
- **@State** - 視圖內部狀態
- **@Binding** - 雙向綁定
- **@ObservedObject** - 外部可觀察物件
- **@StateObject** - 視圖擁有的可觀察物件
- **@EnvironmentObject** - 全局共享物件

#### 第三方方案
- **Combine** - Apple 官方反應式框架
- **RxSwift** - ReactiveX Swift 實現
- **Redux** - 單向資料流
- **The Composable Architecture (TCA)** - Point-Free 架構

### 資料持久化

#### 本地儲存
- **UserDefaults** - 簡單鍵值對儲存
- **Keychain** - 安全儲存敏感資料
- **File Manager** - 檔案系統操作
- **Core Data** - Apple 官方 ORM
- **SwiftData** - Swift 原生資料框架（iOS 17+）
- **Realm** - 移動資料庫
- **SQLite** - 輕量級關聯式資料庫

#### 雲端同步
- **iCloud** - Apple 生態整合
- **CloudKit** - Apple 雲端資料庫
- **Firebase** - Google 雲端服務
- **AWS Amplify** - AWS 移動後端

### 網路請求

- **URLSession** - Apple 官方網路庫
- **Alamofire** - 流行的 HTTP 客戶端
- **Moya** - 基於 Alamofire 的抽象層
- **Apollo iOS** - GraphQL 客戶端

### UI 組件與工具

#### 圖片處理
- **Kingfisher** - 圖片下載與快取
- **SDWebImage** - 非同步圖片載入
- **Core Image** - 圖片濾鏡與處理

#### 動畫
- **Core Animation** - 底層動畫框架
- **Lottie** - After Effects 動畫
- **SwiftUI Animations** - 聲明式動畫

#### 地圖與定位
- **MapKit** - Apple 地圖
- **Core Location** - 定位服務
- **Google Maps SDK** - Google 地圖

#### 多媒體
- **AVFoundation** - 音視頻處理
- **AVKit** - 播放器 UI
- **Vision** - 電腦視覺
- **Core ML** - 機器學習

### Apple 生態整合

- **HealthKit** - 健康數據
- **HomeKit** - 智慧家居
- **WatchKit** - Apple Watch
- **WidgetKit** - 主畫面小工具
- **App Clips** - 輕量級應用片段
- **StoreKit** - 應用內購買
- **PassKit** - Apple Pay / Wallet
- **SiriKit** - Siri 整合
- **ARKit** - 擴增實境

### 工具與輔助

- **SwiftLint** - Swift 程式碼檢查
- **SwiftFormat** - 程式碼格式化
- **CocoaPods** - 依賴管理
- **Swift Package Manager** - Apple 官方套件管理
- **Carthage** - 去中心化依賴管理

## 🚀 快速開始

### 環境需求

- **macOS** - Ventura 13.0+ (推薦 Sonoma 14.0+)
- **Xcode** - 15.0+ (從 Mac App Store 下載)
- **Apple Developer Account** - 真機測試需要（免費或付費）
- **iOS 設備** - iPhone/iPad（可選，可用模擬器）

### 安裝 Xcode

```bash
# 從 App Store 安裝 Xcode（推薦）
# 或使用命令列工具

# 安裝 Xcode Command Line Tools
xcode-select --install

# 驗證安裝
xcodebuild -version
```

### 創建新專案

#### 使用 Xcode
1. 打開 Xcode
2. 選擇「Create a new Xcode project」
3. 選擇「App」模板
4. 配置專案：
   - **Interface**: SwiftUI（推薦）或 Storyboard
   - **Language**: Swift
   - **Organization Identifier**: 反向域名（如 com.yourname）
5. 選擇儲存位置

#### 專案結構

```
MyApp/
├── MyApp.xcodeproj          # Xcode 專案文件
├── MyApp/
│   ├── MyAppApp.swift       # 應用入口
│   ├── ContentView.swift    # 主視圖
│   ├── Models/              # 資料模型
│   ├── Views/               # 視圖組件
│   ├── ViewModels/          # 視圖模型（MVVM）
│   ├── Services/            # API 服務
│   ├── Utilities/           # 工具函數
│   ├── Resources/           # 資源文件
│   │   ├── Assets.xcassets  # 圖片、顏色資產
│   │   └── Localizable.strings  # 多語言
│   └── Info.plist           # 應用配置
├── MyAppTests/              # 單元測試
└── MyAppUITests/            # UI 測試
```

### Package.swift（Swift Package Manager）

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "MyApp",
            targets: ["MyApp"]),
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.10.0"),
    ],
    targets: [
        .target(
            name: "MyApp",
            dependencies: [
                "Alamofire",
                "Kingfisher",
            ]),
        .testTarget(
            name: "MyAppTests",
            dependencies: ["MyApp"]),
    ]
)
```

## 💡 範例專案：待辦事項應用（SwiftUI + MVVM）

### MyAppApp.swift（應用入口）

```swift
import SwiftUI

@main
struct MyAppApp: App {
    @StateObject private var todoStore = TodoStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(todoStore)
        }
    }
}
```

### Todo.swift（資料模型）

```swift
import Foundation

struct Todo: Identifiable, Codable {
    let id: UUID
    var title: String
    var isCompleted: Bool
    var createdAt: Date

    init(id: UUID = UUID(), title: String, isCompleted: Bool = false, createdAt: Date = Date()) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.createdAt = createdAt
    }
}
```

### TodoStore.swift（ViewModel / Store）

```swift
import Foundation
import Combine

class TodoStore: ObservableObject {
    @Published var todos: [Todo] = []

    private let todosKey = "todos"

    init() {
        loadTodos()
    }

    // MARK: - CRUD Operations

    func addTodo(_ title: String) {
        let newTodo = Todo(title: title)
        todos.append(newTodo)
        saveTodos()
    }

    func toggleTodo(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            todos[index].isCompleted.toggle()
            saveTodos()
        }
    }

    func deleteTodo(at offsets: IndexSet) {
        todos.remove(atOffsets: offsets)
        saveTodos()
    }

    func updateTodo(_ todo: Todo, title: String) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            todos[index].title = title
            saveTodos()
        }
    }

    // MARK: - Persistence

    private func saveTodos() {
        if let encoded = try? JSONEncoder().encode(todos) {
            UserDefaults.standard.set(encoded, forKey: todosKey)
        }
    }

    private func loadTodos() {
        if let data = UserDefaults.standard.data(forKey: todosKey),
           let decoded = try? JSONDecoder().decode([Todo].self, from: data) {
            todos = decoded
        }
    }
}
```

### ContentView.swift（主視圖）

```swift
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var todoStore: TodoStore
    @State private var newTodoTitle = ""
    @State private var showingAddSheet = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(todoStore.todos) { todo in
                    TodoRow(todo: todo)
                }
                .onDelete(perform: todoStore.deleteTodo)
            }
            .navigationTitle("待辦事項")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddTodoView()
            }
        }
    }
}

struct TodoRow: View {
    @EnvironmentObject var todoStore: TodoStore
    let todo: Todo

    var body: some View {
        HStack {
            Button {
                todoStore.toggleTodo(todo)
            } label: {
                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(todo.isCompleted ? .green : .gray)
            }
            .buttonStyle(.plain)

            Text(todo.title)
                .strikethrough(todo.isCompleted)
                .foregroundColor(todo.isCompleted ? .secondary : .primary)

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct AddTodoView: View {
    @EnvironmentObject var todoStore: TodoStore
    @Environment(\.dismiss) var dismiss
    @State private var title = ""

    var body: some View {
        NavigationStack {
            Form {
                TextField("待辦事項標題", text: $title)
            }
            .navigationTitle("新增待辦事項")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("新增") {
                        if !title.isEmpty {
                            todoStore.addTodo(title)
                            dismiss()
                        }
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }
}
```

## 🤖 AI 輔助開發工作流程

### 1. 專案規劃
向 AI 描述應用需求：
```
"我想開發一個 iOS 天氣應用，支援多個城市、顯示未來一週天氣、
整合 Widget、支援深色模式。請幫我規劃功能模組和架構設計。"
```

### 2. 技術選型
讓 AI 推薦技術方案：
```
"基於天氣應用需求，推薦我使用 SwiftUI 還是 UIKit？
狀態管理用什麼方案？資料持久化怎麼處理？"
```

### 3. 視圖開發
使用 AI 生成 SwiftUI 視圖：
```
"創建一個天氣卡片視圖，顯示城市名稱、當前溫度、天氣圖標、
最高最低溫，使用漸層背景。"
```

### 4. 網路請求
AI 協助處理 API：
```
"使用 URLSession 創建一個 WeatherService，調用 OpenWeatherMap API
獲取天氣數據，使用 async/await，並處理錯誤。"
```

### 5. 資料模型
讓 AI 設計資料結構：
```
"基於 OpenWeatherMap API 回應，創建對應的 Swift Codable 資料模型。"
```

### 6. Widget 開發
AI 協助開發 Widget：
```
"創建一個 iOS 主畫面 Widget，顯示當前城市的天氣資訊，
使用 WidgetKit，支援小、中、大三種尺寸。"
```

### 7. 問題排查
向 AI 描述錯誤：
```
"我在使用 Core Data 時遇到 'NSInvalidArgumentException' 錯誤，
發生在儲存資料時，如何解決？"
```

## 📊 專案範例清單

### 初級專案（1-2 週）
- ⭐ 計算機
- ⭐ 待辦事項列表
- ⭐ 倒數計時器
- ⭐ 單位轉換器
- ⭐ 簡單筆記應用

### 中級專案（2-4 週）
- ⭐⭐ 天氣應用（API 整合）
- ⭐⭐ 新聞閱讀器
- ⭐⭐ 音樂播放器
- ⭐⭐ 相冊應用
- ⭐⭐ 記帳軟體

### 高級專案（4+ 週）
- ⭐⭐⭐ 即時通訊應用
- ⭐⭐⭐ 健身追蹤（HealthKit）
- ⭐⭐⭐ 社交媒體應用
- ⭐⭐⭐ 影片編輯器
- ⭐⭐⭐ AR 應用（ARKit）

## 🔧 開發工具

### Xcode 功能
- **Interface Builder** - 視覺化界面設計（Storyboard）
- **Canvas** - SwiftUI 即時預覽
- **Instruments** - 效能分析工具
- **Simulator** - iOS 模擬器
- **Organizer** - 應用發布管理
- **Source Control** - Git 整合

### 第三方工具
- **Postman** - API 測試
- **Charles Proxy** - 網路偵錯
- **Reveal** - UI 視覺化偵錯
- **Proxyman** - 網路監控
- **SF Symbols** - Apple 官方圖標庫

### 測試工具
- **XCTest** - 單元測試框架
- **XCUITest** - UI 測試
- **Quick + Nimble** - BDD 測試框架
- **OCMock** - Mock 測試

### CI/CD
- **Xcode Cloud** - Apple 官方 CI/CD
- **Fastlane** - 自動化建置部署
- **GitHub Actions** - 自動化工作流
- **Bitrise** - 移動 CI/CD

## 📚 學習資源

### 官方文檔
- [Swift 官方文檔](https://swift.org/documentation/)
- [SwiftUI 教程](https://developer.apple.com/tutorials/swiftui)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### 推薦課程
- iOS & Swift - The Complete iOS App Development Bootcamp (Udemy)
- Stanford CS193p - Developing Apps for iOS
- Hacking with Swift (免費教程)
- 100 Days of SwiftUI

### 社群資源
- [Swift Forums](https://forums.swift.org/)
- [Stack Overflow - Swift](https://stackoverflow.com/questions/tagged/swift)
- [r/iOSProgramming](https://www.reddit.com/r/iOSProgramming/)
- [Swift by Sundell](https://www.swiftbysundell.com/)

### YouTube 頻道
- Sean Allen
- Paul Hudson (Hacking with Swift)
- CodeWithChris
- Lets Build That App
- Kavsoft

### 中文資源
- SwiftGG 翻譯組
- iOS Dev Weekly 中文版
- 掘金 - iOS 專區

## ⚡ 效能優化建議

### 1. SwiftUI 優化

```swift
// 避免不必要的視圖更新
struct OptimizedView: View {
    @State private var counter = 0

    var body: some View {
        // 使用 equatable
        ChildView(value: counter)
            .equatable()
    }
}

// 使用 LazyVStack/LazyHStack
LazyVStack {
    ForEach(items) { item in
        ItemView(item: item)
    }
}
```

### 2. 圖片優化

```swift
// 異步載入圖片
AsyncImage(url: URL(string: imageURL)) { phase in
    switch phase {
    case .success(let image):
        image.resizable()
             .aspectRatio(contentMode: .fill)
    case .failure:
        Image(systemName: "photo")
    case .empty:
        ProgressView()
    @unknown default:
        EmptyView()
    }
}

// 使用 Kingfisher 快取
KFImage(URL(string: imageURL))
    .cacheMemoryOnly()
    .fade(duration: 0.25)
```

### 3. 網路請求優化

```swift
// 使用 async/await
func fetchData() async throws -> [Item] {
    let url = URL(string: apiEndpoint)!
    let (data, _) = try await URLSession.shared.data(from: url)
    let items = try JSONDecoder().decode([Item].self, from: data)
    return items
}

// 取消過期的請求
class ViewModel: ObservableObject {
    private var task: Task<Void, Never>?

    func loadData() {
        task?.cancel()
        task = Task {
            do {
                let data = try await fetchData()
                await MainActor.run {
                    self.items = data
                }
            } catch {
                // Handle error
            }
        }
    }
}
```

### 4. Core Data 優化

```swift
// 批次處理
let batchRequest = NSBatchInsertRequest(entity: entity, objects: objects)
try context.execute(batchRequest)

// 使用 faulting
fetchRequest.returnsObjectsAsFaults = true

// 合理設定 batch size
fetchRequest.fetchBatchSize = 20
```

## 🐛 常見問題與解決方案

### Xcode 建置問題
```bash
# 清理建置
Product > Clean Build Folder (Cmd + Shift + K)

# 刪除 Derived Data
rm -rf ~/Library/Developer/Xcode/DerivedData

# 重置套件快取
File > Packages > Reset Package Caches
```

### 模擬器問題
```bash
# 重置模擬器
xcrun simctl erase all

# 重新啟動模擬器
killall Simulator && open -a Simulator
```

### CocoaPods 問題
```bash
# 更新 CocoaPods
sudo gem install cocoapods

# 清理並重新安裝
pod deintegrate
pod install
```

## 🚀 發布應用

### 1. 準備工作

#### App Store Connect 配置
1. 登入 [App Store Connect](https://appstoreconnect.apple.com/)
2. 創建新應用
3. 填寫應用資訊、截圖、描述
4. 設定價格與可用性

#### 專案配置
```swift
// 設定 Bundle Identifier
// 設定版本號和建置號
// 配置簽名（Signing & Capabilities）
// 添加隱私權限描述（Info.plist）
```

### 2. 建置 Archive

1. 選擇「Any iOS Device」
2. Product > Archive
3. 等待建置完成
4. Organizer 視窗開啟

### 3. 上傳到 App Store

1. 在 Organizer 選擇 Archive
2. 點擊「Distribute App」
3. 選擇「App Store Connect」
4. 選擇簽名方式
5. 上傳

### 4. 提交審核

1. 在 App Store Connect 選擇建置版本
2. 填寫「What's New in This Version」
3. 提交審核
4. 等待 Apple 審核（通常 1-3 天）

### 使用 Fastlane 自動化

```ruby
# Fastfile
lane :release do
  increment_build_number
  gym(scheme: "MyApp")
  deliver(submit_for_review: true)
end
```

## 💰 商業化選項

### 應用內購買 (IAP)
```swift
import StoreKit

// 配置產品
let productIDs = Set(["com.myapp.premium", "com.myapp.coins100"])

// 購買產品
func purchase(product: SKProduct) {
    let payment = SKPayment(product: product)
    SKPaymentQueue.default().add(payment)
}

// StoreKit 2 (iOS 15+)
@available(iOS 15.0, *)
func purchase() async throws {
    let product = try await Product.products(for: ["premium"]).first
    let result = try await product?.purchase()
}
```

### 訂閱制
- 自動續訂訂閱
- 非自動續訂訂閱
- 家庭共享支援

### 廣告整合
- **Google AdMob** - 橫幅、插頁、獎勵廣告
- **Apple Search Ads** - App Store 搜尋廣告

## 🎯 最佳實踐

### 架構模式
```swift
// MVVM 架構
struct ContentView: View {
    @StateObject private var viewModel = ContentViewModel()

    var body: some View {
        List(viewModel.items) { item in
            Text(item.title)
        }
        .task {
            await viewModel.loadItems()
        }
    }
}

@MainActor
class ContentViewModel: ObservableObject {
    @Published var items: [Item] = []

    func loadItems() async {
        // Load data
    }
}
```

### 錯誤處理
```swift
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
}

func fetchData() async throws -> Data {
    guard let url = URL(string: apiEndpoint) else {
        throw NetworkError.invalidURL
    }

    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw NetworkError.noData
    }

    return data
}
```

### 無障礙設計
```swift
// SwiftUI
Text("標題")
    .accessibilityLabel("這是一個標題")
    .accessibilityHint("點擊查看詳情")

// UIKit
button.accessibilityLabel = "提交按鈕"
button.accessibilityHint = "點擊提交表單"
```

## 🤝 貢獻與協作

歡迎提交你的 iOS 專案！

### 專案要求
- 使用 Swift 5.0+
- 支援 iOS 15.0+（或更新）
- 程式碼符合 Swift 風格指南
- 包含完整的 README

### 提交流程
1. Fork 本倉庫
2. 創建功能分支
3. 編寫程式碼和測試
4. 提交 Pull Request

## 📄 授權

各專案請自行指定授權條款（MIT、Apache 2.0 等）。

---

**🚀 使用 Swift、SwiftUI 和 AI 打造優雅的 iOS 應用！**

**最後更新**: 2025-11-16
**維護狀態**: ✅ 活躍開發
