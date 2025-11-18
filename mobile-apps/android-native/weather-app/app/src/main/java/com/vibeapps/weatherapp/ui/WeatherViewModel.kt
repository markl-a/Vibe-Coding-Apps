package com.vibeapps.weatherapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibeapps.weatherapp.data.ai.ComfortLevel
import com.vibeapps.weatherapp.data.ai.WeatherAIService
import com.vibeapps.weatherapp.data.model.Forecast
import com.vibeapps.weatherapp.data.model.Weather
import com.vibeapps.weatherapp.data.model.WeatherUiState
import com.vibeapps.weatherapp.data.repository.WeatherRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Weather ViewModel
 * 管理天气数据和 AI 建议
 */
@HiltViewModel
class WeatherViewModel @Inject constructor(
    private val repository: WeatherRepository,
    private val aiService: WeatherAIService
) : ViewModel() {

    private val _uiState = MutableStateFlow<WeatherUiState>(WeatherUiState.Loading)
    val uiState: StateFlow<WeatherUiState> = _uiState.asStateFlow()

    private val _currentCity = MutableStateFlow("Taipei")
    val currentCity: StateFlow<String> = _currentCity.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _citySuggestions = MutableStateFlow<List<String>>(emptyList())
    val citySuggestions: StateFlow<List<String>> = _citySuggestions.asStateFlow()

    // AI 建议状态
    private val _clothingAdvice = MutableStateFlow("")
    val clothingAdvice: StateFlow<String> = _clothingAdvice.asStateFlow()

    private val _activityAdvice = MutableStateFlow("")
    val activityAdvice: StateFlow<String> = _activityAdvice.asStateFlow()

    private val _healthAdvice = MutableStateFlow("")
    val healthAdvice: StateFlow<String> = _healthAdvice.asStateFlow()

    private val _weatherSummary = MutableStateFlow("")
    val weatherSummary: StateFlow<String> = _weatherSummary.asStateFlow()

    private val _comfortLevel = MutableStateFlow<ComfortLevel?>(null)
    val comfortLevel: StateFlow<ComfortLevel?> = _comfortLevel.asStateFlow()

    init {
        // 初始加载默认城市天气
        loadWeather(_currentCity.value)
    }

    /**
     * 加载指定城市的天气
     */
    fun loadWeather(city: String) {
        viewModelScope.launch {
            _uiState.value = WeatherUiState.Loading
            _currentCity.value = city

            // 并行获取当前天气和预报
            val weatherResult = repository.getCurrentWeather(city)
            val forecastResult = repository.getForecast(city)

            if (weatherResult.isSuccess && forecastResult.isSuccess) {
                val weather = weatherResult.getOrNull()!!
                val forecast = forecastResult.getOrNull()!!

                _uiState.value = WeatherUiState.Success(
                    weather = weather,
                    forecast = forecast
                )

                // 生成 AI 建议
                generateAIAdvice(weather)
            } else {
                val error = weatherResult.exceptionOrNull()
                    ?: forecastResult.exceptionOrNull()
                    ?: Exception("未知错误")
                _uiState.value = WeatherUiState.Error(
                    error.message ?: "获取天气数据失败"
                )
            }
        }
    }

    /**
     * 根据坐标加载天气
     */
    fun loadWeatherByLocation(lat: Double, lon: Double) {
        viewModelScope.launch {
            _uiState.value = WeatherUiState.Loading

            val weatherResult = repository.getCurrentWeatherByLocation(lat, lon)
            val forecastResult = repository.getForecastByLocation(lat, lon)

            if (weatherResult.isSuccess && forecastResult.isSuccess) {
                val weather = weatherResult.getOrNull()!!
                val forecast = forecastResult.getOrNull()!!

                _currentCity.value = weather.cityName

                _uiState.value = WeatherUiState.Success(
                    weather = weather,
                    forecast = forecast
                )

                generateAIAdvice(weather)
            } else {
                _uiState.value = WeatherUiState.Error("获取位置天气失败")
            }
        }
    }

    /**
     * 刷新当前城市天气
     */
    fun refresh() {
        loadWeather(_currentCity.value)
    }

    /**
     * 更新搜索查询
     */
    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
        if (query.isNotBlank()) {
            _citySuggestions.value = repository.searchCities(query)
        } else {
            _citySuggestions.value = emptyList()
        }
    }

    /**
     * 选择城市
     */
    fun selectCity(city: String) {
        _searchQuery.value = ""
        _citySuggestions.value = emptyList()
        loadWeather(city)
    }

    /**
     * 生成所有 AI 建议
     */
    private suspend fun generateAIAdvice(weather: Weather) {
        // 并行生成所有建议
        launch {
            _clothingAdvice.value = aiService.generateClothingAdvice(weather)
        }
        launch {
            _activityAdvice.value = aiService.generateActivityAdvice(weather)
        }
        launch {
            _healthAdvice.value = aiService.generateHealthAdvice(weather)
        }
        launch {
            _weatherSummary.value = aiService.generateWeatherSummary(weather)
        }
        launch {
            _comfortLevel.value = aiService.calculateComfortIndex(weather)
        }
    }

    /**
     * 重新生成 AI 建议
     */
    fun refreshAIAdvice() {
        val currentState = _uiState.value
        if (currentState is WeatherUiState.Success) {
            viewModelScope.launch {
                generateAIAdvice(currentState.weather)
            }
        }
    }
}
