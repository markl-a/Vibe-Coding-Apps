package com.vibeapps.notes.examples

import com.vibeapps.notes.data.model.Note
import com.vibeapps.notes.data.model.Folder
import com.vibeapps.notes.data.model.Tag
import com.vibeapps.notes.data.model.NoteColors

/**
 * Note Taking App 使用範例
 *
 * 這個範例展示如何:
 * 1. 創建和管理筆記
 * 2. 使用 Markdown 格式
 * 3. 組織資料夾結構
 * 4. 使用標籤系統
 * 5. 顏色標記和釘選功能
 */

/**
 * 範例 1: 創建測試筆記數據
 */
object NoteTestData {

    /**
     * 創建一個簡單的筆記
     */
    fun createSimpleNote() = Note(
        title = "我的第一個筆記",
        content = "這是一個簡單的筆記內容。",
        color = NoteColors.DEFAULT
    )

    /**
     * 創建一個 Markdown 格式的筆記
     */
    fun createMarkdownNote() = Note(
        title = "Markdown 筆記範例",
        content = """
            # Markdown 語法教學

            ## 標題
            使用 # 符號創建標題,數量越多級別越低

            ## 文字格式
            - **粗體文字**
            - *斜體文字*
            - ~~刪除線~~
            - `程式碼`

            ## 清單
            ### 無序清單
            - 項目 1
            - 項目 2
              - 子項目 2.1
              - 子項目 2.2

            ### 有序清單
            1. 第一項
            2. 第二項
            3. 第三項

            ## 連結
            [Google](https://www.google.com)

            ## 引用
            > 這是一段引用文字
            > 可以有多行

            ## 程式碼區塊
            ```kotlin
            fun main() {
                println("Hello, Kotlin!")
            }
            ```

            ## 表格
            | 標題1 | 標題2 | 標題3 |
            |------|------|------|
            | 內容1 | 內容2 | 內容3 |
            | 內容4 | 內容5 | 內容6 |
        """.trimIndent(),
        color = NoteColors.BLUE,
        isPinned = true
    )

    /**
     * 創建待辦清單筆記
     */
    fun createTodoListNote() = Note(
        title = "每日待辦事項",
        content = """
            ## 今日任務 📋

            - [x] 完成專案報告
            - [x] 回覆客戶郵件
            - [ ] 準備明天的會議
            - [ ] 更新文檔
            - [ ] 程式碼審查

            ## 本週目標 🎯

            - [ ] 完成新功能開發
            - [ ] 撰寫單元測試
            - [ ] 優化效能
            - [ ] 更新使用者手冊
        """.trimIndent(),
        color = NoteColors.GREEN
    )

    /**
     * 創建會議記錄筆記
     */
    fun createMeetingNote() = Note(
        title = "團隊會議記錄 - 2025/11/17",
        content = """
            # 團隊週會記錄

            **日期**: 2025年11月17日
            **時間**: 14:00 - 15:30
            **地點**: 會議室 A
            **出席**: Alice, Bob, Carol, David

            ## 議程

            ### 1. 專案進度報告
            - 後端 API 開發完成 80%
            - 前端 UI 開發完成 60%
            - 測試覆蓋率達到 75%

            ### 2. 遇到的問題
            - 資料庫效能需要優化
            - 第三方 API 整合遇到困難

            ### 3. 解決方案
            1. 新增資料庫索引
            2. 使用快取機制
            3. 聯繫第三方技術支援

            ### 4. 下週計劃
            - [ ] 完成剩餘功能開發
            - [ ] 進行整合測試
            - [ ] 準備 Demo 簡報

            ## 行動項目

            | 任務 | 負責人 | 截止日期 |
            |-----|-------|---------|
            | 資料庫優化 | Bob | 11/20 |
            | API 整合 | Alice | 11/22 |
            | UI 完善 | Carol | 11/24 |
            | 測試報告 | David | 11/25 |
        """.trimIndent(),
        color = NoteColors.ORANGE,
        isPinned = true
    )

