package com.vibeapps.todoapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibeapps.todoapp.data.dao.TodoDao
import com.vibeapps.todoapp.data.model.Priority
import com.vibeapps.todoapp.data.model.Todo
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Todo ViewModel
 * 管理待辦事項的業務邏輯和 UI 狀態
 */
@HiltViewModel
class TodoViewModel @Inject constructor(
    private val todoDao: TodoDao
) : ViewModel() {

    /**
     * 所有待辦事項的 StateFlow
     * 自動訂閱資料庫變更
     */
    val todos = todoDao.getAllTodos()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    /**
     * 新增待辦事項
     */
    fun addTodo(title: String, description: String = "", priority: Priority = Priority.MEDIUM) {
        if (title.isBlank()) return

        viewModelScope.launch {
            todoDao.insertTodo(
                Todo(
                    title = title.trim(),
                    description = description.trim(),
                    priority = priority
                )
            )
        }
    }

    /**
     * 切換待辦事項的完成狀態
     */
    fun toggleTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.updateTodo(todo.copy(isCompleted = !todo.isCompleted))
        }
    }

    /**
     * 更新待辦事項
     */
    fun updateTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.updateTodo(todo)
        }
    }

    /**
     * 刪除待辦事項
     */
    fun deleteTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.deleteTodo(todo)
        }
    }

    /**
     * 刪除所有已完成的待辦事項
     */
    fun clearCompleted() {
        viewModelScope.launch {
            todoDao.deleteCompletedTodos()
        }
    }
}
