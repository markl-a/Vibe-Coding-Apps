# React Native 跨平台移動應用
🤖 **AI-Driven | AI-Native** 🚀

使用 React Native 框架開發的跨平台移動應用，一次開發同時支援 iOS 和 Android。

## 📋 專案概述

React Native 是 Meta（Facebook）開發的開源框架，讓開發者使用 JavaScript 和 React 建立原生移動應用。透過 AI 輔助開發，可以大幅加速開發流程並提升程式碼品質。

### 為什麼選擇 React Native？

- **跨平台開發**：一套程式碼同時執行於 iOS 和 Android
- **熱重載**：修改程式碼即時看到效果，開發效率高
- **原生性能**：使用原生組件，性能接近原生應用
- **生態系統成熟**：豐富的第三方庫和社群支援
- **AI 友好**：JavaScript/TypeScript 語法簡潔，AI 輔助效果極佳
- **Web 技能遷移**：React 開發者容易上手

## 🎯 適合開發的應用類型

### 社交類應用
- 即時通訊應用
- 社交網絡平台
- 論壇與社群
- 約會交友應用

### 工具類應用
- 待辦事項管理
- 筆記應用
- 計算機與轉換工具
- 文件掃描器
- 二維碼生成器

### 電商應用
- 購物商城
- 商品展示
- 訂單管理
- 支付整合

### 內容類應用
- 新聞閱讀器
- 部落格客戶端
- 影片串流
- 音樂播放器
- 播客應用

### 健康健身
- 運動追蹤
- 卡路里計算
- 健身計劃
- 冥想與放鬆

### 生產力工具
- 時間追蹤
- 習慣養成
- 目標管理
- 專案管理

## 🛠️ 技術棧

### 核心框架
- **React Native** - 跨平台框架
- **Expo** - 快速開發工具鏈（推薦初學者）
- **React** - UI 框架
- **JavaScript / TypeScript** - 程式語言

### 狀態管理
- **Redux Toolkit** - 強大的狀態管理
- **Zustand** - 輕量級狀態管理
- **React Query** - 伺服器狀態管理
- **Context API** - React 內建狀態管理

### 導航
- **React Navigation** - 官方推薦導航庫
- **React Native Navigation** - Wix 開發的原生導航

### UI 組件庫
- **React Native Paper** - Material Design
- **NativeBase** - 跨平台 UI 組件
- **React Native Elements** - 通用組件庫
- **Tamagui** - 高性能 UI 庫

### 資料持久化
- **AsyncStorage** - 簡單鍵值對儲存
- **React Native MMKV** - 高性能本地儲存
- **Realm** - 移動資料庫
- **WatermelonDB** - 可擴展資料庫

### 網路請求
- **Axios** - HTTP 客戶端
- **Fetch API** - 原生 API
- **Apollo Client** - GraphQL 客戶端

### 多媒體
- **react-native-video** - 視頻播放
- **react-native-image-picker** - 圖片選擇
- **react-native-camera** - 相機功能
- **react-native-sound** - 音頻播放

### 工具與輔助
- **react-native-svg** - SVG 支援
- **react-native-maps** - 地圖整合
- **react-native-gesture-handler** - 手勢處理
- **react-native-reanimated** - 高性能動畫
- **Formik / React Hook Form** - 表單處理

## 🚀 快速開始

### 使用 Expo（推薦初學者）

```bash
# 安裝 Expo CLI
npm install -g expo-cli

# 創建新專案
expo init MyApp

# 選擇模板（blank、blank-typescript、tabs 等）

# 啟動開發伺服器
cd MyApp
expo start

# 使用 Expo Go App 掃描 QR Code 在手機上預覽
```

### 使用 React Native CLI（更多控制）

```bash
# 創建新專案
npx react-native init MyApp

# 啟動 Metro bundler
cd MyApp
npx react-native start

# 在另一個終端運行
npx react-native run-android  # Android
npx react-native run-ios       # iOS (僅限 macOS)
```

### 基本專案結構

