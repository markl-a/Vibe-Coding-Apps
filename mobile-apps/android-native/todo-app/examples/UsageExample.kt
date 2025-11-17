package com.vibeapps.todoapp.examples

import com.vibeapps.todoapp.data.dao.TodoDao
import com.vibeapps.todoapp.data.model.Priority
import com.vibeapps.todoapp.data.model.Todo
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

/**
 * Todo App 使用範例
 *
 * 這個範例展示如何：
 * 1. 創建待辦事項
 * 2. 查詢待辦事項
 * 3. 更新待辦事項狀態
 * 4. 刪除待辦事項
 * 5. 按優先級管理待辦事項
 */
class TodoUsageExample(private val todoDao: TodoDao) {

    /**
     * 範例 1: 創建基本的待辦事項
     */
    suspend fun example1_createBasicTodo() {
        val todo = Todo(
            title = "完成專案報告",
            description = "需要在週五前完成季度報告",
            priority = Priority.HIGH
        )
        todoDao.insertTodo(todo)
        println("✅ 已創建待辦事項: ${todo.title}")
    }

    /**
     * 範例 2: 創建多個不同優先級的待辦事項
     */
    suspend fun example2_createMultipleTodos() {
        val todos = listOf(
            Todo(
                title = "購買日用品",
                description = "牛奶、雞蛋、麵包",
                priority = Priority.LOW
            ),
            Todo(
                title = "準備會議簡報",
                description = "下週一團隊會議使用",
                priority = Priority.HIGH
            ),
            Todo(
                title = "回覆客戶郵件",
                description = "關於產品諮詢的郵件",
                priority = Priority.MEDIUM
            ),
            Todo(
                title = "健身房運動",
                description = "每週三次,每次一小時",
                priority = Priority.MEDIUM
            ),
            Todo(
                title = "學習 Kotlin Coroutines",
                description = "完成官方文檔和實作練習",
                priority = Priority.HIGH
            )
        )

        todos.forEach { todo ->
            todoDao.insertTodo(todo)
            println("✅ 已創建: ${todo.title} (優先級: ${todo.priority})")
        }
    }

    /**
     * 範例 3: 查詢所有待辦事項
     */
    suspend fun example3_getAllTodos() {
        val todos = todoDao.getAllTodos().first()
        println("\n📋 所有待辦事項 (${todos.size} 項):")
        todos.forEach { todo ->
            val status = if (todo.isCompleted) "✓" else "○"
            println("  $status [${todo.priority}] ${todo.title}")
            if (todo.description.isNotEmpty()) {
                println("     描述: ${todo.description}")
            }
        }
    }

    /**
     * 範例 4: 標記待辦事項為完成
     */
    suspend fun example4_completeTodo() {
        val todos = todoDao.getAllTodos().first()
        if (todos.isNotEmpty()) {
            val firstTodo = todos.first()
            val updatedTodo = firstTodo.copy(isCompleted = true)
            todoDao.updateTodo(updatedTodo)
            println("✅ 已完成: ${firstTodo.title}")
        }
    }

    /**
     * 範例 5: 刪除已完成的待辦事項
     */
    suspend fun example5_deleteCompletedTodos() {
        val deletedCount = todoDao.deleteCompletedTodos()
        println("🗑️ 已刪除 $deletedCount 個已完成的待辦事項")
    }

    /**
     * 範例 6: 更新待辦事項的優先級
     */
    suspend fun example6_updatePriority() {
        val todos = todoDao.getAllTodos().first()
        if (todos.isNotEmpty()) {
            val todo = todos.first()
            val updatedTodo = todo.copy(priority = Priority.HIGH)
            todoDao.updateTodo(updatedTodo)
            println("⬆️ 已將「${todo.title}」優先級提升為 HIGH")
        }
    }

    /**
     * 範例 7: 統計待辦事項
     */
    suspend fun example7_getTodoStatistics() {
        val todos = todoDao.getAllTodos().first()
        val completed = todos.count { it.isCompleted }
        val pending = todos.size - completed
        val highPriority = todos.count { it.priority == Priority.HIGH && !it.isCompleted }

        println("\n📊 待辦事項統計:")
        println("  總計: ${todos.size}")
        println("  已完成: $completed")
        println("  待處理: $pending")
        println("  高優先級待處理: $highPriority")
    }

    /**
     * 完整示範流程
     */
    suspend fun runCompleteDemo() {
        println("🚀 開始 Todo App 完整示範\n")

        // 1. 創建待辦事項
        println("步驟 1: 創建待辦事項")
        example2_createMultipleTodos()

        // 2. 顯示所有待辦事項
        println("\n步驟 2: 查看所有待辦事項")
        example3_getAllTodos()

        // 3. 完成一些待辦事項
        println("\n步驟 3: 完成待辦事項")
        example4_completeTodo()

        // 4. 顯示統計
        println("\n步驟 4: 查看統計")
        example7_getTodoStatistics()

        println("\n✨ 示範完成!")
    }
}

/**
 * 擴展函數: TodoDao 的便利方法
 */
suspend fun TodoDao.deleteCompletedTodos(): Int {
    val todos = getAllTodos().first()
    val completedTodos = todos.filter { it.isCompleted }
    completedTodos.forEach { deleteTodo(it) }
    return completedTodos.size
}

/**
 * 主函數範例 (用於測試)
 */
fun main() = runBlocking {
    // 注意: 這需要在實際的 Android 環境中運行,並且需要正確設置 Hilt 依賴注入
    println("""
        📝 Todo App 使用範例

        這個檔案展示了如何使用 Todo App 的核心功能:

        1. 創建待辦事項 - 支援標題、描述和優先級
        2. 查詢待辦事項 - 使用 Room Flow 進行響應式查詢
        3. 更新狀態 - 標記完成/未完成
        4. 刪除項目 - 單個刪除或批量刪除已完成項目
        5. 優先級管理 - LOW, MEDIUM, HIGH 三個級別
        6. 統計功能 - 查看完成率和待處理項目

        💡 使用方式:

        在您的 ViewModel 或 Repository 中:

        ```kotlin
        @HiltViewModel
        class MyViewModel @Inject constructor(
            private val todoDao: TodoDao
        ) : ViewModel() {

            private val example = TodoUsageExample(todoDao)

            fun runExample() {
                viewModelScope.launch {
                    example.runCompleteDemo()
                }
            }
        }
        ```

        🔧 依賴需求:
        - Room Database
        - Hilt Dependency Injection
        - Kotlin Coroutines
    """.trimIndent())
}
