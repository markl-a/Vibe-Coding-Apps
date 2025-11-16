import Foundation
import SwiftUI

// MARK: - API Response Models

struct WeatherResponse: Codable {
    let coord: Coordinates
    let weather: [WeatherInfo]
    let main: MainWeather
    let wind: Wind
    let sys: System
    let name: String
    let dt: Int

    struct Coordinates: Codable {
        let lat: Double
        let lon: Double
    }

    struct WeatherInfo: Codable {
        let id: Int
        let main: String
        let description: String
        let icon: String
    }

    struct MainWeather: Codable {
        let temp: Double
        let feelsLike: Double
        let tempMin: Double
        let tempMax: Double
        let pressure: Int
        let humidity: Int

        enum CodingKeys: String, CodingKey {
            case temp
            case feelsLike = "feels_like"
            case tempMin = "temp_min"
            case tempMax = "temp_max"
            case pressure, humidity
        }
    }

    struct Wind: Codable {
        let speed: Double
        let deg: Int?
    }

    struct System: Codable {
        let sunrise: Int
        let sunset: Int
    }
}

// MARK: - App Models

struct Weather: Identifiable {
    let id = UUID()
    let cityName: String
    let temperature: Double
    let feelsLike: Double
    let tempMin: Double
    let tempMax: Double
    let description: String
    let condition: WeatherCondition
    let humidity: Int
    let windSpeed: Double
    let windDirection: Int?
    let pressure: Int
    let sunrise: Date
    let sunset: Date
    let timestamp: Date

    init(from response: WeatherResponse) {
        self.cityName = response.name
        self.temperature = response.main.temp
        self.feelsLike = response.main.feelsLike
        self.tempMin = response.main.tempMin
        self.tempMax = response.main.tempMax
        self.description = response.weather.first?.description.capitalized ?? ""
        self.condition = WeatherCondition(id: response.weather.first?.id ?? 800)
        self.humidity = response.main.humidity
        self.windSpeed = response.wind.speed
        self.windDirection = response.wind.deg
        self.pressure = response.main.pressure
        self.sunrise = Date(timeIntervalSince1970: TimeInterval(response.sys.sunrise))
        self.sunset = Date(timeIntervalSince1970: TimeInterval(response.sys.sunset))
        self.timestamp = Date(timeIntervalSince1970: TimeInterval(response.dt))
    }

    var temperatureString: String {
        "\(Int(temperature))°"
    }

    var feelsLikeString: String {
        "體感 \(Int(feelsLike))°"
    }

    var windSpeedString: String {
        "\(Int(windSpeed * 3.6)) km/h"
    }
}

enum WeatherCondition {
    case clear
    case cloudy
    case rain
    case snow
    case thunderstorm
    case drizzle
    case mist

    init(id: Int) {
        switch id {
        case 200..<300:
            self = .thunderstorm
        case 300..<400:
            self = .drizzle
        case 500..<600:
            self = .rain
        case 600..<700:
            self = .snow
        case 700..<800:
            self = .mist
        case 800:
            self = .clear
        default:
            self = .cloudy
        }
    }

    var icon: String {
        switch self {
        case .clear:
            return "sun.max.fill"
        case .cloudy:
            return "cloud.fill"
        case .rain:
            return "cloud.rain.fill"
        case .snow:
            return "cloud.snow.fill"
        case .thunderstorm:
            return "cloud.bolt.rain.fill"
        case .drizzle:
            return "cloud.drizzle.fill"
        case .mist:
            return "cloud.fog.fill"
        }
    }

    var gradientColors: [Color] {
        switch self {
        case .clear:
            return [.orange, .yellow]
        case .cloudy:
            return [.gray, .blue.opacity(0.5)]
        case .rain, .drizzle:
            return [.blue, .cyan]
        case .snow:
            return [.white, .blue.opacity(0.3)]
        case .thunderstorm:
            return [.purple, .indigo]
        case .mist:
            return [.gray.opacity(0.7), .gray]
        }
    }
}
