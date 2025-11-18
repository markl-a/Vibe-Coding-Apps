package com.vibeapps.todoapp.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
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
import androidx.compose.ui.unit.dp

/**
 * AI 建議卡片組件
 * 顯示 AI 生成的任務建議
 */
@Composable
fun AISuggestionsCard(
    suggestions: List<String>,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(true) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // 標題欄
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
                        imageVector = Icons.Default.Psychology,
                        contentDescription = "AI",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "AI 智能建議",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row {
                    IconButton(onClick = onRefresh) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "刷新建議"
                        )
                    }
                    IconButton(onClick = { isExpanded = !isExpanded }) {
                        Icon(
                            imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = if (isExpanded) "收起" else "展開"
                        )
                    }
                }
            }

            // 建議列表
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                if (suggestions.isEmpty()) {
                    Text(
                        text = "暫無建議，繼續添加任務以獲得更多智能建議！",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                        modifier = Modifier.padding(top = 8.dp)
                    )
                } else {
                    Column(
                        modifier = Modifier.padding(top = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        suggestions.forEach { suggestion ->
                            SuggestionItem(suggestion)
                        }
                    }
                }
            }
        }
    }
}

/**
 * 單個建議項目
 */
@Composable
private fun SuggestionItem(suggestion: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.small,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Default.Lightbulb,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = suggestion,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * 統計卡片組件
 * 顯示任務統計和 AI 分析摘要
 */
@Composable
fun StatsCard(
    aiSummary: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Analytics,
                    contentDescription = "統計",
                    tint = MaterialTheme.colorScheme.tertiary
                )
                Text(
                    text = "任務分析",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (aiSummary.isNotEmpty()) {
                Text(
                    text = aiSummary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
            } else {
                Text(
                    text = "暫無統計數據",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.7f)
                )
            }
        }
    }
}
