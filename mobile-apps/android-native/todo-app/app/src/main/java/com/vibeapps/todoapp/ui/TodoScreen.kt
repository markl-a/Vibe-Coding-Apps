package com.vibeapps.todoapp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vibeapps.todoapp.ui.components.*

/**
 * 待辦事項主畫面（增強版）
 * 集成 AI 建議、搜索、過濾和統計功能
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoScreen(
    viewModel: TodoViewModel = hiltViewModel()
) {
    val todos by viewModel.todos.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val filterType by viewModel.filterType.collectAsState()
    val aiSuggestions by viewModel.aiSuggestions.collectAsState()
    val aiSummary by viewModel.aiSummary.collectAsState()

    var showDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI 智能待辦") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                ),
                actions = {
                    // 清除已完成項目按鈕
                    if (todos.any { it.isCompleted }) {
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "清除已完成",
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = "新增待辦事項",
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(bottom = 80.dp) // FAB 的空間
        ) {
            // 搜索欄
            item {
                TodoSearchBar(
                    searchQuery = searchQuery,
                    onSearchQueryChange = { viewModel.updateSearchQuery(it) },
                    filterType = filterType,
                    onFilterChange = { viewModel.updateFilter(it) }
                )
            }

            // AI 建議卡片
            if (aiSuggestions.isNotEmpty() && searchQuery.isEmpty()) {
                item {
                    AISuggestionsCard(
                        suggestions = aiSuggestions,
                        onRefresh = { viewModel.refreshAISuggestions() }
                    )
                }
            }

            // 統計卡片
            if (todos.isNotEmpty() && searchQuery.isEmpty()) {
                item {
                    StatsCard(aiSummary = aiSummary)
                }
            }

            // 待辦事項列表
            if (todos.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (searchQuery.isNotEmpty()) {
                                "沒有找到符合的待辦事項"
                            } else {
                                "沒有待辦事項\n點擊 + 新增第一個項目"
                            },
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                items(todos, key = { it.id }) { todo ->
                    TodoItem(
                        todo = todo,
                        onToggle = { viewModel.toggleTodo(todo) },
                        onDelete = { viewModel.deleteTodo(todo) }
                    )
                }
            }
        }
    }

    // 新增待辦事項對話框（帶 AI 功能）
    if (showDialog) {
        AddTodoDialog(
            onDismiss = { showDialog = false },
            onAdd = { title, description, priority ->
                viewModel.addTodo(title, description, priority, useAI = true)
                showDialog = false
            }
        )
    }

    // 清除已完成項目確認對話框
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("清除已完成項目") },
            text = { Text("確定要刪除所有已完成的待辦事項嗎？") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.clearCompleted()
                        showDeleteDialog = false
                    }
                ) {
                    Text("確定")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("取消")
                }
            }
        )
    }
}
