package com.vibeapps.weatherapp.data.model

import kotlinx.serialization.Serializable

/**
 * 天氣資料模型
 */
@Serializable
data class Weather(
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

/**
 * 預報資料模型
 */
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

/**
 * UI 狀態
 */
sealed class WeatherUiState {
    object Loading : WeatherUiState()
    data class Success(val weather: Weather, val forecast: List<Forecast>) : WeatherUiState()
    data class Error(val message: String) : WeatherUiState()
}
