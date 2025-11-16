# Note Taking App - Android 筆記應用

一個功能豐富的筆記應用，使用 Kotlin、Jetpack Compose、Room 和 Material Design 3 打造。

## 功能特色

- 📝 **Markdown 支援** - 支援 Markdown 格式筆記
- 📁 **分類管理** - 建立資料夾組織筆記
- 🏷️ **標籤系統** - 為筆記添加標籤
- 🔍 **全文搜尋** - 快速搜尋筆記內容
- 📌 **釘選功能** - 釘選重要筆記到頂部
- 🎨 **顏色標記** - 為筆記設定顏色
- 📷 **圖片支援** - 在筆記中插入圖片
- ✅ **清單模式** - 待辦清單和核取方塊
- 🔒 **筆記鎖定** - 密碼保護私密筆記
- 💾 **自動儲存** - 即時保存編輯內容
- 🌙 **深色模式** - 支援深色主題
- 📱 **響應式設計** - 適配各種螢幕

## 技術棧

- **語言**: Kotlin 1.9+
- **UI 框架**: Jetpack Compose
- **資料庫**: Room
- **Markdown**: Markwon 或 Compose Markdown
- **依賴注入**: Hilt
- **架構**: MVVM + Clean Architecture
- **狀態管理**: StateFlow
- **最小 SDK**: API 24 (Android 7.0)
- **目標 SDK**: API 34 (Android 14)

## 專案結構

```
note-taking-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/vibeapps/notes/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── NoteApplication.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── screens/
│   │   │   │   │   │   ├── NoteListScreen.kt
│   │   │   │   │   │   ├── NoteEditorScreen.kt
│   │   │   │   │   │   └── FolderScreen.kt
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── NoteCard.kt
│   │   │   │   │   │   ├── MarkdownEditor.kt
│   │   │   │   │   │   └── FolderPicker.kt
│   │   │   │   │   ├── viewmodel/
│   │   │   │   │   │   ├── NoteListViewModel.kt
│   │   │   │   │   │   └── NoteEditorViewModel.kt
│   │   │   │   │   └── theme/
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── Note.kt
│   │   │   │   │   │   ├── Folder.kt
│   │   │   │   │   │   └── Tag.kt
│   │   │   │   │   ├── dao/
│   │   │   │   │   │   ├── NoteDao.kt
│   │   │   │   │   │   └── FolderDao.kt
│   │   │   │   │   ├── database/
│   │   │   │   │   │   └── NoteDatabase.kt
│   │   │   │   │   └── repository/
│   │   │   │   │       └── NoteRepository.kt
│   │   │   │   ├── domain/
│   │   │   │   │   └── usecase/
│   │   │   │   │       ├── GetNotesUseCase.kt
│   │   │   │   │       └── SaveNoteUseCase.kt
│   │   │   │   └── di/
│   │   │   │       └── AppModule.kt
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
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
   cd android-native/note-taking-app
   ```

2. **打開專案**
   - 使用 Android Studio 打開專案
   - 等待 Gradle 同步完成

3. **運行應用**
   - 連接 Android 設備或啟動模擬器
   - 點擊 Run 按鈕

## 核心功能

### 1. 筆記管理

```kotlin
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
```

### 2. 資料夾系統

```kotlin
@Entity(tableName = "folders")
data class Folder(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val color: Int = 0,
    val icon: String = "folder",
    val createdAt: Long = System.currentTimeMillis()
)
```

### 3. 標籤系統

```kotlin
@Entity(tableName = "tags")
data class Tag(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val color: Int = 0
)

@Entity(
    tableName = "note_tags",
    primaryKeys = ["noteId", "tagId"],
    foreignKeys = [
        ForeignKey(entity = Note::class, parentColumns = ["id"], childColumns = ["noteId"]),
        ForeignKey(entity = Tag::class, parentColumns = ["id"], childColumns = ["tagId"])
    ]
)
data class NoteTagCrossRef(
    val noteId: Long,
    val tagId: Long
)
```

### 4. ViewModel

