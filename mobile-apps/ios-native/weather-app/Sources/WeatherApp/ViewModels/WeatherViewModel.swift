import Foundation
import SwiftUI

@Observable
class WeatherViewModel {
    var weather: Weather?
    var savedCities: [String] = []
    var isLoading = false
    var errorMessage: String?

    private let weatherService = WeatherService.shared
    private let savedCitiesKey = "saved_cities"

    init() {
        loadSavedCities()
    }

    @MainActor
    func fetchWeather(for city: String) async {
        isLoading = true
        errorMessage = nil

        do {
            weather = try await weatherService.fetchWeather(for: city)
            addToSavedCities(city)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    @MainActor
    func refreshWeather() async {
        guard let cityName = weather?.cityName else { return }
        await fetchWeather(for: cityName)
    }

    func addToSavedCities(_ city: String) {
        if !savedCities.contains(city) {
            savedCities.insert(city, at: 0)
            if savedCities.count > 10 {
                savedCities.removeLast()
            }
            saveCities()
        }
    }

    func removeCity(_ city: String) {
        savedCities.removeAll { $0 == city }
        saveCities()
    }

    private func saveCities() {
        UserDefaults.standard.set(savedCities, forKey: savedCitiesKey)
    }

    private func loadSavedCities() {
        savedCities = UserDefaults.standard.stringArray(forKey: savedCitiesKey) ?? []
    }
}
