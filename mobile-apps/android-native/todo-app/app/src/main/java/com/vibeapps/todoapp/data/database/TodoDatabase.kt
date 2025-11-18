package com.vibeapps.todoapp.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.vibeapps.todoapp.data.dao.TodoDao
import com.vibeapps.todoapp.data.model.Converters
import com.vibeapps.todoapp.data.model.Todo

/**
 * Room 資料庫類別
 * 定義資料庫版本和包含的 Entity
 */
@Database(
    entities = [Todo::class],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class TodoDatabase : RoomDatabase() {
    /**
     * 取得 TodoDao 實例
     */
    abstract fun todoDao(): TodoDao

    companion object {
        const val DATABASE_NAME = "todo_database"
    }
}
