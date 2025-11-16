# Android 原生應用開發
🤖 **AI-Driven | AI-Native** 🚀

使用 Kotlin 和 Jetpack Compose 開發原生 Android 應用，充分利用 Android 平台的最新特性。

## 📋 專案概述

Android 原生開發使用 Google 官方的 Kotlin 程式語言和 Jetpack Compose/XML Views 框架，能夠最大化發揮 Android 設備的性能，並提供最佳的用戶體驗。透過 AI 輔助開發，即使是 Android 開發新手也能快速上手。

### 為什麼選擇 Android 原生開發？

- **最佳性能**：直接使用原生 API，性能完全優化
- **完整功能**：優先獲得 Google 最新功能和 API
- **市場份額**：Android 佔全球移動市場 70%+ 份額
- **開放生態**：多樣化設備、自由度高
- **Google 服務整合**：Firebase、Google Play、ML Kit 等
- **Kotlin 語言**：現代化、簡潔、安全的程式語言
- **Jetpack Compose**：聲明式 UI，開發效率極高
- **AI 友好**：Kotlin 語法清晰，AI 輔助效果優秀

## 🎯 適合開發的應用類型

### 生產力工具
- 筆記應用
- 待辦事項管理
- 日曆與提醒
- 文件掃描器
- PDF 閱讀器

### 社交通訊
- 即時通訊
- 社交網絡
- 論壇客戶端
- 照片分享
- 群組聊天

### 娛樂媒體
- 影片播放器
- 音樂播放器
- 播客應用
- 電子書閱讀器
- 直播應用

### 工具類
- 天氣應用
- 計算機
- 單位轉換
- 二維碼掃描
- 檔案管理器

### 健康健身
- 運動追蹤
- 計步器
- 健身計劃
- 飲食記錄
- 睡眠追蹤

### 電商購物
- 購物商城
- 商品展示
- 購物車
- 訂單管理
- 掃碼購物

### 金融理財
- 記帳軟體
- 預算管理
- 投資追蹤
- 加密貨幣錢包
- 行動支付

### 教育學習
- 語言學習
- 線上課程
- 題庫練習
- 兒童教育
- 技能培訓

### 商業應用
- CRM 系統
- 銷售管理
- 庫存管理
- 行動 POS
- 員工打卡

### 遊戲
- 2D 遊戲
- 休閒遊戲
- 益智遊戲
- 卡牌遊戲

## 🛠️ 技術棧

### 核心框架與語言

#### Kotlin 1.9+
- **現代化語言**：簡潔、安全、表達力強
- **空安全**：編譯時期空指針檢查
- **協程**：簡化異步編程
- **擴展函數**：增強現有類功能
- **數據類**：自動生成樣板代碼

#### Jetpack Compose（推薦）
- **聲明式 UI**：類似 SwiftUI/React
- **即時預覽**：Android Studio 即時查看效果
- **Material Design 3**：最新設計規範
- **狀態管理**：簡化 UI 狀態處理
- **動畫支援**：流暢的過渡效果

#### XML Views（傳統）
- **成熟穩定**：久經考驗的 UI 方案
- **精細控制**：更多客製化選項
- **向後兼容**：支援舊版 Android

### Android Jetpack 組件

#### Architecture Components
- **ViewModel** - UI 狀態管理
- **LiveData** - 可觀察的資料容器
- **Room** - SQLite ORM
- **DataStore** - 替代 SharedPreferences
- **WorkManager** - 背景任務
- **Navigation** - 應用導航
- **Paging 3** - 分頁載入

#### UI Components
- **Compose** - 聲明式 UI
- **RecyclerView** - 高效列表
- **ViewPager2** - 滑動頁面
- **ConstraintLayout** - 靈活佈局
- **Material Components** - Material Design

#### Foundation
- **AppCompat** - 向後兼容
- **Android KTX** - Kotlin 擴展
- **Multidex** - 多 DEX 支援
- **Test** - 測試框架

### 狀態管理

#### Jetpack 官方
- **ViewModel + StateFlow**
- **SavedStateHandle**
- **Compose State**

#### 第三方方案
- **MVI (Model-View-Intent)**
- **Redux** - 單向資料流
- **MvRx** (Airbnb)
- **Orbit MVI**

### 資料持久化

