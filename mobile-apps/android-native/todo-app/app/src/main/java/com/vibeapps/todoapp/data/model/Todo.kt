package com.vibeapps.todoapp.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

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
    val priority: Priority = Priority.MEDIUM,
    val category: String = "",
    val tags: List<String> = emptyList(),
    val dueDate: Long? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * 優先級枚舉
 */
enum class Priority {
    LOW,
    MEDIUM,
    HIGH
}

/**
 * Room TypeConverter for List<String>
 */
class Converters {
    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return Json.encodeToString(value)
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        return if (value.isEmpty()) {
            emptyList()
        } else {
            try {
                Json.decodeFromString(value)
            } catch (e: Exception) {
                emptyList()
            }
        }
    }
}

/**
 * Todo 统计数据
 */
@Serializable
data class TodoStats(
    val total: Int,
    val completed: Int,
    val pending: Int,
    val highPriority: Int,
    val mediumPriority: Int,
    val lowPriority: Int,
    val completionRate: Float
)
