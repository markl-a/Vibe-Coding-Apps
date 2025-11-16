import Foundation

class WeatherService {
    static let shared = WeatherService()

    private init() {}

    func fetchWeather(for city: String) async throws -> Weather {
        let urlString = Config.weatherURL(for: city)

        guard let encodedURL = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: encodedURL) else {
            throw WeatherError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw WeatherError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 404 {
                throw WeatherError.cityNotFound
            }
            throw WeatherError.networkError
        }

        let decoder = JSONDecoder()
        let weatherResponse = try decoder.decode(WeatherResponse.self, from: data)

        return Weather(from: weatherResponse)
    }

    func fetchWeather(latitude: Double, longitude: Double) async throws -> Weather {
        let urlString = Config.weatherURL(lat: latitude, lon: longitude)

        guard let url = URL(string: urlString) else {
            throw WeatherError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.networkError
        }

        let decoder = JSONDecoder()
        let weatherResponse = try decoder.decode(WeatherResponse.self, from: data)

        return Weather(from: weatherResponse)
    }
}

enum WeatherError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case cityNotFound
    case networkError
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "無效的 URL"
        case .invalidResponse:
            return "無效的回應"
        case .cityNotFound:
            return "找不到城市"
        case .networkError:
            return "網路錯誤，請檢查網路連線"
        case .decodingError:
            return "資料解析錯誤"
        }
    }
}
