package com.vibeapps.weatherapp.examples

import com.vibeapps.weatherapp.data.model.Forecast
import com.vibeapps.weatherapp.data.model.Weather
import com.vibeapps.weatherapp.data.model.WeatherUiState

/**
 * Weather App API 使用範例
 *
 * 這個範例展示如何:
 * 1. 獲取當前天氣
 * 2. 獲取天氣預報
 * 3. 處理不同的 UI 狀態
 * 4. 使用測試數據
 * 5. 錯誤處理
 */

/**
 * 範例 1: 創建測試天氣數據
 */
object WeatherTestData {

    /**
     * 台北的天氣數據範例
     */
    fun getTaipeiWeather() = Weather(
        cityName = "台北",
        temperature = 28.5,
        feelsLike = 30.2,
        tempMin = 26.0,
        tempMax = 31.0,
        humidity = 75,
        pressure = 1013,
        windSpeed = 3.5,
        description = "多雲",
        icon = "02d"
    )

    /**
     * 紐約的天氣數據範例
     */
    fun getNewYorkWeather() = Weather(
        cityName = "New York",
        temperature = 15.3,
        feelsLike = 13.8,
        tempMin = 12.0,
        tempMax = 18.0,
        humidity = 60,
        pressure = 1015,
        windSpeed = 5.2,
        description = "晴朗",
        icon = "01d"
    )

    /**
     * 東京的天氣數據範例
     */
    fun getTokyoWeather() = Weather(
        cityName = "東京",
        temperature = 22.0,
        feelsLike = 21.5,
        tempMin = 19.0,
        tempMax = 24.0,
        humidity = 65,
        pressure = 1012,
        windSpeed = 4.0,
        description = "陰天",
        icon = "03d"
    )

    /**
     * 5天天氣預報範例
     */
    fun getFiveDayForecast() = listOf(
        Forecast(
            date = "2025-11-18",
            tempDay = 27.0,
            tempNight = 22.0,
            description = "晴朗",
            icon = "01d",
            humidity = 70,
            windSpeed = 3.0
        ),
        Forecast(
            date = "2025-11-19",
            tempDay = 29.0,
            tempNight = 23.0,
            description = "多雲",
            icon = "02d",
            humidity = 72,
            windSpeed = 3.5
        ),
        Forecast(
            date = "2025-11-20",
            tempDay = 26.0,
            tempNight = 21.0,
            description = "小雨",
            icon = "10d",
            humidity = 80,
            windSpeed = 4.5
        ),
        Forecast(
            date = "2025-11-21",
            tempDay = 25.0,
            tempNight = 20.0,
            description = "陰天",
            icon = "03d",
            humidity = 75,
            windSpeed = 4.0
        ),
        Forecast(
            date = "2025-11-22",
            tempDay = 28.0,
            tempNight = 22.0,
            description = "晴朗",
            icon = "01d",
            humidity = 68,
            windSpeed = 3.2
        )
    )

    /**
     * 獲取各種天氣狀況的範例
     */
    fun getVariousWeatherConditions() = listOf(
        Weather("倫敦", 12.0, 10.5, 10.0, 14.0, 85, 1010, 6.0, "小雨", "10d"),
        Weather("巴黎", 18.0, 17.5, 16.0, 20.0, 65, 1015, 4.0, "多雲", "02d"),
        Weather("柏林", 15.0, 14.0, 13.0, 17.0, 70, 1012, 5.0, "陰天", "03d"),
        Weather("雪梨", 25.0, 24.5, 23.0, 27.0, 60, 1013, 4.5, "晴朗", "01d"),
        Weather("新加坡", 32.0, 35.0, 30.0, 34.0, 85, 1008, 3.0, "雷陣雨", "11d")
    )
}

/**
 * 範例 2: ViewModel 使用範例
 */
class WeatherViewModelExample {

    /**
     * 示範如何處理不同的 UI 狀態
     */
    fun handleWeatherUiState(state: WeatherUiState) {
        when (state) {
            is WeatherUiState.Loading -> {
                println("⏳ 載入天氣數據中...")
            }

            is WeatherUiState.Success -> {
                println("✅ 成功獲取天氣數據")
                displayWeather(state.weather)
                displayForecast(state.forecast)
            }

            is WeatherUiState.Error -> {
                println("❌ 錯誤: ${state.message}")
                handleError(state.message)
            }
        }
    }

    /**
     * 顯示當前天氣
     */
    private fun displayWeather(weather: Weather) {
        println("""
            🌤️ ${weather.cityName} 當前天氣:
            溫度: ${weather.temperature}°C (體感: ${weather.feelsLike}°C)
            狀況: ${weather.description}
            濕度: ${weather.humidity}%
            氣壓: ${weather.pressure} hPa
            風速: ${weather.windSpeed} m/s
            溫度範圍: ${weather.tempMin}°C ~ ${weather.tempMax}°C
        """.trimIndent())
    }

    /**
     * 顯示天氣預報
     */
    private fun displayForecast(forecast: List<Forecast>) {
        println("\n📅 未來 ${forecast.size} 天預報:")
        forecast.forEach { day ->
            println("""
                ${day.date}: ${day.description}
                  白天 ${day.tempDay}°C / 夜晚 ${day.tempNight}°C
                  濕度 ${day.humidity}%, 風速 ${day.windSpeed} m/s
            """.trimIndent())
        }
    }

