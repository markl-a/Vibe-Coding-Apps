import Foundation

/// API 配置
/// ⚠️ 注意：請將您的 OpenWeather API Key 填入下方
/// 獲取 API Key: https://openweathermap.org/api
enum Config {
    /// OpenWeather API Key
    /// 免費方案：每分鐘 60 次調用，完全足夠個人使用
    static let openWeatherAPIKey = "YOUR_API_KEY_HERE"

    /// API 基礎 URL
    static let baseURL = "https://api.openweathermap.org/data/2.5"

    /// 溫度單位：metric (攝氏), imperial (華氏), standard (開爾文)
    static let units = "metric"

    /// 語言：zh_tw (繁體中文), zh_cn (簡體中文), en (英文)
    static let language = "zh_tw"
}

// MARK: - API 端點

extension Config {
    /// 當前天氣 API
    static func weatherURL(for city: String) -> String {
        return "\(baseURL)/weather?q=\(city)&appid=\(openWeatherAPIKey)&units=\(units)&lang=\(language)"
    }

    /// 5天預報 API
    static func forecastURL(for city: String) -> String {
        return "\(baseURL)/forecast?q=\(city)&appid=\(openWeatherAPIKey)&units=\(units)&lang=\(language)"
    }

    /// 經緯度天氣 API
    static func weatherURL(lat: Double, lon: Double) -> String {
        return "\(baseURL)/weather?lat=\(lat)&lon=\(lon)&appid=\(openWeatherAPIKey)&units=\(units)&lang=\(language)"
    }
}