    /**
     * 創建學習筆記
     */
    fun createStudyNote() = Note(
        title = "Kotlin Coroutines 學習筆記",
        content = """
            # Kotlin Coroutines 學習筆記

            ## 什麼是 Coroutines?

            Coroutines 是 Kotlin 提供的輕量級執行緒解決方案,用於處理非同步程式設計。

            ## 核心概念

            ### 1. Suspend Function
            ```kotlin
            suspend fun fetchData(): String {
                delay(1000) // 模擬網路請求
                return "Data"
            }
            ```

            ### 2. Launch vs Async

            **Launch**: 啟動協程,不返回結果
            ```kotlin
            GlobalScope.launch {
                // 執行任務
            }
            ```

            **Async**: 啟動協程並返回 Deferred 結果
            ```kotlin
            val deferred = GlobalScope.async {
                fetchData()
            }
            val result = deferred.await()
            ```

            ### 3. Dispatchers

            - `Dispatchers.Main` - UI 執行緒
            - `Dispatchers.IO` - I/O 操作
            - `Dispatchers.Default` - CPU 密集型任務

            ## 實用範例

            ```kotlin
            viewModelScope.launch {
                try {
                    val data = withContext(Dispatchers.IO) {
                        repository.getData()
                    }
                    // 更新 UI
                } catch (e: Exception) {
                    // 錯誤處理
                }
            }
            ```

            ## 最佳實踐

            1. 使用 viewModelScope 或 lifecycleScope
            2. 正確處理取消
            3. 使用 withContext 切換 Dispatcher
            4. 適當的錯誤處理
        """.trimIndent(),
        color = NoteColors.PURPLE
    )

    /**
     * 創建程式碼片段筆記
     */
    fun createCodeSnippetNote() = Note(
        title = "常用程式碼片段",
        content = """
            # 常用程式碼片段

            ## Android - Room Database 設定

            ```kotlin
            @Database(entities = [User::class], version = 1)
            abstract class AppDatabase : RoomDatabase() {
                abstract fun userDao(): UserDao

                companion object {
                    @Volatile
                    private var INSTANCE: AppDatabase? = null

                    fun getDatabase(context: Context): AppDatabase {
                        return INSTANCE ?: synchronized(this) {
                            val instance = Room.databaseBuilder(
                                context.applicationContext,
                                AppDatabase::class.java,
                                "app_database"
                            ).build()
                            INSTANCE = instance
                            instance
                        }
                    }
                }
            }
            ```

            ## Jetpack Compose - LazyColumn

            ```kotlin
            @Composable
            fun ItemList(items: List<String>) {
                LazyColumn {
                    items(items) { item ->
                        Text(text = item)
                    }
                }
            }
            ```

            ## Retrofit API 設定

            ```kotlin
            interface ApiService {
                @GET("users/{id}")
                suspend fun getUser(@Path("id") userId: String): User

                @POST("users")
                suspend fun createUser(@Body user: User): User
            }

            val retrofit = Retrofit.Builder()
                .baseUrl("https://api.example.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val api = retrofit.create(ApiService::class.java)
            ```
        """.trimIndent(),
        color = NoteColors.YELLOW
    )

    /**
     * 獲取所有範例筆記
     */
    fun getAllExampleNotes() = listOf(
        createSimpleNote(),
        createMarkdownNote(),
        createTodoListNote(),
        createMeetingNote(),
        createStudyNote(),
        createCodeSnippetNote()
    )
}

/**
 * 範例 2: 資料夾管理範例
 */
object FolderExamples {

    fun createWorkFolder() = Folder(
        name = "工作",
        color = NoteColors.BLUE,
        icon = "work"
    )

    fun createPersonalFolder() = Folder(
        name = "個人",
        color = NoteColors.GREEN,
        icon = "person"
    )

