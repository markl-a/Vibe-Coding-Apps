# iOS 天氣應用

一個使用 SwiftUI 開發的現代化天氣應用，整合 OpenWeather API，提供即時天氣資訊、7天預報、多城市管理等完整功能。

## 功能特色

- 🌤️ **即時天氣** - 顯示當前溫度、體感溫度、濕度、風速等詳細資訊
- 📅 **7天預報** - 未來一週的天氣趨勢預測
- 🏙️ **多城市管理** - 新增、管理多個城市的天氣資訊
- 🔍 **城市搜尋** - 快速搜尋全球城市
- 📍 **定位服務** - 自動獲取當前位置的天氣
- 🎨 **精美動畫** - 天氣圖示和背景動畫效果
- 🌓 **深色模式** - 完整支援淺色/深色模式
- 💾 **本地快取** - 離線查看最近的天氣資訊
- 🔄 **下拉刷新** - 手動更新天氣資料
- 📱 **響應式設計** - 完美支援 iPhone 和 iPad

## 核心功能

### 1. 當前天氣
- 溫度和體感溫度
- 天氣狀況描述和圖示
- 最高/最低溫
- 濕度百分比
- 風速和風向
- 能見度
- 氣壓
- 日出日落時間

### 2. 天氣預報
- 每小時預報（24小時）
- 每日預報（7天）
- 降雨機率
- 溫度趨勢圖表

### 3. 城市管理
- 新增喜愛的城市
- 刪除城市
- 城市排序
- 快速切換城市

### 4. 搜尋功能
- 城市名稱搜尋
- 支援多語言
- 搜尋歷史記錄

## 技術棧

- **語言**: Swift 5.9+
- **框架**: SwiftUI
- **架構**: MVVM
- **最低版本**: iOS 17.0+
- **API**: OpenWeather API
- **網路請求**: URLSession + async/await
- **定位**: CoreLocation
- **資料持久化**: UserDefaults + FileManager
- **圖表**: Swift Charts
- **套件管理**: Swift Package Manager

## 快速開始

### 環境需求

- macOS Sonoma 14.0+
- Xcode 15.0+
- iOS 17.0+ 模擬器或真機
- OpenWeather API Key（免費註冊）

### 獲取 API Key

