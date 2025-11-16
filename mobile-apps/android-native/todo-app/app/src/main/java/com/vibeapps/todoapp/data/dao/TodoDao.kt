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
}
