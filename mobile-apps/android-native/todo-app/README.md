# Todo App - Android 待辦事項應用

一個使用 Kotlin、Jetpack Compose、Room 和 Hilt 打造的現代化待辦事項管理應用。

## 功能特色

- ✅ **直觀界面** - Material Design 3 設計風格
- 📝 **快速新增** - 快速新增和編輯待辦事項
- ✔️ **完成標記** - 點擊即可標記為完成
- 🗑️ **刪除項目** - 滑動刪除不需要的項目
- 💾 **本地儲存** - 使用 Room 資料庫本地保存
- 🎨 **Material Design 3** - 現代化 UI 設計
- 🌙 **深色模式** - 支援深色主題
- 📱 **響應式設計** - 適配不同螢幕尺寸

## 技術棧

- **語言**: Kotlin 1.9+
- **UI 框架**: Jetpack Compose
- **資料庫**: Room
- **依賴注入**: Hilt
- **架構**: MVVM (Model-View-ViewModel)
- **狀態管理**: StateFlow
- **最小 SDK**: API 24 (Android 7.0)
- **目標 SDK**: API 34 (Android 14)

## 專案結構

```
todo-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/vibeapps/todoapp/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── TodoApplication.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── TodoScreen.kt
│   │   │   │   │   ├── TodoViewModel.kt
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── TodoItem.kt
│   │   │   │   │   │   └── AddTodoDialog.kt
│   │   │   │   │   └── theme/
│   │   │   │   │       ├── Color.kt
│   │   │   │   │       ├── Theme.kt
│   │   │   │   │       └── Type.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   └── Todo.kt
│   │   │   │   │   ├── dao/
│   │   │   │   │   │   └── TodoDao.kt
│   │   │   │   │   └── database/
│   │   │   │   │       └── TodoDatabase.kt
│   │   │   │   └── di/
│   │   │   │       └── AppModule.kt
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## 快速開始

### 環境需求

- Android Studio Hedgehog (2023.1.1) 或更新版本
- JDK 17+
- Android SDK API 34
- Gradle 8.0+

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd android-native/todo-app
   ```

2. **打開專案**
   - 使用 Android Studio 打開 `todo-app` 目錄
   - 等待 Gradle 同步完成

3. **運行應用**
   - 連接 Android 設備或啟動模擬器
   - 點擊 Run 按鈕或按 Shift+F10

## 核心功能實現

### 1. 資料模型 (Todo.kt)

```kotlin
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

enum class Priority {
    LOW, MEDIUM, HIGH
}
```

### 2. Room DAO

```kotlin
@Dao
interface TodoDao {
    @Query("SELECT * FROM todos ORDER BY createdAt DESC")
    fun getAllTodos(): Flow<List<Todo>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTodo(todo: Todo)

    @Update
    suspend fun updateTodo(todo: Todo)

    @Delete
    suspend fun deleteTodo(todo: Todo)

    @Query("DELETE FROM todos WHERE isCompleted = 1")
    suspend fun deleteCompletedTodos()
}
```

### 3. ViewModel

```kotlin
@HiltViewModel
class TodoViewModel @Inject constructor(
    private val todoDao: TodoDao
) : ViewModel() {

    val todos = todoDao.getAllTodos()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun addTodo(title: String, description: String = "") {
        viewModelScope.launch {
            todoDao.insertTodo(Todo(title = title, description = description))
        }
    }

    fun toggleTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.updateTodo(todo.copy(isCompleted = !todo.isCompleted))
        }
    }

    fun deleteTodo(todo: Todo) {
        viewModelScope.launch {
            todoDao.deleteTodo(todo)
        }
    }
}
```

### 4. Compose UI

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoScreen(viewModel: TodoViewModel = hiltViewModel()) {
    val todos by viewModel.todos.collectAsState()
    var showDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("待辦事項") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, "新增")
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            items(todos, key = { it.id }) { todo ->
                TodoItem(
                    todo = todo,
                    onToggle = { viewModel.toggleTodo(todo) },
                    onDelete = { viewModel.deleteTodo(todo) }
                )
            }
        }
    }

    if (showDialog) {
        AddTodoDialog(
            onDismiss = { showDialog = false },
            onAdd = { title, description ->
                viewModel.addTodo(title, description)
                showDialog = false
            }
        )
    }
}
```

## 依賴項

```kotlin
dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    ksp("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.01.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

## 進階功能建議

- [ ] 分類標籤系統
- [ ] 到期日期提醒
- [ ] 優先級顏色標記
- [ ] 搜尋和篩選功能
- [ ] 資料備份與還原
- [ ] Widget 桌面小工具
- [ ] 主題切換
- [ ] 統計分析
- [ ] 雲端同步

## 學習重點

這個專案展示了：

1. **Jetpack Compose** - 聲明式 UI 開發
2. **Room Database** - SQLite ORM 本地資料儲存
3. **Hilt** - 依賴注入框架
4. **MVVM Architecture** - 清晰的架構分層
5. **Kotlin Coroutines** - 異步程式設計
6. **StateFlow** - 狀態管理
7. **Material Design 3** - 現代化 UI 設計

## 常見問題

### Q: 如何清除所有已完成的項目？

在 ViewModel 中添加：
```kotlin
fun clearCompleted() {
    viewModelScope.launch {
        todoDao.deleteCompletedTodos()
    }
}
```

### Q: 如何添加搜尋功能？

在 TodoDao 中添加：
```kotlin
@Query("SELECT * FROM todos WHERE title LIKE '%' || :query || '%' ORDER BY createdAt DESC")
fun searchTodos(query: String): Flow<List<Todo>>
```

### Q: 如何實現資料備份？

可以使用 Android Backup API 或匯出 JSON 檔案。

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 相關資源

- [Jetpack Compose 文檔](https://developer.android.com/jetpack/compose)
- [Room 資料庫指南](https://developer.android.com/training/data-storage/room)
- [Hilt 依賴注入](https://developer.android.com/training/dependency-injection/hilt-android)
- [Material Design 3](https://m3.material.io/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**作者**: Vibe Coding Apps