    fun createStudyFolder() = Folder(
        name = "學習",
        color = NoteColors.PURPLE,
        icon = "school"
    )

    fun createProjectFolder() = Folder(
        name = "專案",
        color = NoteColors.ORANGE,
        icon = "folder_special"
    )

    fun getAllFolders() = listOf(
        createWorkFolder(),
        createPersonalFolder(),
        createStudyFolder(),
        createProjectFolder()
    )
}

/**
 * 範例 3: 標籤系統範例
 */
object TagExamples {

    fun createTag(name: String, color: Int) = Tag(
        name = name,
        color = color
    )

    fun getCommonTags() = listOf(
        createTag("重要", NoteColors.RED),
        createTag("待辦", NoteColors.ORANGE),
        createTag("想法", NoteColors.YELLOW),
        createTag("工作", NoteColors.BLUE),
        createTag("個人", NoteColors.GREEN),
        createTag("學習", NoteColors.PURPLE)
    )
}

/**
 * 範例 4: 筆記操作範例
 */
class NoteOperationsExample {

    /**
     * 示範筆記的 CRUD 操作
     */
    fun demonstrateNoteOperations() {
        println("📝 筆記管理操作範例\n")

        // 創建筆記
        println("1️⃣ 創建筆記")
        val note = NoteTestData.createSimpleNote()
        println("  ✅ 已創建: ${note.title}")

        // 更新筆記
        println("\n2️⃣ 更新筆記")
        val updatedNote = note.copy(
            title = "更新後的標題",
            content = "更新後的內容",
            updatedAt = System.currentTimeMillis()
        )
        println("  ✅ 已更新: ${updatedNote.title}")

        // 釘選筆記
        println("\n3️⃣ 釘選筆記")
        val pinnedNote = updatedNote.copy(isPinned = true)
        println("  📌 已釘選: ${pinnedNote.title}")

        // 上鎖筆記
        println("\n4️⃣ 鎖定筆記")
        val lockedNote = pinnedNote.copy(isLocked = true)
        println("  🔒 已鎖定: ${lockedNote.title}")

        // 改變顏色
        println("\n5️⃣ 改變顏色")
        val coloredNote = lockedNote.copy(color = NoteColors.BLUE)
        println("  🎨 已設定顏色: ${coloredNote.title}")
    }

    /**
     * 示範 Markdown 筆記處理
     */
    fun demonstrateMarkdownNote() {
        println("\n📄 Markdown 筆記範例\n")

        val markdownNote = NoteTestData.createMarkdownNote()
        println("標題: ${markdownNote.title}")
        println("釘選: ${if (markdownNote.isPinned) "是" else "否"}")
        println("\n內容預覽:")
        println(markdownNote.content.lines().take(5).joinToString("\n"))
        println("... (共 ${markdownNote.content.lines().size} 行)")
    }

    /**
     * 示範資料夾分類
     */
    fun demonstrateFolderOrganization() {
        println("\n📁 資料夾組織範例\n")

        val folders = FolderExamples.getAllFolders()
        folders.forEachIndexed { index, folder ->
            println("${index + 1}. ${folder.icon} ${folder.name}")
        }

        println("\n將筆記分配到資料夾:")
        val workFolder = folders[0]
        val note = NoteTestData.createMeetingNote()
        val categorizedNote = note.copy(folderId = workFolder.id)
        println("  ✅ 「${note.title}」已移動到「${workFolder.name}」資料夾")
    }

    /**
     * 示範標籤使用
     */
    fun demonstrateTagging() {
        println("\n🏷️ 標籤系統範例\n")

        val tags = TagExamples.getCommonTags()
        println("可用標籤:")
        tags.forEach { tag ->
            println("  • ${tag.name}")
        }

        println("\n為筆記添加標籤:")
        val note = NoteTestData.createTodoListNote()
        println("  筆記: ${note.title}")
        println("  標籤: #重要 #待辦 #工作")
    }
}

/**
 * 範例 5: 筆記搜尋和過濾
 */
