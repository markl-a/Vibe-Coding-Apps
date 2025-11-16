package com.vibeapps.notes.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

/**
 * 筆記列表畫面
 *
 * 實作說明：
 * 1. 顯示所有筆記（卡片式佈局）
 * 2. 釘選的筆記顯示在頂部
 * 3. 支援搜尋功能
 * 4. FAB 新增筆記按鈕
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteListScreen(
    //viewModel: NoteListViewModel = hiltViewModel()
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("我的筆記") },
                actions = {
                    IconButton(onClick = { /* 實作搜尋功能 */ }) {
                        Icon(Icons.Default.Search, "搜尋")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* 新增筆記 */ }) {
                Icon(Icons.Default.Add, "新增筆記")
            }
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
                    筆記應用範例

                    請實作：
                    1. 筆記列表顯示
                    2. Markdown 編輯器
                    3. 資料夾分類功能
                    4. 搜尋和篩選
                    5. 釘選和顏色標記
                """.trimIndent(),
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
