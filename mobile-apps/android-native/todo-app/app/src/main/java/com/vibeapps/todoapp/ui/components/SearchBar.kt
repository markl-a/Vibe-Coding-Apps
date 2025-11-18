package com.vibeapps.todoapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vibeapps.todoapp.ui.FilterType

/**
 * 搜索栏组件
 * 支持搜索和过滤功能
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoSearchBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    filterType: FilterType,
    onFilterChange: (FilterType) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // 搜索框
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("搜索任务...") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "搜索"
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchQueryChange("") }) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "清除"
                        )
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(24.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 过滤按钮
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = filterType == FilterType.ALL,
                onClick = { onFilterChange(FilterType.ALL) },
                label = { Text("全部") },
                leadingIcon = if (filterType == FilterType.ALL) {
                    {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else null
            )

            FilterChip(
                selected = filterType == FilterType.ACTIVE,
                onClick = { onFilterChange(FilterType.ACTIVE) },
                label = { Text("待完成") },
                leadingIcon = if (filterType == FilterType.ACTIVE) {
                    {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else null
            )

            FilterChip(
                selected = filterType == FilterType.COMPLETED,
                onClick = { onFilterChange(FilterType.COMPLETED) },
                label = { Text("已完成") },
                leadingIcon = if (filterType == FilterType.COMPLETED) {
                    {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else null
            )
        }
    }
}
