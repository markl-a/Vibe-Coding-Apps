package com.vibeapps.todoapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vibeapps.todoapp.data.ai.AIService
import com.vibeapps.todoapp.data.dao.TodoDao
import com.vibeapps.todoapp.data.model.Priority
import com.vibeapps.todoapp.data.model.Todo
import com.vibeapps.todoapp.data.model.TodoStats
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Todo ViewModel
 * 管理待辦事項的業務邏輯和 UI 狀態
 */
@HiltViewModel
class TodoViewModel @Inject constructor(
    private val todoDao: TodoDao,
    private val aiService: AIService
) : ViewModel() {

    // 搜索查詢
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // 過濾器
    private val _filterType = MutableStateFlow(FilterType.ALL)
    val filterType: StateFlow<FilterType> = _filterType.asStateFlow()

    // AI 建議
    private val _aiSuggestions = MutableStateFlow<List<String>>(emptyList())
    val aiSuggestions: StateFlow<List<String>> = _aiSuggestions.asStateFlow()

    // 統計數據
    private val _stats = MutableStateFlow<TodoStats?>(null)
    val stats: StateFlow<TodoStats?> = _stats.asStateFlow()

    // AI 摘要
    private val _aiSummary = MutableStateFlow<String>("")
    val aiSummary: StateFlow<String> = _aiSummary.asStateFlow()

    // 所有分類
    val categories = todoDao.getAllCategories()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    /**
     * 根據搜索和過濾條件獲取待辦事項
     */
    val todos = combine(
        _searchQuery,
        _filterType
    ) { query, filter ->
        Pair(query, filter)
    }.flatMapLatest { (query, filter) ->
        when {
            query.isNotEmpty() -> todoDao.searchTodosInTitleAndDescription(query)
            filter == FilterType.ACTIVE -> todoDao.getActiveTodos()
            filter == FilterType.COMPLETED -> todoDao.getCompletedTodos()
            else -> todoDao.getAllTodos()
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    init {
        // 初始化時生成 AI 建議和統計
        refreshAISuggestions()
        refreshStats()
    }

    /**
     * 更新搜索查詢
     */
    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    /**
     * 更新過濾器
     */
    fun updateFilter(filter: FilterType) {
        _filterType.value = filter
    }

    /**
     * 新增待辦事項（帶 AI 增強）
     */
    fun addTodo(
        title: String,
        description: String = "",
        priority: Priority? = null,
        useAI: Boolean = true
    ) {
        if (title.isBlank()) return

        viewModelScope.launch {
            // 使用 AI 生成標籤和分類
            val tags = if (useAI) aiService.generateTags(title, description) else emptyList()
            val category = if (useAI) aiService.categorizeTask(title, description) else ""
            val aiPriority = if (useAI && priority == null) {
                aiService.evaluatePriority(title, description, null)
            } else {
                priority ?: Priority.MEDIUM
            }

            todoDao.insertTodo(
                Todo(
                    title = title.trim(),
                    description = description.trim(),
                    priority = aiPriority,
                    category = category,
                    tags = tags
                )
            )

            // 刷新 AI 建議
            refreshAISuggestions()
            refreshStats()
        }
    }

    /**
     * 切換待辦事項的完成狀態
     */
    fun toggleTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.updateTodo(
                todo.copy(
                    isCompleted = !todo.isCompleted,
                    updatedAt = System.currentTimeMillis()
                )
            )
            refreshStats()
        }
    }

    /**
     * 更新待辦事項
     */
    fun updateTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.updateTodo(todo.copy(updatedAt = System.currentTimeMillis()))
            refreshStats()
        }
    }

    /**
     * 刪除待辦事項
     */
    fun deleteTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.deleteTodo(todo)
            refreshStats()
        }
    }

    /**
     * 刪除所有已完成的待辦事項
     */
    fun clearCompleted() {
        viewModelScope.launch {
            todoDao.deleteCompletedTodos()
            refreshStats()
        }
    }

    /**
     * 刷新 AI 建議
     */
    fun refreshAISuggestions() {
        viewModelScope.launch {
            val allTodos = todoDao.getAllTodos().first()
            val suggestions = aiService.generateTaskSuggestions(allTodos.take(20))
            _aiSuggestions.value = suggestions
        }
    }

    /**
     * 刷新統計數據
     */
    private fun refreshStats() {
        viewModelScope.launch {
            val total = todoDao.getTodoCount()
            val completed = todoDao.getCompletedCount()
            val pending = todoDao.getPendingCount()

            val allTodos = todoDao.getAllTodos().first()
            val byPriority = allTodos.groupBy { it.priority }

            _stats.value = TodoStats(
                total = total,
                completed = completed,
                pending = pending,
                highPriority = byPriority[Priority.HIGH]?.size ?: 0,
                mediumPriority = byPriority[Priority.MEDIUM]?.size ?: 0,
                lowPriority = byPriority[Priority.LOW]?.size ?: 0,
                completionRate = if (total > 0) completed.toFloat() / total else 0f
            )

            // 生成 AI 摘要
            _aiSummary.value = aiService.generateSummary(allTodos)
        }
    }

    /**
     * 使用 AI 智能評估優先級
     */
    suspend fun evaluatePriorityWithAI(title: String, description: String, dueDate: Long?): Priority {
        return aiService.evaluatePriority(title, description, dueDate)
    }

    /**
     * 根據分類篩選
     */
    fun filterByCategory(category: String) {
        viewModelScope.launch {
            // 可以擴展以支持分類過濾
        }
    }
}

/**
 * 過濾器類型
 */
enum class FilterType {
    ALL,
    ACTIVE,
    COMPLETED
}
