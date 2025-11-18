package com.vibeapps.todoapp.data.dao

import androidx.room.*
import com.vibeapps.todoapp.data.model.Todo
import kotlinx.coroutines.flow.Flow

/**
 * Todo DAO (Data Access Object)
 * 定義資料庫操作介面
 */
@Dao
interface TodoDao {
    /**
     * 取得所有待辦事項，按創建時間降序排列
     */
    @Query("SELECT * FROM todos ORDER BY createdAt DESC")
    fun getAllTodos(): Flow<List<Todo>>

    /**
     * 取得所有未完成的待辦事項
     */
    @Query("SELECT * FROM todos WHERE isCompleted = 0 ORDER BY createdAt DESC")
    fun getActiveTodos(): Flow<List<Todo>>

    /**
     * 取得所有已完成的待辦事項
     */
    @Query("SELECT * FROM todos WHERE isCompleted = 1 ORDER BY createdAt DESC")
    fun getCompletedTodos(): Flow<List<Todo>>

    /**
     * 插入新的待辦事項
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTodo(todo: Todo)

    /**
     * 更新待辦事項
     */
    @Update
    suspend fun updateTodo(todo: Todo)

    /**
     * 刪除待辦事項
     */
    @Delete
    suspend fun deleteTodo(todo: Todo)

    /**
     * 刪除所有已完成的待辦事項
     */
    @Query("DELETE FROM todos WHERE isCompleted = 1")
    suspend fun deleteCompletedTodos()

    /**
     * 根據標題搜尋待辦事項
     */
    @Query("SELECT * FROM todos WHERE title LIKE '%' || :query || '%' ORDER BY createdAt DESC")
    fun searchTodos(query: String): Flow<List<Todo>>

    /**
     * 根據標題和描述搜尋待辦事項
     */
    @Query("SELECT * FROM todos WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%' ORDER BY createdAt DESC")
    fun searchTodosInTitleAndDescription(query: String): Flow<List<Todo>>

    /**
     * 根據分類獲取待辦事項
     */
    @Query("SELECT * FROM todos WHERE category = :category ORDER BY createdAt DESC")
    fun getTodosByCategory(category: String): Flow<List<Todo>>

    /**
     * 根據優先級獲取待辦事項
     */
    @Query("SELECT * FROM todos WHERE priority = :priority ORDER BY createdAt DESC")
    fun getTodosByPriority(priority: String): Flow<List<Todo>>

    /**
     * 獲取即將到期的待辦事項
     */
    @Query("SELECT * FROM todos WHERE isCompleted = 0 AND dueDate IS NOT NULL AND dueDate <= :timestamp ORDER BY dueDate ASC")
    fun getUpcomingTodos(timestamp: Long): Flow<List<Todo>>

    /**
     * 獲取已過期的待辦事項
     */
    @Query("SELECT * FROM todos WHERE isCompleted = 0 AND dueDate IS NOT NULL AND dueDate < :currentTime ORDER BY dueDate ASC")
    fun getOverdueTodos(currentTime: Long): Flow<List<Todo>>

    /**
     * 獲取今日創建的待辦事項
     */
    @Query("SELECT * FROM todos WHERE createdAt >= :startOfDay AND createdAt < :endOfDay ORDER BY createdAt DESC")
    fun getTodosCreatedToday(startOfDay: Long, endOfDay: Long): Flow<List<Todo>>

    /**
     * 獲取所有不同的分類
     */
    @Query("SELECT DISTINCT category FROM todos WHERE category != '' ORDER BY category ASC")
    fun getAllCategories(): Flow<List<String>>

    /**
     * 獲取待辦事項總數
     */
    @Query("SELECT COUNT(*) FROM todos")
    suspend fun getTodoCount(): Int

    /**
     * 獲取已完成的待辦事項數量
     */
    @Query("SELECT COUNT(*) FROM todos WHERE isCompleted = 1")
    suspend fun getCompletedCount(): Int

    /**
     * 獲取未完成的待辦事項數量
     */
    @Query("SELECT COUNT(*) FROM todos WHERE isCompleted = 0")
    suspend fun getPendingCount(): Int
}
