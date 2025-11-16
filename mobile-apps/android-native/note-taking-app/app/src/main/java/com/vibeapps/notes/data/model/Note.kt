package com.vibeapps.notes.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 筆記資料模型
 */
@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val content: String,
    val folderId: Long? = null,
    val color: Int = 0,
    val isPinned: Boolean = false,
    val isLocked: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * 資料夾資料模型
 */
@Entity(tableName = "folders")
data class Folder(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val color: Int = 0,
    val icon: String = "folder",
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * 標籤資料模型
 */
@Entity(tableName = "tags")
data class Tag(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val color: Int = 0
)

/**
 * 筆記顏色常數
 */
object NoteColors {
    const val DEFAULT = 0xFFFFFFFF.toInt()
    const val RED = 0xFFFFCDD2.toInt()
    const val ORANGE = 0xFFFFE0B2.toInt()
    const val YELLOW = 0xFFFFF9C4.toInt()
    const val GREEN = 0xFFC8E6C9.toInt()
    const val BLUE = 0xFFBBDEFB.toInt()
    const val PURPLE = 0xFFE1BEE7.toInt()

    val colors = listOf(DEFAULT, RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE)
}
