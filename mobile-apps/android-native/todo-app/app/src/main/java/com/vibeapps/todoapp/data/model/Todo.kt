package com.vibeapps.todoapp.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 待辦事項資料模型
 * 使用 Room Entity 註解標記為資料庫表格
 */
@Entity(tableName = "todos")
data class Todo(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val title: String,
    val description: String = "",
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val priority: Priority = Priority.MEDIUM
)

/**
 * 優先級枚舉
 */
enum class Priority {
    LOW,
    MEDIUM,
    HIGH
}
