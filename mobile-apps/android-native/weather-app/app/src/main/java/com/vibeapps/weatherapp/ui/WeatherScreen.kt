package com.vibeapps.weatherapp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

/**
 * 天氣主畫面
 *
 * 實作說明：
 * 1. 使用 WeatherViewModel 管理狀態
 * 2. 顯示搜尋欄、當前天氣、預報列表
 * 3. 處理載入中、成功、錯誤狀態
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeatherScreen(
    viewModel: WeatherViewModel = hiltViewModel()
) {
    var city by remember { mutableStateOf("Taipei") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("天氣預報") },
                actions = {
                    IconButton(onClick = { /* 實作搜尋功能 */ }) {
                        Icon(Icons.Default.Search, "搜尋")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = """
                    天氣應用範例

                    請實作：
                    1. 整合天氣 API (OpenWeatherMap)
                    2. 顯示當前天氣
                    3. 顯示多日預報
                    4. 實作搜尋功能
                """.trimIndent(),
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