```
my-app/
├── App.js / App.tsx          # 應用入口
├── package.json              # 依賴管理
├── app.json                  # 應用配置
├── babel.config.js           # Babel 配置
├── metro.config.js           # Metro 打包配置
├── src/
│   ├── components/           # 可重用組件
│   ├── screens/              # 畫面/頁面
│   ├── navigation/           # 導航配置
│   ├── services/             # API 服務
│   ├── store/                # 狀態管理
│   ├── utils/                # 工具函數
│   ├── hooks/                # 自定義 Hooks
│   ├── assets/               # 圖片、字體等
│   └── constants/            # 常量配置
├── android/                  # Android 原生代碼
└── ios/                      # iOS 原生代碼
```

## 💡 範例專案：待辦事項應用

### App.tsx (基礎範例)

```typescript
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');

  const addTodo = () => {
    if (inputText.trim()) {
      setTodos([
        ...todos,
        { id: Date.now().toString(), text: inputText, completed: false },
      ]);
      setInputText('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>我的待辦事項</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="新增待辦事項..."
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity
              style={styles.todoText}
              onPress={() => toggleTodo(item.id)}
            >
              <Text
                style={[
                  styles.todoTextContent,
                  item.completed && styles.completedText,
                ]}
              >
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteButton}>刪除</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  todoText: {
    flex: 1,
  },
  todoTextContent: {
    fontSize: 16,
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
```

## 🤖 AI 輔助開發工作流程

### 1. 需求與規劃
向 AI 描述應用需求：
```
"我想開發一個健身追蹤 App，需要記錄每日運動、卡路里消耗、
設定目標，並顯示進度圖表。請幫我規劃功能模組和畫面架構。"
```

### 2. 專案初始化
讓 AI 協助選擇技術棧：
```
"基於上述需求，推薦我使用的狀態管理方案、UI 庫和導航方式。"
```

### 3. 組件開發
使用 AI 生成組件：
```
"創建一個運動記錄卡片組件，顯示運動名稱、持續時間、消耗卡路里，
並支援點擊編輯和刪除。"
```

### 4. API 整合
AI 協助處理網路請求：
```
"使用 Axios 創建一個 API 服務層，包含用戶登入、獲取運動記錄、
新增記錄等功能，並處理錯誤。"
```

### 5. 狀態管理
讓 AI 設計 Redux/Zustand store：
```
"使用 Redux Toolkit 創建運動記錄的 store，包含狀態、actions 和 reducers。"
```

### 6. 樣式與動畫
AI 協助美化界面：
```
"為我的運動列表添加滑動刪除動畫，使用 react-native-reanimated。"
```

### 7. 問題排查
向 AI 描述錯誤：
```
"我在 iOS 上運行時出現 'Invariant Violation: View config not found' 錯誤，
如何解決？"
```

## 📊 專案範例清單

### 初級專案（1-2 週）
- ⭐ 計算機應用
- ⭐ 待辦事項列表
- ⭐ 天氣查詢應用
- ⭐ 貨幣轉換器
- ⭐ 記事本

### 中級專案（2-4 週）
- ⭐⭐ 新聞閱讀器（API 整合）
- ⭐⭐ 購物清單（本地儲存）
- ⭐⭐ 音樂播放器
- ⭐⭐ 相冊應用
- ⭐⭐ 健身追蹤器

### 高級專案（4+ 週）
- ⭐⭐⭐ 即時通訊應用
- ⭐⭐⭐ 社交媒體 App
- ⭐⭐⭐ 電商平台
- ⭐⭐⭐ 視頻串流應用
- ⭐⭐⭐ 位置分享應用

## 🔧 常用開發工具

### IDE / 編輯器
- **Visual Studio Code** + React Native Tools 擴充
- **WebStorm** - JetBrains IDE
- **Atom** - 輕量級編輯器

### 偵錯工具
- **React Native Debugger** - 獨立偵錯工具
- **Flipper** - Meta 官方偵錯平台
- **Reactotron** - React/React Native 偵錯工具

### 效能監控
- **Sentry** - 錯誤追蹤
- **Firebase Crashlytics** - 崩潰報告
- **New Relic** - 效能監控

### 測試工具
- **Jest** - 單元測試
- **React Native Testing Library** - 組件測試
- **Detox** - E2E 測試
- **Appium** - 跨平台自動化測試

### 建置與部署
- **Fastlane** - 自動化建置部署
- **CodePush** - 熱更新（Microsoft）
- **EAS Build** - Expo 雲端建置
- **Bitrise** - CI/CD 平台

## 📚 學習資源