```kotlin
@HiltViewModel
class NoteListViewModel @Inject constructor(
    private val repository: NoteRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val notes = _searchQuery
        .flatMapLatest { query ->
            if (query.isEmpty()) {
                repository.getAllNotes()
            } else {
                repository.searchNotes(query)
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun togglePin(note: Note) {
        viewModelScope.launch {
            repository.updateNote(note.copy(isPinned = !note.isPinned))
        }
    }

    fun deleteNote(note: Note) {
        viewModelScope.launch {
            repository.deleteNote(note)
        }
    }
}
```

### 5. Markdown 編輯器

```kotlin
@Composable
fun MarkdownEditor(
    content: String,
    onContentChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var isPreviewMode by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        // 工具列
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = { /* 粗體 */ }) {
                Icon(Icons.Default.FormatBold, "粗體")
            }
            IconButton(onClick = { /* 斜體 */ }) {
                Icon(Icons.Default.FormatItalic, "斜體")
            }
            IconButton(onClick = { isPreviewMode = !isPreviewMode }) {
                Icon(Icons.Default.Visibility, "預覽")
            }
        }

        // 編輯區 / 預覽區
        if (isPreviewMode) {
            // Markdown 預覽
            MarkdownText(markdown = content)
        } else {
            // 編輯器
            TextField(
                value = content,
                onValueChange = onContentChange,
                modifier = Modifier.fillMaxSize()
            )
        }
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

    // Markdown (選擇一個)
    implementation("com.github.jeziellago:compose-markdown:0.3.6")
    // 或
    implementation("io.noties.markwon:core:4.6.2")

    // 圖片選擇
    implementation("io.coil-kt:coil-compose:2.5.0")
}
```

## 主要畫面

### 筆記列表

- 顯示所有筆記（卡片式或列表式）
- 釘選的筆記顯示在頂部
- 顏色標記
- 搜尋功能
- 篩選和排序選項

### 筆記編輯器

- Rich Text 編輯器或 Markdown 編輯器
- 即時保存
- 標題和內容分離
- 格式化工具列
- 插入圖片
- 添加標籤
- 設定顏色
- 鎖定功能

### 資料夾管理

- 建立/編輯/刪除資料夾
- 拖曳筆記到資料夾
- 資料夾顏色和圖標
- 資料夾內筆記計數

## 進階功能建議

- [ ] 筆記匯出 (PDF, Markdown, Text)
- [ ] 筆記分享
- [ ] 雲端同步
- [ ] 版本歷史
- [ ] 筆記範本
- [ ] 語音輸入
- [ ] OCR 文字識別
- [ ] Widget 桌面小工具
- [ ] 快捷筆記（通知欄快速筆記）
- [ ] 筆記提醒
- [ ] 附件支援
- [ ] 繪圖功能
- [ ] 程式碼高亮顯示
- [ ] 數學公式支援

## 資料庫 Schema

### Notes Table
- id (Long, PK)
- title (String)
- content (String)
- folderId (Long, FK, nullable)
- color (Int)
- isPinned (Boolean)
- isLocked (Boolean)
- createdAt (Long)
- updatedAt (Long)

### Folders Table
- id (Long, PK)
- name (String)
- color (Int)
- icon (String)
- createdAt (Long)

### Tags Table
- id (Long, PK)
- name (String)
- color (Int)

### Note_Tags (Join Table)
- noteId (Long, FK)
- tagId (Long, FK)

## 學習重點

這個專案展示了：

1. **Room Database** - 複雜的資料庫關聯
2. **Clean Architecture** - 清晰的分層架構
3. **Use Cases** - 業務邏輯封裝
4. **StateFlow** - 響應式狀態管理
5. **Compose Navigation** - 多畫面導航
6. **Material Design 3** - 現代化 UI 設計
7. **Markdown Rendering** - 富文本顯示

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 相關資源

- [Room 文檔](https://developer.android.com/training/data-storage/room)
- [Compose Navigation](https://developer.android.com/jetpack/compose/navigation)
- [Markwon](https://github.com/noties/Markwon)
- [Material Design 3](https://m3.material.io/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**作者**: Vibe Coding Apps
