# 🎮 2048 遊戲

一個使用 Flutter 開發的經典 2048 益智遊戲。

## 📋 專案資訊

- **框架**: Flutter
- **類型**: 益智解謎遊戲
- **難度**: ⭐⭐⭐
- **開發時間**: 1-2 週
- **平台**: iOS、Android、Web

## 🎮 遊戲特點

- **經典玩法**: 滑動合併相同數字的方塊
- **流暢動畫**: 優雅的過渡動畫效果
- **計分系統**: 即時分數和最高分追蹤
- **本地儲存**: 自動保存最高分記錄
- **響應式設計**: 適配各種螢幕尺寸
- **遊戲狀態**: 勝利和失敗檢測

## 🚀 安裝與運行

### 前置需求

- Flutter SDK 3.0+
- Dart 3.0+
- iOS 模擬器 或 Android 模擬器

### 安裝步驟

```bash
# 進入專案目錄
cd 2048-game

# 安裝依賴
flutter pub get
```

### 運行遊戲

```bash
# 在 iOS 上運行
flutter run -d ios

# 在 Android 上運行
flutter run -d android

# 在 Web 上運行
flutter run -d chrome
```

## 📁 專案結構

```
2048-game/
├── lib/
│   ├── main.dart              # 應用程式入口
│   ├── models/
│   │   ├── board.dart         # 遊戲邏輯和棋盤模型
│   │   └── tile.dart          # 方塊模型
│   ├── screens/
│   │   └── game_screen.dart   # 遊戲主畫面
│   └── widgets/
│       ├── game_board.dart    # 棋盤組件
│       ├── tile_widget.dart   # 方塊組件
│       └── score_card.dart    # 分數卡片組件
├── pubspec.yaml              # 專案配置
└── README.md                # 說明文件
```

## 🎯 核心功能

### 1. 遊戲邏輯

**方塊移動**:
- 上下左右滑動
- 相同數字自動合併
- 合併時分數累加

**遊戲規則**:
- 初始兩個方塊（2 或 4）
- 每次移動後生成新方塊
- 達到 2048 即獲勝
- 無法移動時遊戲結束

### 2. 棋盤系統

```dart
class Board {
  final int size = 4;
  List<List<Tile?>> grid;
  int score = 0;
  bool gameOver = false;
  bool won = false;

  // 初始化棋盤
  void initBoard() {
    grid = List.generate(size, (i) =>
      List.generate(size, (j) => null)
    );
    addRandomTile();
    addRandomTile();
  }

  // 移動邏輯
  bool move(Direction direction) {
    // 根據方向移動和合併方塊
    // 檢查遊戲狀態
  }
}
```

### 3. 手勢控制

```dart
GestureDetector(
  onVerticalDragEnd: (details) {
    if (details.primaryVelocity! < 0) {
      onSwipe(Direction.up);
    } else {
      onSwipe(Direction.down);
    }
  },
  onHorizontalDragEnd: (details) {
    if (details.primaryVelocity! < 0) {
      onSwipe(Direction.left);
    } else {
      onSwipe(Direction.right);
    }
  },
  // ...
)
```

### 4. 持久化儲存

```dart
// 保存最高分
Future<void> saveBestScore(int score) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt('bestScore', score);
}

// 讀取最高分
Future<void> loadBestScore() async {
  final prefs = await SharedPreferences.getInstance();
  bestScore = prefs.getInt('bestScore') ?? 0;
}
```

## 🎨 UI 設計

### 顏色方案

| 數值 | 背景顏色 | 文字顏色 |
|-----|---------|---------|
| 2 | #EEE4DA | #776E65 |
| 4 | #EDE0C8 | #776E65 |
| 8 | #F2B179 | #FFFFFF |
| 16 | #F59563 | #FFFFFF |
| 32 | #F67C5F | #FFFFFF |
| 64 | #F65E3B | #FFFFFF |
| 128 | #EDCF72 | #FFFFFF |
| 256 | #EDCC61 | #FFFFFF |
| 512 | #EDC850 | #FFFFFF |
| 1024 | #EDC53F | #FFFFFF |
| 2048 | #EDC22E | #FFFFFF |

### 自訂樣式

**修改棋盤大小**:
```dart
// 在 board.dart 中
Board({this.size = 4})  // 改為 5 或 6 增加難度
```

**修改顏色主題**:
```dart
// 在 tile_widget.dart 中修改 getTileColor() 函數
Color getTileColor(int? value) {
  // 自訂你的顏色方案
}
```

**調整動畫速度**:
```dart
// 在動畫組件中調整 duration
duration: const Duration(milliseconds: 200),
```

## 🎯 遊戲策略

### 最佳策略建議

1. **保持最大值在角落**
   - 選擇一個角落作為最大數字的位置
   - 盡量不要移動該角落

2. **構建遞減序列**
   - 在最大值旁邊排列遞減的數字
   - 例如：2048 -> 1024 -> 512 -> 256

