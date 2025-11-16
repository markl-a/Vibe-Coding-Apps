# Weather App - Android 天氣預報應用

一個使用 Kotlin、Jetpack Compose、Retrofit 和 MVVM 架構打造的現代化天氣預報應用。

## 功能特色

- 🌤️ **即時天氣** - 顯示當前天氣狀況
- 📅 **多日預報** - 5-7 天天氣預報
- 📍 **位置服務** - 自動偵測當前位置
- 🔍 **城市搜尋** - 搜尋全球城市天氣
- 💾 **收藏城市** - 儲存常用城市
- 🎨 **Material Design 3** - 現代化 UI 設計
- 🌙 **深色模式** - 支援深色主題
- 📱 **響應式設計** - 適配不同螢幕尺寸

## 技術棧

- **語言**: Kotlin 1.9+
- **UI 框架**: Jetpack Compose
- **網路請求**: Retrofit 2 + OkHttp
- **JSON 解析**: Kotlinx Serialization
- **圖片載入**: Coil
- **依賴注入**: Hilt
- **架構**: MVVM (Model-View-ViewModel)
- **狀態管理**: StateFlow
- **最小 SDK**: API 24 (Android 7.0)
- **目標 SDK**: API 34 (Android 14)

## 專案結構

```
weather-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/vibeapps/weatherapp/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── WeatherApplication.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── WeatherScreen.kt
│   │   │   │   │   ├── WeatherViewModel.kt
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── CurrentWeatherCard.kt
│   │   │   │   │   │   ├── ForecastItem.kt
│   │   │   │   │   │   └── SearchBar.kt
│   │   │   │   │   └── theme/
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── Weather.kt
│   │   │   │   │   │   └── Forecast.kt
│   │   │   │   │   ├── remote/
│   │   │   │   │   │   ├── WeatherApi.kt
│   │   │   │   │   │   └── dto/
│   │   │   │   │   └── repository/
│   │   │   │   │       └── WeatherRepository.kt
│   │   │   │   └── di/
│   │   │   │       └── AppModule.kt
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

## 快速開始

### 環境需求

- Android Studio Hedgehog (2023.1.1) 或更新版本
- JDK 17+
- Android SDK API 34
- Gradle 8.0+
- 天氣 API 金鑰（OpenWeatherMap 或其他）

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd android-native/weather-app
   ```

2. **設定 API 金鑰**

   在 `local.properties` 中添加：
   ```properties
   WEATHER_API_KEY=your_api_key_here
   ```

   或在 `build.gradle.kts` 中設定：
   ```kotlin
   buildConfigField("String", "API_KEY", "\"your_api_key_here\"")
   ```