#### 本地儲存
- **Room** - SQLite ORM（推薦）
- **DataStore** - 鍵值對/Protobuf 儲存
- **SharedPreferences** - 簡單設定儲存
- **SQLite** - 原生資料庫
- **Realm** - 移動資料庫
- **ObjectBox** - 高性能物件資料庫

#### 雲端服務
- **Firebase Firestore** - NoSQL 雲端資料庫
- **Firebase Realtime Database** - 即時資料庫
- **Google Cloud** - 雲端儲存
- **AWS Amplify** - AWS 移動後端

### 網路請求

- **Retrofit** - 類型安全的 HTTP 客戶端（推薦）
- **OkHttp** - HTTP 客戶端
- **Ktor Client** - Kotlin 原生客戶端
- **Fuel** - Kotlin HTTP 庫
- **Apollo Android** - GraphQL 客戶端

### 依賴注入

- **Hilt** - Android 官方推薦（基於 Dagger）
- **Koin** - 輕量級 Kotlin DI
- **Dagger** - 編譯時期 DI

### 圖片處理

- **Coil** - Kotlin 優先的圖片載入庫（推薦）
- **Glide** - 快速高效的圖片載入
- **Picasso** - Square 開發的圖片庫

### 網路通訊

- **WebSocket** - 雙向通訊
- **Socket.IO** - 即時通訊
- **gRPC** - 高性能 RPC 框架

### UI/UX 工具

#### Material Design
- **Material Design 3** - 最新設計語言
- **Material Components** - UI 組件庫
- **Material You** - 動態色彩

#### 動畫
- **Lottie** - After Effects 動畫
- **Compose Animation** - Compose 動畫
- **MotionLayout** - 複雜動畫佈局
- **Transition API** - 場景過渡

### Google 服務整合

- **Firebase** - 後端即服務
  - Authentication - 用戶認證
  - Firestore - 資料庫
  - Storage - 檔案儲存
  - Cloud Messaging (FCM) - 推送通知
  - Analytics - 分析
  - Crashlytics - 崩潰報告
  - Remote Config - 遠端配置
  - App Distribution - 測試分發

- **Google Play Services**
  - Maps - Google 地圖
  - Location - 定位服務
  - Drive - Google 雲端硬碟
  - Sign-In - Google 登入

- **ML Kit** - 機器學習
  - 文字識別
  - 人臉偵測
  - 條碼掃描
  - 圖像標記

### 測試工具

- **JUnit** - 單元測試
- **Espresso** - UI 測試
- **MockK** - Kotlin Mock 框架
- **Robolectric** - Android 單元測試
- **Truth** - 流暢的斷言庫
- **Turbine** - Flow 測試

### 建置工具

- **Gradle** - 建置系統
- **Gradle Kotlin DSL** - Kotlin 建置腳本
- **AGP (Android Gradle Plugin)** - Android 建置插件
- **Version Catalogs** - 依賴版本管理

## 🚀 快速開始

### 環境需求

- **作業系統**：Windows、macOS、Linux
- **Android Studio**：Hedgehog (2023.1.1) 或更新
- **JDK**：JDK 17+
- **Android SDK**：API 34 (Android 14) 推薦
- **Gradle**：8.0+
- **Kotlin**：1.9+

### 安裝 Android Studio