object NoteSearchExample {

    /**
     * 按標題搜尋
     */
    fun searchByTitle(notes: List<Note>, query: String): List<Note> {
        return notes.filter { it.title.contains(query, ignoreCase = true) }
    }

    /**
     * 按內容搜尋
     */
    fun searchByContent(notes: List<Note>, query: String): List<Note> {
        return notes.filter { it.content.contains(query, ignoreCase = true) }
    }

    /**
     * 獲取已釘選的筆記
     */
    fun getPinnedNotes(notes: List<Note>): List<Note> {
        return notes.filter { it.isPinned }
    }

    /**
     * 按顏色過濾
     */
    fun filterByColor(notes: List<Note>, color: Int): List<Note> {
        return notes.filter { it.color == color }
    }

    /**
     * 按資料夾過濾
     */
    fun filterByFolder(notes: List<Note>, folderId: Long): List<Note> {
        return notes.filter { it.folderId == folderId }
    }
}

/**
 * 主函數 - 執行所有範例
 */
fun main() {
    println("=" .repeat(60))
    println("📓 Note Taking App 完整使用範例")
    println("=".repeat(60))

    val example = NoteOperationsExample()

    // 基本操作
    example.demonstrateNoteOperations()

    // Markdown 筆記
    example.demonstrateMarkdownNote()

    // 資料夾組織
    example.demonstrateFolderOrganization()

    // 標籤系統
    example.demonstrateTagging()

    // 展示所有範例筆記
    println("\n" + "=".repeat(60))
    println("📚 所有範例筆記")
    println("=".repeat(60))

    val allNotes = NoteTestData.getAllExampleNotes()
    allNotes.forEachIndexed { index, note ->
        val pinned = if (note.isPinned) "📌" else "  "
        val locked = if (note.isLocked) "🔒" else "  "
        println("${index + 1}. $pinned$locked ${note.title}")
        println("   顏色: ${getColorName(note.color)}")
        println("   內容長度: ${note.content.length} 字元")
        println()
    }

    // 搜尋範例
    println("=".repeat(60))
    println("🔍 搜尋功能範例")
    println("=".repeat(60))

    val searchResults = NoteSearchExample.searchByTitle(allNotes, "Markdown")
    println("搜尋 'Markdown' 的結果:")
    searchResults.forEach { note ->
        println("  • ${note.title}")
    }

    val pinnedNotes = NoteSearchExample.getPinnedNotes(allNotes)
    println("\n已釘選的筆記 (${pinnedNotes.size} 個):")
    pinnedNotes.forEach { note ->
        println("  📌 ${note.title}")
    }

    println("\n✨ 所有範例執行完成!")
    println("""

        💡 如何在您的應用中使用這些範例:

        1. 在 Repository 或 ViewModel 中插入測試數據:
        ```kotlin
        val testNotes = NoteTestData.getAllExampleNotes()
        testNotes.forEach { noteDao.insertNote(it) }
        ```

        2. 創建資料夾結構:
        ```kotlin
        val folders = FolderExamples.getAllFolders()
        folders.forEach { folderDao.insertFolder(it) }
        ```

        3. 實現搜尋功能:
        ```kotlin
        val results = NoteSearchExample.searchByTitle(notes, searchQuery)
        ```

        4. 在 Compose UI 中顯示 Markdown:
        ```kotlin
        MarkdownText(markdown = note.content)
        ```
    """.trimIndent())
}

/**
 * 輔助函數: 獲取顏色名稱
 */
private fun getColorName(color: Int): String {
    return when (color) {
        NoteColors.DEFAULT -> "預設"
        NoteColors.RED -> "紅色"
        NoteColors.ORANGE -> "橘色"
        NoteColors.YELLOW -> "黃色"
        NoteColors.GREEN -> "綠色"
        NoteColors.BLUE -> "藍色"
        NoteColors.PURPLE -> "紫色"
        else -> "自訂"
    }
}