3. **獲取 API 金鑰**
   - 註冊 [OpenWeatherMap](https://openweathermap.org/api)
   - 或使用 [WeatherAPI](https://www.weatherapi.com/)
   - 複製 API 金鑰到配置檔

4. **運行應用**
   - 使用 Android Studio 打開專案
   - 等待 Gradle 同步完成
   - 連接設備或啟動模擬器
   - 點擊 Run 按鈕

## API 整合

### OpenWeatherMap API

```kotlin
interface WeatherApi {
    @GET("weather")
    suspend fun getCurrentWeather(
        @Query("q") city: String,
        @Query("appid") apiKey: String,
        @Query("units") units: String = "metric",
        @Query("lang") lang: String = "zh_tw"
    ): WeatherResponse

    @GET("forecast")
    suspend fun getForecast(
        @Query("q") city: String,
        @Query("appid") apiKey: String,
        @Query("units") units: String = "metric",
        @Query("lang") lang: String = "zh_tw"
    ): ForecastResponse
}
```

### 資料模型

```kotlin
@Serializable
data class Weather(
    val id: Int,
    val cityName: String,
    val temperature: Double,
    val feelsLike: Double,
    val tempMin: Double,
    val tempMax: Double,
    val humidity: Int,
    val pressure: Int,
    val windSpeed: Double,
    val description: String,
    val icon: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class Forecast(
    val date: String,
    val tempDay: Double,
    val tempNight: Double,
    val description: String,
    val icon: String,
    val humidity: Int,
    val windSpeed: Double
)
```

### Repository 模式

```kotlin
class WeatherRepository @Inject constructor(
    private val weatherApi: WeatherApi
) {
    suspend fun getCurrentWeather(city: String): Result<Weather> {
        return try {
            val response = weatherApi.getCurrentWeather(
                city = city,
                apiKey = BuildConfig.API_KEY
            )
            Result.success(response.toWeather())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getForecast(city: String): Result<List<Forecast>> {
        return try {
            val response = weatherApi.getForecast(
                city = city,
                apiKey = BuildConfig.API_KEY
            )
            Result.success(response.toForecastList())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### ViewModel

```kotlin
@HiltViewModel
class WeatherViewModel @Inject constructor(
    private val repository: WeatherRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<WeatherUiState>(WeatherUiState.Loading)
    val uiState: StateFlow<WeatherUiState> = _uiState.asStateFlow()

    fun loadWeather(city: String) {
        viewModelScope.launch {
            _uiState.value = WeatherUiState.Loading

            val weatherResult = repository.getCurrentWeather(city)
            val forecastResult = repository.getForecast(city)

            if (weatherResult.isSuccess && forecastResult.isSuccess) {
                _uiState.value = WeatherUiState.Success(
                    weather = weatherResult.getOrNull()!!,
                    forecast = forecastResult.getOrNull()!!
                )
            } else {
                _uiState.value = WeatherUiState.Error(
                    weatherResult.exceptionOrNull()?.message ?: "未知錯誤"
                )
            }
        }
    }
}

sealed class WeatherUiState {
    object Loading : WeatherUiState()
    data class Success(val weather: Weather, val forecast: List<Forecast>) : WeatherUiState()
    data class Error(val message: String) : WeatherUiState()
}
```

## 核心功能

### 1. 當前天氣顯示

顯示：
- 城市名稱
- 當前溫度
- 體感溫度
- 天氣描述
- 天氣圖標
- 濕度、氣壓、風速等

### 2. 多日預報

顯示未來 5-7 天的：
- 日期
- 最高/最低溫度
- 天氣狀況
- 天氣圖標

### 3. 城市搜尋

- 輸入城市名稱
- 即時搜尋建議
- 支援中英文搜尋
- 最近搜尋記錄

### 4. 收藏城市

- 儲存常用城市
- 快速切換城市
- 管理收藏列表

## 依賴項

```kotlin
dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Kotlinx Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    implementation("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")

    // Coil (圖片載入)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Location Services (可選)
    implementation("com.google.android.gms:play-services-location:21.1.0")
}
```

## UI 組件

### CurrentWeatherCard

顯示當前天氣的大卡片，包含：
- 城市名稱
- 溫度（大字體）
- 天氣圖標
- 天氣描述
- 體感溫度、濕度、風速

### ForecastItem

預報列表項目：
- 日期
- 天氣圖標
- 最高/最低溫度
- 簡短描述

### SearchBar

搜尋列：
- 輸入框
- 搜尋按鈕
- 最近搜尋建議

## 進階功能建議

- [ ] GPS 定位自動獲取天氣
- [ ] 天氣警報通知
- [ ] 空氣品質指數 (AQI)
- [ ] 紫外線指數
- [ ] 日出日落時間
- [ ] 小時級別預報
- [ ] 天氣圖表（溫度曲線）
- [ ] Widget 桌面小工具
- [ ] 多種溫度單位切換
- [ ] 離線快取天氣資料

## 權限需求

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 常見問題

### Q: API 請求失敗？

檢查：
1. API 金鑰是否正確
2. 網路連接是否正常
3. 城市名稱是否正確
4. API 配額是否用完

### Q: 如何新增其他天氣 API？

1. 在 `WeatherApi` 介面添加新方法
2. 創建對應的 DTO 類別
3. 更新 Repository 實現
4. 修改 ViewModel 邏輯

### Q: 如何實作位置服務？

```kotlin
// 使用 Google Play Services
val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
fusedLocationClient.lastLocation.addOnSuccessListener { location ->
    // 使用 location.latitude 和 location.longitude
}
```

## 學習重點

這個專案展示了：

1. **Retrofit** - RESTful API 網路請求
2. **Kotlinx Serialization** - JSON 序列化/反序列化
3. **Repository Pattern** - 資料層抽象
4. **Sealed Class** - 狀態管理
5. **Coroutines & Flow** - 異步程式設計
6. **Compose** - 現代化 UI 開發
7. **Hilt** - 依賴注入

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 相關資源

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Retrofit 文檔](https://square.github.io/retrofit/)
- [Jetpack Compose 文檔](https://developer.android.com/jetpack/compose)
- [Coil 圖片載入](https://coil-kt.github.io/coil/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**作者**: Vibe Coding Apps