1. 下載 [Android Studio](https://developer.android.com/studio)
2. 安裝並啟動
3. 完成初始設定向導
4. 安裝 Android SDK 和模擬器

### 創建新專案

#### 使用 Android Studio
1. File > New > New Project
2. 選擇模板（推薦「Empty Activity」）
3. 配置專案：
   - **Name**：應用名稱
   - **Package name**：包名（如 com.example.myapp）
   - **Language**：Kotlin
   - **Minimum SDK**：API 24 (Android 7.0) 推薦
   - **Build configuration language**：Kotlin DSL（推薦）
4. 完成創建

#### 專案結構

```
MyApp/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/myapp/
│   │   │   │   ├── MainActivity.kt      # 主 Activity
│   │   │   │   ├── ui/                  # UI 相關
│   │   │   │   │   ├── screens/         # 畫面
│   │   │   │   │   ├── components/      # 可重用組件
│   │   │   │   │   └── theme/           # 主題配置
│   │   │   │   ├── data/                # 資料層
│   │   │   │   │   ├── model/           # 資料模型
│   │   │   │   │   ├── repository/      # 資料倉庫
│   │   │   │   │   └── source/          # 資料源
│   │   │   │   ├── domain/              # 業務邏輯
│   │   │   │   │   ├── usecase/         # 用例
│   │   │   │   │   └── model/           # 領域模型
│   │   │   │   ├── di/                  # 依賴注入
│   │   │   │   └── util/                # 工具類
│   │   │   ├── res/                     # 資源文件
│   │   │   │   ├── drawable/            # 圖片
│   │   │   │   ├── layout/              # XML 佈局
│   │   │   │   ├── values/              # 值資源
│   │   │   │   │   ├── strings.xml      # 字串
│   │   │   │   │   ├── colors.xml       # 顏色
│   │   │   │   │   └── themes.xml       # 主題
│   │   │   │   └── mipmap/              # 應用圖標
│   │   │   └── AndroidManifest.xml      # 清單文件
│   │   ├── test/                        # 單元測試
│   │   └── androidTest/                 # 儀器測試
│   └── build.gradle.kts                 # 模組建置腳本
├── gradle/
│   └── libs.versions.toml               # 版本目錄
├── build.gradle.kts                     # 專案建置腳本
└── settings.gradle.kts                  # 設定腳本
```

### build.gradle.kts (Module)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.example.myapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.0")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")

    // Room
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    ksp("androidx.room:room-compiler:2.6.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    ksp("com.google.dagger:hilt-compiler:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")

    // Coil
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

## 💡 範例專案：待辦事項應用（Jetpack Compose + MVVM）

### MainActivity.kt

```kotlin
package com.example.todoapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.todoapp.ui.TodoScreen
import com.example.todoapp.ui.theme.TodoAppTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TodoAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TodoScreen()
                }
            }
        }
    }
}
```

### Todo.kt (資料模型)

```kotlin
package com.example.todoapp.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "todos")
data class Todo(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val title: String,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
```

### TodoDao.kt

```kotlin
package com.example.todoapp.data.dao

import androidx.room.*
import com.example.todoapp.data.model.Todo
import kotlinx.coroutines.flow.Flow

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
}
```

### TodoDatabase.kt

```kotlin
package com.example.todoapp.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.todoapp.data.dao.TodoDao
import com.example.todoapp.data.model.Todo

@Database(entities = [Todo::class], version = 1, exportSchema = false)
abstract class TodoDatabase : RoomDatabase() {
    abstract fun todoDao(): TodoDao
}
```

### TodoViewModel.kt

```kotlin
package com.example.todoapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.todoapp.data.dao.TodoDao
import com.example.todoapp.data.model.Todo
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

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

    fun addTodo(title: String) {
        viewModelScope.launch {
            todoDao.insertTodo(Todo(title = title))
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

### TodoScreen.kt

```kotlin
package com.example.todoapp.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.todoapp.data.model.Todo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoScreen(
    viewModel: TodoViewModel = hiltViewModel()
) {
    val todos by viewModel.todos.collectAsState()
    var showDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("待辦事項") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "新增")
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
            onAdd = { title ->
                viewModel.addTodo(title)
                showDialog = false
            }
        )
    }
}

@Composable
fun TodoItem(
    todo: Todo,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = todo.isCompleted,
                onCheckedChange = { onToggle() }
            )

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = todo.title,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (todo.isCompleted) {
                    TextDecoration.LineThrough
                } else {
                    TextDecoration.None
                }
            )

            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "刪除",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
fun AddTodoDialog(
    onDismiss: () -> Unit,
    onAdd: (String) -> Unit
) {
    var title by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("新增待辦事項") },
        text = {
            TextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("標題") },
                singleLine = true
            )
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank()) {
                        onAdd(title)
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text("新增")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}
```

### AppModule.kt (Hilt)

```kotlin
package com.example.todoapp.di