1. 前往 [OpenWeather](https://openweathermap.org/api) 註冊帳號
2. 在 Dashboard 中生成 API Key
3. 免費方案包含：
   - 每分鐘 60 次調用
   - 當前天氣資料
   - 5天/3小時預報
   - 完全足夠個人使用

### 安裝配置

1. **Clone 專案**:
   ```bash
   git clone <repository-url>
   cd weather-app
   ```

2. **配置 API Key**:

   創建 `Config.swift` 文件（已在 .gitignore 中）:
   ```swift
   // Sources/WeatherApp/Utilities/Config.swift
   enum Config {
       static let openWeatherAPIKey = "YOUR_API_KEY_HERE"
   }
   ```

3. **打開專案**:
   ```bash
   open Package.swift
   ```

4. **運行應用**:
   - 選擇目標設備
   - 點擊運行按鈕 (⌘R)

### 使用 Xcode 專案

如果要創建完整的 Xcode 專案：

1. 打開 Xcode
2. File > New > Project
3. 選擇 "App" 模板
4. 將源代碼複製到專案
5. 配置 Info.plist 權限
6. 運行應用

## 專案結構

```
weather-app/
├── README.md
├── Package.swift
├── .gitignore
├── Sources/
│   └── WeatherApp/
│       ├── WeatherAppApp.swift      # 應用入口
│       ├── Models/                  # 資料模型
│       │   ├── Weather.swift        # 天氣資料模型
│       │   ├── Forecast.swift       # 預報資料模型
│       │   ├── City.swift           # 城市資料模型
│       │   └── WeatherCondition.swift  # 天氣狀況枚舉
│       ├── ViewModels/              # 視圖模型
│       │   ├── WeatherViewModel.swift  # 主要業務邏輯
│       │   └── LocationManager.swift   # 定位管理
│       ├── Views/                   # 視圖組件
│       │   ├── ContentView.swift    # 主視圖
│       │   ├── WeatherDetailView.swift  # 天氣詳情
│       │   ├── ForecastView.swift   # 預報視圖
│       │   ├── CityListView.swift   # 城市列表
│       │   ├── SearchView.swift     # 搜尋視圖
│       │   └── Components/          # UI 組件
│       │       ├── WeatherCard.swift
│       │       ├── ForecastCard.swift
│       │       ├── WeatherIcon.swift
│       │       └── TemperatureChart.swift
│       ├── Services/                # 服務層
│       │   ├── WeatherService.swift # API 服務
│       │   ├── CacheService.swift   # 快取服務
│       │   └── LocationService.swift # 定位服務
│       └── Utilities/               # 工具類
│           ├── Config.swift         # API 配置
│           ├── Extensions.swift     # 擴展方法
│           └── Constants.swift      # 常數定義
└── Tests/
    └── WeatherAppTests/
        └── WeatherViewModelTests.swift
```

## API 整合

### OpenWeather API 端點

```swift
// 當前天氣
GET https://api.openweathermap.org/data/2.5/weather
?q={city name}
&appid={API key}
&units=metric
&lang=zh_tw

// 5天預報
GET https://api.openweathermap.org/data/2.5/forecast
?q={city name}
&appid={API key}
&units=metric
&lang=zh_tw
```

### 資料模型範例

```swift
struct WeatherResponse: Codable {
    let main: Main
    let weather: [WeatherInfo]
    let wind: Wind
    let sys: Sys
    let name: String

    struct Main: Codable {
        let temp: Double
        let feelsLike: Double
        let tempMin: Double
        let tempMax: Double
        let humidity: Int
        let pressure: Int

        enum CodingKeys: String, CodingKey {
            case temp
            case feelsLike = "feels_like"
            case tempMin = "temp_min"
            case tempMax = "temp_max"
            case humidity, pressure
        }
    }

    struct WeatherInfo: Codable {
        let id: Int
        let main: String
        let description: String
        let icon: String
    }

    struct Wind: Codable {
        let speed: Double
        let deg: Int
    }

    struct Sys: Codable {
        let sunrise: Int
        let sunset: Int
    }
}
```

### 網路請求範例

```swift
class WeatherService {
    private let baseURL = "https://api.openweathermap.org/data/2.5"
    private let apiKey = Config.openWeatherAPIKey

    func fetchWeather(for city: String) async throws -> WeatherResponse {
        let urlString = "\(baseURL)/weather?q=\(city)&appid=\(apiKey)&units=metric&lang=zh_tw"

        guard let url = URL(string: urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "") else {
            throw WeatherError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.invalidResponse
        }

        let decoder = JSONDecoder()
        return try decoder.decode(WeatherResponse.self, from: data)
    }
}

enum WeatherError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case cityNotFound
    case networkError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "無效的 URL"
        case .invalidResponse: return "無效的回應"
        case .cityNotFound: return "找不到城市"
        case .networkError: return "網路錯誤"
        }
    }
}
```

## 定位服務

### CoreLocation 整合

```swift
import CoreLocation

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestLocation() {
        manager.requestWhenInUseAuthorization()
        manager.requestLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.first
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("定位錯誤: \(error.localizedDescription)")
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }
}
```

### Info.plist 權限設定

需要在 Info.plist 中添加：

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要您的位置來提供當地天氣資訊</string>
```

## UI 組件範例

### 天氣卡片

```swift
struct WeatherCard: View {
    let weather: Weather

    var body: some View {
        VStack(spacing: 16) {
            // 城市名稱
            Text(weather.cityName)
                .font(.title)
                .fontWeight(.semibold)

            // 天氣圖示
            WeatherIcon(condition: weather.condition, size: 100)

            // 溫度
            Text("\(Int(weather.temperature))°")
                .font(.system(size: 72, weight: .thin))

            // 天氣描述
            Text(weather.description)
                .font(.title3)
                .foregroundStyle(.secondary)

            // 最高/最低溫
            HStack(spacing: 20) {
                Label("\(Int(weather.tempMax))°", systemImage: "arrow.up")
                Label("\(Int(weather.tempMin))°", systemImage: "arrow.down")
            }
            .font(.title3)

            // 其他資訊
            HStack(spacing: 30) {
                InfoItem(icon: "humidity", value: "\(weather.humidity)%", label: "濕度")
                InfoItem(icon: "wind", value: "\(Int(weather.windSpeed)) km/h", label: "風速")
                InfoItem(icon: "eye", value: "\(weather.visibility) km", label: "能見度")
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: weather.condition.gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
```

### 溫度趨勢圖

```swift
import Charts

struct TemperatureChart: View {
    let forecast: [ForecastItem]

    var body: some View {
        Chart(forecast) { item in
            LineMark(
                x: .value("時間", item.date),
                y: .value("溫度", item.temperature)
            )
            .foregroundStyle(.red.gradient)
            .interpolationMethod(.catmullRom)

            AreaMark(
                x: .value("時間", item.date),
                y: .value("溫度", item.temperature)
            )
            .foregroundStyle(.red.opacity(0.1).gradient)
            .interpolationMethod(.catmullRom)
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { _ in
                AxisValueLabel(format: .dateTime.hour())
            }
        }
        .chartYAxis {
            AxisMarks { value in
                AxisValueLabel {
                    Text("\(value.as(Double.self) ?? 0, specifier: "%.0f")°")
                }
            }
        }
        .frame(height: 200)
    }
}
```

## 快取策略

```swift
class CacheService {
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    private let expirationTime: TimeInterval = 600 // 10分鐘

    init() {
        cacheDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("WeatherCache")

        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }

    func save(_ weather: WeatherResponse, for city: String) {
        let fileURL = cacheDirectory.appendingPathComponent("\(city).json")
        let cacheData = CacheData(weather: weather, timestamp: Date())

        if let encoded = try? JSONEncoder().encode(cacheData) {
            try? encoded.write(to: fileURL)
        }
    }

    func load(for city: String) -> WeatherResponse? {
        let fileURL = cacheDirectory.appendingPathComponent("\(city).json")

        guard let data = try? Data(contentsOf: fileURL),
              let cacheData = try? JSONDecoder().decode(CacheData.self, from: data) else {
            return nil
        }

        // 檢查是否過期
        if Date().timeIntervalSince(cacheData.timestamp) > expirationTime {
            return nil
        }

        return cacheData.weather
    }
}

struct CacheData: Codable {
    let weather: WeatherResponse
    let timestamp: Date
}
```

## 進階功能建議

想要擴展這個應用？以下是一些建議：

- 📍 **Widget 支援** - 使用 WidgetKit 在主畫面顯示天氣
- ⚠️ **天氣警報** - 顯示極端天氣警告
- 🗺️ **天氣地圖** - 整合雷達圖和衛星雲圖
- 📊 **歷史數據** - 查看過去的天氣記錄
- 🌡️ **溫度單位** - 支援攝氏/華氏切換
- 🌐 **多語言** - 支援更多語言
- ⌚ **Apple Watch** - 開發 watchOS 版本
- 🔔 **通知** - 天氣變化推送通知
- 🎨 **動態背景** - 根據天氣變化背景
- 📱 **分享功能** - 分享天氣資訊到社交媒體

## 測試

### 單元測試範例

```swift
import XCTest
@testable import WeatherApp

final class WeatherServiceTests: XCTestCase {
    var service: WeatherService!

    override func setUp() {
        service = WeatherService()
    }

    func testFetchWeather() async throws {
        // Given
        let city = "Taipei"

        // When
        let weather = try await service.fetchWeather(for: city)

        // Then
        XCTAssertNotNil(weather)
        XCTAssertEqual(weather.name, "Taipei")
    }

    func testInvalidCity() async {
        // Given
        let city = "InvalidCityNameXYZ123"

        // When/Then
        do {
            _ = try await service.fetchWeather(for: city)
            XCTFail("應該拋出錯誤")
        } catch {
            XCTAssertTrue(error is WeatherError)
        }
    }
}
```

## 效能優化

- ✅ 使用 async/await 進行非同步操作
- ✅ 實作快取機制減少 API 調用
- ✅ 圖片使用 SF Symbols 降低 App 大小
- ✅ 延遲載入和虛擬化長列表
- ✅ 合理使用 @State 和 @Observable

## 常見問題

### Q: API Key 要放在哪裡？
A: 創建 `Config.swift` 文件並加入 .gitignore，避免上傳到版本控制。

### Q: 為什麼天氣資料不準確？
A: OpenWeather 免費版有資料更新延遲，通常是 10-30 分鐘。

### Q: 如何支援更多城市？
A: OpenWeather API 支援全球 20 萬個城市，直接搜尋即可。

### Q: 定位服務無法使用？
A: 確認已在 Info.plist 添加定位權限說明，並在設定中授權 App 使用定位。

## 學習資源

### 官方文檔
- [OpenWeather API 文檔](https://openweathermap.org/api)
- [SwiftUI 教程](https://developer.apple.com/tutorials/swiftui)
- [CoreLocation 指南](https://developer.apple.com/documentation/corelocation)
- [Swift Charts](https://developer.apple.com/documentation/charts)

### 推薦閱讀
- Apple WWDC - SwiftUI 相關 Sessions
- Hacking with Swift - SwiftUI by Example
- Ray Wenderlich - iOS 開發教程

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
**API**: OpenWeather API (免費)
