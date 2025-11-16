package com.vibeapps.todoapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vibeapps.todoapp.data.model.Priority

/**
 * 新增待辦事項對話框
 * 讓用戶輸入標題、描述和選擇優先級
 */
@Composable
fun AddTodoDialog(
    onDismiss: () -> Unit,
    onAdd: (title: String, description: String, priority: Priority) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedPriority by remember { mutableStateOf(Priority.MEDIUM) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("新增待辦事項") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // 標題輸入框
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("標題 *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    isError = title.isBlank() && title.isNotEmpty()
                )

                // 描述輸入框
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("描述（選填）") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )

                // 優先級選擇
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = getPriorityText(selectedPriority),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("優先級") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )

                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        Priority.values().forEach { priority ->
                            DropdownMenuItem(
                                text = { Text(getPriorityText(priority)) },
                                onClick = {
                                    selectedPriority = priority
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank()) {
                        onAdd(title, description, selectedPriority)
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text("新增")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

/**
 * 取得優先級的顯示文字
 */
private fun getPriorityText(priority: Priority): String {
    return when (priority) {
        Priority.HIGH -> "🔴 高"
        Priority.MEDIUM -> "🟡 中"
        Priority.LOW -> "🟢 低"
    }
}