3. **避免隨機移動**
   - 主要使用兩個方向（例如：左和下）
   - 減少使用右和上

4. **保持選項開放**
   - 不要讓棋盤填滿
   - 保持足夠的空間來移動

## 💰 商業化建議

### 1. 廣告整合

```yaml
# 在 pubspec.yaml 中添加
dependencies:
  google_mobile_ads: ^3.0.0
```

```dart
// 添加橫幅廣告
BannerAd(
  adUnitId: 'ca-app-pub-xxxxx',
  size: AdSize.banner,
  request: AdRequest(),
  listener: BannerAdListener(),
)
```

### 2. 內購功能

可添加的內購項目：
- **去廣告**: $1.99
- **撤銷步驟**: $0.99（允許撤銷最後一步）
- **提示系統**: $0.99（顯示最佳移動建議）
- **主題包**: $1.99（解鎖多種視覺主題）

### 3. 遊戲增強功能

- **排行榜**: Firebase 整合
- **成就系統**: 達成特定目標獲得獎勵
- **每日挑戰**: 特殊關卡模式
- **多種遊戲模式**:
  - 5x5 或 6x6 棋盤
  - 時間挑戰模式
  - 無盡模式

## 🔧 進階功能開發

### 1. 添加動畫效果

```dart
class AnimatedTile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      // 動畫屬性
    );
  }
}
```

### 2. 添加音效

```yaml
# pubspec.yaml
dependencies:
  audioplayers: ^5.0.0
```

```dart
// 播放音效
final player = AudioPlayer();
await player.play(AssetSource('sounds/merge.mp3'));
```

### 3. 添加撤銷功能

```dart
class Board {
  List<BoardState> history = [];

  void saveState() {
    history.add(BoardState(
      grid: List.from(grid),
      score: score,
    ));
  }

  void undo() {
    if (history.isNotEmpty) {
      final state = history.removeLast();
      grid = state.grid;
      score = state.score;
    }
  }
}
```

### 4. 添加主題系統

```dart
class GameTheme {
  final Color backgroundColor;
  final Map<int, Color> tileColors;
  final String name;

  // 多種主題預設
  static final classic = GameTheme(...);
  static final dark = GameTheme(...);
  static final neon = GameTheme(...);
}
```

## 📊 性能優化

### 1. 減少重建

```dart
// 使用 const 構造函數
const TileWidget(tile: tile);

// 使用 ValueKey 優化列表
GridView.builder(
  itemBuilder: (context, index) {
    return TileWidget(
      key: ValueKey('${row}_${col}'),
      tile: tile,
    );
  },
)
```

### 2. 優化動畫

```dart
// 使用 AnimatedBuilder 而不是 setState
AnimatedBuilder(
  animation: animation,
  builder: (context, child) {
    return Transform.translate(
      offset: animation.value,
      child: child,
    );
  },
)
```

## 🐛 常見問題

**Q: 遊戲在某些設備上運行緩慢？**

A: 降低動畫複雜度，減少不必要的重建：
```dart
// 禁用動畫（針對低端設備）
duration: const Duration(milliseconds: 0),
```

**Q: 如何更改棋盤尺寸？**

A: 在 `board.dart` 中修改：
```dart
Board({this.size = 5})  // 5x5 棋盤
```

**Q: 如何添加自訂字體？**

A:
1. 在 `pubspec.yaml` 中添加字體
2. 在 `ThemeData` 中設定字體系列

## 📱 發布檢查清單

- [ ] 測試所有設備尺寸（手機、平板）
- [ ] 測試 iOS 和 Android 平台
- [ ] 添加應用圖標和啟動畫面
- [ ] 優化性能（60 FPS）
- [ ] 整合 Firebase 分析
- [ ] 添加廣告或內購
- [ ] 編寫隱私政策
- [ ] 準備商店截圖和描述
- [ ] 進行 Beta 測試
- [ ] 設定 App Store / Google Play 清單

## 🎓 學習資源

- [Flutter 官方文檔](https://flutter.dev/)
- [Dart 語言指南](https://dart.dev/guides)
- [Flutter 遊戲開發](https://docs.flutter.dev/development/ui/animations)
- [SharedPreferences 文檔](https://pub.dev/packages/shared_preferences)

## 📝 未來改進

- [ ] 添加多人對戰模式
- [ ] 實現雲端存檔同步
- [ ] 添加社交分享功能
- [ ] 開發主題商店
- [ ] 添加更多遊戲模式
- [ ] 實現成就和徽章系統
- [ ] 添加每日挑戰
- [ ] 開發關卡編輯器

## 📄 授權

MIT License

## 🎮 開始遊戲！

現在你有了一個完整的 2048 遊戲！你可以：
1. 自訂 UI 主題和顏色
2. 添加新的遊戲模式
3. 整合商業化功能
4. 發布到 App Store 和 Google Play

享受開發和遊戲的樂趣！🚀