### 官方文檔
- [React Native 官方文檔](https://reactnative.dev/)
- [Expo 文檔](https://docs.expo.dev/)
- [React 文檔](https://react.dev/)

### 推薦課程
- React Native - The Practical Guide (Udemy)
- React Native 官方教程
- Expo 官方範例

### 社群資源
- [React Native Community](https://github.com/react-native-community)
- [Awesome React Native](https://github.com/jondot/awesome-react-native)
- Stack Overflow - React Native 標籤
- Discord / Reddit 社群

### YouTube 頻道
- Traversy Media
- Programming with Mosh
- The Net Ninja
- Academind

## ⚡ 效能優化建議

### 1. 列表優化
- 使用 `FlatList` 的 `getItemLayout` 提升滾動性能
- 實作 `keyExtractor` 避免重複渲染
- 使用 `removeClippedSubviews` 回收離屏視圖

### 2. 圖片優化
- 使用 `react-native-fast-image` 快取圖片
- 壓縮並使用適當尺寸的圖片
- 實作圖片懶載入

### 3. 狀態管理
- 避免不必要的重新渲染（使用 `React.memo`）
- 合理拆分組件
- 使用 `useMemo` 和 `useCallback`

### 4. 原生模組
- 複雜計算移至原生端
- 使用 JSI (JavaScript Interface) 提升性能

### 5. 打包優化
- 啟用 Hermes 引擎（Android 預設，iOS 可選）
- 移除無用的 console.log
- 使用 ProGuard 壓縮 Android 代碼

## 🐛 常見問題與解決方案

### iOS 建置問題
```bash
# 清理建置快取
cd ios && pod deintegrate && pod install
cd .. && npx react-native run-ios
```

### Android Gradle 問題
```bash
# 清理 Gradle 快取
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

### Metro bundler 快取問題
```bash
# 清理快取
npx react-native start --reset-cache
```

### 依賴衝突
```bash
# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

## 🚀 發布應用

### iOS (App Store)
1. 在 Xcode 中配置簽名
2. 建立 Archive
3. 使用 Transporter 上傳到 App Store Connect
4. 填寫應用資訊並提交審核

### Android (Google Play)
1. 生成簽名密鑰
2. 配置 `android/app/build.gradle`
3. 建置 AAB 或 APK
```bash
cd android
./gradlew bundleRelease
```
4. 上傳到 Google Play Console

### 使用 Fastlane 自動化
```ruby
# Fastfile 範例
lane :beta do
  increment_build_number
  build_app
  upload_to_testflight
end
```

## 💰 商業化選項

### 應用內購買 (IAP)
- **react-native-iap** - 跨平台 IAP 庫
- 支援訂閱、消耗品、非消耗品

### 廣告整合
- **Google AdMob** - 橫幅、插頁、獎勵廣告
- **Facebook Audience Network**
- **react-native-google-mobile-ads**

### 付費解鎖
- Premium 功能解鎖
- 移除廣告選項

## 🎯 最佳實踐

### 程式碼品質
- 使用 TypeScript 提升類型安全
- 遵循 ESLint 規則
- 實作單元測試（覆蓋率 > 80%）
- 使用 Prettier 格式化代碼

### 安全性
- 不在代碼中硬編碼 API 金鑰
- 使用環境變數 (`react-native-config`)
- HTTPS 加密通訊
- 實作 SSL Pinning

### 用戶體驗
- 實作載入狀態指示器
- 優雅的錯誤處理
- 離線模式支援
- 適當的動畫與過渡效果

### 可訪問性 (Accessibility)
- 添加 `accessibilityLabel`
- 支援屏幕閱讀器
- 適當的顏色對比度
- 支援動態字體大小

## 🤝 貢獻與協作

歡迎提交你的 React Native 專案！

### 專案要求
- 包含完整的 README
- 程式碼註釋清晰
- 可正常運行
- 說明使用的 AI 工具

### 提交流程
1. Fork 本倉庫
2. 創建功能分支
3. 提交代碼
4. 發起 Pull Request

## 📄 授權

各專案請自行指定授權條款（MIT、Apache 2.0 等）。

---

**🚀 使用 AI 加速你的 React Native 開發之旅！**

**最後更新**: 2025-11-16
**維護狀態**: ✅ 活躍開發
