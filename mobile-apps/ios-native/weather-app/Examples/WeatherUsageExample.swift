import Foundation

/// iOS Weather App 使用範例
/// 展示如何使用天氣 API 和資料模型

// MARK: - 測試數據

struct WeatherTestData {
    /// 創建測試天氣數據
    static func createSampleWeather(city: String) -> Weather {
        Weather(
            city: city,
            temperature: 25.0,
            condition: "晴朗",
            humidity: 65,
            windSpeed: 3.5,
            icon: "sun.max.fill"
        )
    }

    /// 多個城市範例
    static func getSampleCities() -> [Weather] {
        [
            Weather(city: "台北", temperature: 28.0, condition: "多雲", humidity: 75, windSpeed: 3.0, icon: "cloud.fill"),
            Weather(city: "紐約", temperature: 15.0, condition: "晴朗", humidity: 60, windSpeed: 5.0, icon: "sun.max.fill"),
            Weather(city: "東京", temperature: 22.0, condition: "陰天", humidity: 70, windSpeed: 4.0, icon: "cloud.sun.fill"),
            Weather(city: "倫敦", temperature: 12.0, condition: "小雨", humidity: 85, windSpeed: 6.0, icon: "cloud.rain.fill"),
        ]
    }
}

/*
 💡 使用方式:

 1. 在 ViewModel 中使用測試數據:
 ```swift
 let testWeather = WeatherTestData.createSampleWeather(city: "台北")
 ```

 2. 顯示多個城市:
 ```swift
 let cities = WeatherTestData.getSampleCities()
 ForEach(cities) { weather in
     WeatherCard(weather: weather)
 }
 ```

 3. API 整合範例:
 ```swift
 class WeatherService {
     func fetchWeather(city: String) async throws -> Weather {
         // API 調用實作
     }
 }
 ```
 */