import android.content.Context
import androidx.room.Room
import com.example.todoapp.data.database.TodoDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideTodoDatabase(
        @ApplicationContext context: Context
    ): TodoDatabase {
        return Room.databaseBuilder(
            context,
            TodoDatabase::class.java,
            "todo_database"
        ).build()
    }

    @Provides
    fun provideTodoDao(database: TodoDatabase) = database.todoDao()
}
```

## 🤖 AI 輔助開發工作流程

### 1. 專案規劃
向 AI 描述應用需求：
```
"我想開發一個 Android 新聞閱讀應用，支援多個新聞源、離線閱讀、
收藏文章、深色模式、Widget。請幫我規劃架構和功能模組。"
```

### 2. 技術選型
讓 AI 推薦技術方案：
```
"基於新聞應用需求，推薦使用 Jetpack Compose 還是 XML Views？
資料庫用 Room 還是 Realm？網路請求用什麼庫？"
```

### 3. UI 開發
使用 AI 生成 Compose UI：
```
"創建一個新聞卡片 Composable，顯示標題、摘要、圖片、時間，
使用 Material Design 3 風格。"
```

### 4. API 整合
AI 協助處理網路請求：
```
"使用 Retrofit 創建一個 NewsApi 服務介面，獲取新聞列表和詳情，
並處理錯誤和載入狀態。"
```

### 5. 資料層設計
讓 AI 設計 Repository 模式：
```
"創建 NewsRepository，整合遠端 API 和本地 Room 資料庫，
實現離線優先策略。"
```

### 6. ViewModel 開發
AI 協助狀態管理：
```
"創建 NewsViewModel，使用 StateFlow 管理新聞列表狀態，
支援下拉刷新和分頁載入。"
```

### 7. 問題排查
向 AI 描述錯誤：
```
"我在使用 Hilt 時遇到 'Dagger does not support injection into private fields'
錯誤，如何解決？"
```

## 📊 專案範例清單

### 初級專案（1-2 週）
- ⭐ 計算機
- ⭐ 待辦事項
- ⭐ 倒數計時器
- ⭐ 單位轉換器
- ⭐ 記事本

### 中級專案（2-4 週）
- ⭐⭐ 天氣應用
- ⭐⭐ 新聞閱讀器
- ⭐⭐ 音樂播放器
- ⭐⭐ 記帳軟體
- ⭐⭐ 圖片瀏覽器

### 高級專案（4+ 週）
- ⭐⭐⭐ 即時通訊應用
- ⭐⭐⭐ 電商平台
- ⭐⭐⭐ 社交媒體應用
- ⭐⭐⭐ 影片串流
- ⭐⭐⭐ 健身追蹤器

## 🔧 開發工具

### Android Studio 功能
- **Layout Inspector** - UI 層級檢查
- **Profiler** - 效能分析
- **Logcat** - 日誌查看
- **Database Inspector** - 資料庫檢查
- **Network Inspector** - 網路監控
- **App Inspection** - 應用檢查

### 第三方工具
- **Postman** - API 測試
- **Stetho** - 偵錯工具
- **LeakCanary** - 記憶體洩漏偵測
- **Chucker** - HTTP 檢查器

### 測試工具
- **JUnit 5** - 單元測試
- **Espresso** - UI 測試
- **MockK** - Mock 框架
- **Turbine** - Flow 測試
- **Robolectric** - Android 測試

### CI/CD
- **GitHub Actions** - 自動化工作流
- **Bitrise** - 移動 CI/CD
- **Codemagic** - Flutter/Native CI/CD
- **Firebase App Distribution** - 測試分發

## 📚 學習資源

### 官方文檔
- [Android Developers](https://developer.android.com/)
- [Kotlin 文檔](https://kotlinlang.org/docs/home.html)
- [Jetpack Compose 教程](https://developer.android.com/jetpack/compose/tutorial)
- [Material Design](https://m3.material.io/)

### 推薦課程
- Android Kotlin Developer Nanodegree (Udacity)
- The Complete Android 14 Developer Course (Udemy)
- Android Basics with Compose (Google)

### 社群資源
- [Android Weekly](https://androidweekly.net/)
- [Kotlin Weekly](https://www.kotlinweekly.net/)
- [r/androiddev](https://www.reddit.com/r/androiddev/)
- [Stack Overflow - Android](https://stackoverflow.com/questions/tagged/android)

### YouTube 頻道
- Android Developers (官方)
- Philipp Lackner
- Stevdza-San
- Coding in Flow
- CodingWithMitch

### 中文資源
- Android 開發者中文官網
- 掘金 - Android 專區
- CSDN - Android 專區

## ⚡ 效能優化建議

### 1. Compose 優化

```kotlin
// 使用 remember 避免重組時重新創建
@Composable
fun MyScreen() {
    val scrollState = rememberScrollState()
    // ...
}

// 使用 derivedStateOf 避免不必要的重組
val shouldShowButton by remember {
    derivedStateOf {
        scrollState.value > 100
    }
}