    /**
     * 錯誤處理
     */
    private fun handleError(message: String) {
        when {
            message.contains("network", ignoreCase = true) -> {
                println("💡 提示: 請檢查網路連接")
            }
            message.contains("api key", ignoreCase = true) -> {
                println("💡 提示: 請檢查 API 金鑰設定")
            }
            message.contains("not found", ignoreCase = true) -> {
                println("💡 提示: 找不到該城市,請檢查城市名稱")
            }
            else -> {
                println("💡 提示: 發生未知錯誤,請稍後再試")
            }
        }
    }
}

/**
 * 範例 3: 溫度單位轉換
 */
object TemperatureConverter {

    /**
     * 攝氏轉華氏
     */
    fun celsiusToFahrenheit(celsius: Double): Double {
        return celsius * 9 / 5 + 32
    }

    /**
     * 華氏轉攝氏
     */
    fun fahrenheitToCelsius(fahrenheit: Double): Double {
        return (fahrenheit - 32) * 5 / 9
    }

    /**
     * 格式化溫度顯示
     */
    fun formatTemperature(temp: Double, useFahrenheit: Boolean = false): String {
        return if (useFahrenheit) {
            "${celsiusToFahrenheit(temp).toInt()}°F"
        } else {
            "${temp.toInt()}°C"
        }
    }
}

/**
 * 範例 4: 天氣圖標映射
 */
object WeatherIconMapper {

    /**
     * OpenWeatherMap 圖標代碼到 emoji 的映射
     */
    fun getWeatherEmoji(iconCode: String): String {
        return when (iconCode.take(2)) {
            "01" -> "☀️" // 晴朗
            "02" -> "⛅" // 少雲
            "03" -> "☁️" // 多雲
            "04" -> "☁️" // 陰天
            "09" -> "🌧️" // 陣雨
            "10" -> "🌦️" // 雨
            "11" -> "⛈️" // 雷雨
            "13" -> "❄️" // 雪
            "50" -> "🌫️" // 霧
            else -> "🌡️"
        }
    }

    /**
     * 根據溫度獲取顏色建議 (16進位顏色碼)
     */
    fun getTemperatureColor(temp: Double): String {
        return when {
            temp >= 35 -> "#FF5722" // 極熱 - 深橘紅
            temp >= 30 -> "#FF9800" // 炎熱 - 橘色
            temp >= 25 -> "#FFC107" // 溫暖 - 琥珀色
            temp >= 20 -> "#4CAF50" // 舒適 - 綠色
            temp >= 15 -> "#2196F3" // 涼爽 - 藍色
            temp >= 10 -> "#03A9F4" // 冷 - 淺藍
            else -> "#00BCD4" // 寒冷 - 青色
        }
    }
}

/**
 * 主函數 - 執行所有範例
 */
fun main() {
    println("🌦️ Weather App 使用範例\n")

    // 範例 1: 顯示測試數據
    println("=" .repeat(50))
    println("範例 1: 使用測試天氣數據")
    println("=" .repeat(50))

    val viewModelExample = WeatherViewModelExample()
    val taipeiWeather = WeatherTestData.getTaipeiWeather()
    val forecast = WeatherTestData.getFiveDayForecast()

    viewModelExample.handleWeatherUiState(
        WeatherUiState.Success(taipeiWeather, forecast)
    )

    // 範例 2: 溫度轉換
    println("\n" + "=".repeat(50))
    println("範例 2: 溫度單位轉換")
    println("=".repeat(50))

    val temp = 28.5
    println("${temp}°C = ${TemperatureConverter.celsiusToFahrenheit(temp).toInt()}°F")
    println("格式化: ${TemperatureConverter.formatTemperature(temp)}")
    println("格式化 (華氏): ${TemperatureConverter.formatTemperature(temp, true)}")

    // 範例 3: 天氣圖標
    println("\n" + "=".repeat(50))
    println("範例 3: 天氣圖標和顏色")
    println("=".repeat(50))

    listOf("01d", "02d", "03d", "10d", "11d", "13d").forEach { icon ->
        println("${icon} -> ${WeatherIconMapper.getWeatherEmoji(icon)}")
    }

    println("\n溫度顏色映射:")
    listOf(5.0, 15.0, 25.0, 35.0).forEach { temp ->
        println("${temp}°C -> ${WeatherIconMapper.getTemperatureColor(temp)}")
    }

    // 範例 4: 多個城市
    println("\n" + "=".repeat(50))
    println("範例 4: 多個城市天氣")
    println("=".repeat(50))

    WeatherTestData.getVariousWeatherConditions().forEach { weather ->
        val emoji = WeatherIconMapper.getWeatherEmoji(weather.icon)
        println("$emoji ${weather.cityName}: ${weather.temperature}°C, ${weather.description}")
    }

    // 範例 5: 錯誤處理
    println("\n" + "=".repeat(50))
    println("範例 5: 錯誤處理")
    println("=".repeat(50))

    listOf(
        "Network error: Unable to connect",
        "Invalid API key provided",
        "City not found",
        "Unknown error occurred"
    ).forEach { errorMsg ->
        viewModelExample.handleWeatherUiState(WeatherUiState.Error(errorMsg))
        println()
    }

    println("✨ 所有範例執行完成!")
    println("""

        💡 如何在您的專案中使用:

        1. 在 ViewModel 中:
        ```kotlin
        val testWeather = WeatherTestData.getTaipeiWeather()
        _uiState.value = WeatherUiState.Success(testWeather, forecast)
        ```

        2. 在 Compose UI 中:
        ```kotlin
        val emoji = WeatherIconMapper.getWeatherEmoji(weather.icon)
        val color = WeatherIconMapper.getTemperatureColor(weather.temperature)
        ```

        3. 溫度轉換:
        ```kotlin
        val fahrenheit = TemperatureConverter.celsiusToFahrenheit(celsius)
        ```
    """.trimIndent())
}
