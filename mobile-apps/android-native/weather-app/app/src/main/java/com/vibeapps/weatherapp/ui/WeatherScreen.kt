package com.vibeapps.weatherapp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vibeapps.weatherapp.data.model.Forecast
import com.vibeapps.weatherapp.data.model.Weather
import com.vibeapps.weatherapp.data.model.WeatherUiState

/**
 * Weather Screen with AI Enhancements
 * 天气主界面，集成 AI 建议功能
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeatherScreen(
    viewModel: WeatherViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentCity by viewModel.currentCity.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val citySuggestions by viewModel.citySuggestions.collectAsState()

    val clothingAdvice by viewModel.clothingAdvice.collectAsState()
    val activityAdvice by viewModel.activityAdvice.collectAsState()
    val healthAdvice by viewModel.healthAdvice.collectAsState()
    val weatherSummary by viewModel.weatherSummary.collectAsState()
    val comfortLevel by viewModel.comfortLevel.collectAsState()

    var showSearchDialog by remember { mutableStateOf(false) }
    var expandedAdvice by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI 智能天气") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ),
                actions = {
                    IconButton(onClick = { showSearchDialog = true }) {
                        Icon(
                            Icons.Default.Search,
                            contentDescription = "搜索城市",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "刷新",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is WeatherUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("加载天气数据中...")
                    }
                }
            }

            is WeatherUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            Icons.Default.Error,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = state.message,
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("重试")
                        }
                    }
                }
            }

            is WeatherUiState.Success -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 当前天气卡片
                    item {
                        CurrentWeatherCard(
                            weather = state.weather,
                            comfortLevel = comfortLevel
                        )
                    }

                    // AI 摘要卡片
                    if (weatherSummary.isNotEmpty()) {
                        item {
                            AIAdviceCard(
                                title = "智能分析",
                                icon = Icons.Default.Psychology,
                                content = weatherSummary,
                                isExpanded = expandedAdvice == "summary",
                                onToggle = {
                                    expandedAdvice = if (expandedAdvice == "summary") null else "summary"
                                }
                            )
                        }
                    }

                    // 穿衣建议
                    if (clothingAdvice.isNotEmpty()) {
                        item {
                            AIAdviceCard(
                                title = "穿衣建议",
                                icon = Icons.Default.Checkroom,
                                content = clothingAdvice,
                                isExpanded = expandedAdvice == "clothing",
                                onToggle = {
                                    expandedAdvice = if (expandedAdvice == "clothing") null else "clothing"
                                }
                            )
                        }
                    }

                    // 活动建议
                    if (activityAdvice.isNotEmpty()) {
                        item {
                            AIAdviceCard(
                                title = "活动建议",
                                icon = Icons.Default.DirectionsRun,
                                content = activityAdvice,
                                isExpanded = expandedAdvice == "activity",
                                onToggle = {
                                    expandedAdvice = if (expandedAdvice == "activity") null else "activity"
                                }
                            )
                        }
                    }

                    // 健康提示
                    if (healthAdvice.isNotEmpty()) {
                        item {
                            AIAdviceCard(
                                title = "健康提示",
                                icon = Icons.Default.HealthAndSafety,
                                content = healthAdvice,
                                isExpanded = expandedAdvice == "health",
                                onToggle = {
                                    expandedAdvice = if (expandedAdvice == "health") null else "health"
                                }
                            )
                        }
                    }

                    // 未来天气预报
                    if (state.forecast.isNotEmpty()) {
                        item {
                            Text(
                                text = "未来天气",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        items(state.forecast) { forecast ->
                            ForecastCard(forecast = forecast)
                        }
                    }
                }
            }
        }
    }

    // 搜索对话框
    if (showSearchDialog) {
        CitySearchDialog(
            searchQuery = searchQuery,
            suggestions = citySuggestions,
            onSearchQueryChange = { viewModel.updateSearchQuery(it) },
            onCitySelect = {
                viewModel.selectCity(it)
                showSearchDialog = false
            },
            onDismiss = {
                showSearchDialog = false
                viewModel.updateSearchQuery("")
            }
        )
    }
}

@Composable
fun CurrentWeatherCard(
    weather: Weather,
    comfortLevel: com.vibeapps.weatherapp.data.ai.ComfortLevel?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = weather.cityName,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "${weather.temperature.toInt()}°C",
                style = MaterialTheme.typography.displayLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = weather.description,
                style = MaterialTheme.typography.titleMedium
            )
            comfortLevel?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${it.emoji} ${it.description}",
                    style = MaterialTheme.typography.bodyLarge
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                WeatherDetailItem("体感", "${weather.feelsLike.toInt()}°C")
                WeatherDetailItem("湿度", "${weather.humidity}%")
                WeatherDetailItem("风速", "${weather.windSpeed}m/s")
            }
        }
    }
}

@Composable
fun WeatherDetailItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun AIAdviceCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: String,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                IconButton(onClick = onToggle) {
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (isExpanded) "收起" else "展开"
                    )
                }
            }

            if (isExpanded) {
                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.5
                )
            }
        }
    }
}

@Composable
fun ForecastCard(forecast: Forecast) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = forecast.date,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = forecast.description,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )
            Text(
                text = "${forecast.tempDay.toInt()}° / ${forecast.tempNight.toInt()}°",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.End
            )
        }
    }
}

@Composable
fun CitySearchDialog(
    searchQuery: String,
    suggestions: List<String>,
    onSearchQueryChange: (String) -> Unit,
    onCitySelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("搜索城市") },
        text = {
            Column {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    label = { Text("城市名称") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                if (suggestions.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    suggestions.forEach { city ->
                        TextButton(
                            onClick = { onCitySelect(city) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = city, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}