// 使用 key 優化列表
LazyColumn {
    items(items, key = { it.id }) { item ->
        ItemCard(item)
    }
}
```

### 2. 圖片優化

```kotlin
// 使用 Coil 載入圖片
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(imageUrl)
        .crossfade(true)
        .size(300, 300) // 指定尺寸
        .build(),
    contentDescription = null
)
```

### 3. 資料庫優化

```kotlin
// 使用索引
@Entity(indices = [Index(value = ["userId"])])
data class User(...)

// 使用 Flow 而非 LiveData
@Query("SELECT * FROM users")
fun getAllUsers(): Flow<List<User>>

// 批次操作
@Transaction
suspend fun updateUsers(users: List<User>) {
    users.forEach { updateUser(it) }
}
```

### 4. 網路優化

```kotlin
// OkHttp 快取
val cacheSize = 10 * 1024 * 1024L // 10 MB
val cache = Cache(context.cacheDir, cacheSize)

val okHttpClient = OkHttpClient.Builder()
    .cache(cache)
    .build()
```

## 🐛 常見問題與解決方案

### Gradle 同步失敗
```kotlin
// 清理專案
./gradlew clean

// 刪除 .gradle 資料夾
rm -rf .gradle

// 更新 Gradle Wrapper
./gradlew wrapper --gradle-version 8.2
```

### 模擬器啟動慢
```bash
# 啟用硬體加速
# 確保 Intel HAXM 或 AMD-V 已啟用

# 使用 x86_64 系統映像
# 增加 RAM 分配
```

### 應用崩潰
```kotlin
// 查看 Logcat
// 使用 Firebase Crashlytics
implementation("com.google.firebase:firebase-crashlytics-ktx")
```

## 🚀 發布應用

### 1. 準備發布

#### 簽名配置
```kotlin
// app/build.gradle.kts
android {
    signingConfigs {
        create("release") {
            storeFile = file("../keystore.jks")
            storePassword = "password"
            keyAlias = "key"
            keyPassword = "password"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

#### 生成簽名金鑰
```bash
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-alias
```

### 2. 建置 AAB

```bash
# 建置 Android App Bundle
./gradlew bundleRelease

# 輸出位置：app/build/outputs/bundle/release/app-release.aab
```

### 3. 上傳到 Google Play

1. 登入 [Google Play Console](https://play.google.com/console)
2. 創建應用
3. 填寫應用資訊、截圖、描述
4. 上傳 AAB
5. 設定價格與發行範圍
6. 提交審核

### 使用 Fastlane

```ruby
# Fastfile
lane :beta do
  gradle(task: "bundleRelease")
  upload_to_play_store(track: "beta")
end
```

## 💰 商業化選項

### 應用內購買
```kotlin
// Google Play Billing Library
implementation("com.android.billingclient:billing-ktx:6.0.1")

// 購買流程
val billingClient = BillingClient.newBuilder(context)
    .setListener { billingResult, purchases ->
        // Handle purchase
    }
    .enablePendingPurchases()
    .build()
```

### 廣告整合
```kotlin
// Google AdMob
implementation("com.google.android.gms:play-services-ads:22.5.0")

// 載入橫幅廣告
AdView(context).apply {
    adUnitId = "ca-app-pub-xxxxx"
    setAdSize(AdSize.BANNER)
    loadAd(AdRequest.Builder().build())
}
```

## 🎯 最佳實踐

### Clean Architecture
```kotlin
// 分層架構
data/ (資料層)
  - repository/
  - source/
  - model/

domain/ (業務層)
  - usecase/
  - model/

ui/ (展示層)
  - screen/
  - component/
  - viewmodel/
```

### SOLID 原則
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### 無障礙設計
```kotlin
// 添加內容描述
Image(
    painter = painterResource(R.drawable.icon),
    contentDescription = "設定圖標"
)

// 語義標記
Text(
    "標題",
    modifier = Modifier.semantics {
        heading()
    }
)
```

## 🤝 貢獻與協作

歡迎提交你的 Android 專案！

### 專案要求
- 使用 Kotlin
- 支援 Android 7.0+
- 遵循 Material Design
- 包含完整的 README

### 提交流程
1. Fork 本倉庫
2. 創建功能分支
3. 編寫程式碼和測試
4. 提交 Pull Request

## 📄 授權

各專案請自行指定授權條款（MIT、Apache 2.0 等）。

---

**🚀 使用 Kotlin、Jetpack Compose 和 AI 打造現代化的 Android 應用！**

**最後更新**: 2025-11-16
**維護狀態**: ✅ 活躍開發
