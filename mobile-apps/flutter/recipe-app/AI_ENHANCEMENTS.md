# Recipe App - AI 增強功能說明

本文檔說明 Recipe App 新增的 AI 智能功能。

## 🤖 AI 功能概覽

### 1. 🎯 個性化食譜推薦系統

基於多維度算法為用戶推薦最合適的食譜。

**推薦因子：**
- 用戶評分歷史
- 收藏記錄
- 瀏覽歷史
- 類別偏好
- 烹飪技能水平
- 可用時間
- 飲食限制（素食、無麩質等）
- 過敏原避免

**算法權重：**
```
總分 = 基礎評分(10分) +
       類別匹配(20分) +
       時間適配(15分) +
       難度適配(10分) +
       飲食符合(25分) +
       過敏檢查(-50分) +
       收藏相似度(5分) +
       新鮮度(10分) +
       隨機因子(5分)
```

**使用示例：**
```dart
final aiService = AIRecipeService();

// 獲取推薦食譜
List<Recipe> recommendations = aiService.recommendRecipes(
  allRecipes,
  favoriteRecipes: userFavorites,
  searchHistory: userSearchHistory,
  limit: 10,
);
```

---

### 2. 📊 智能營養分析

自動計算食譜的營養成分並提供健康建議。

**分析內容：**
- 卡路里計算
- 三大營養素（蛋白質、碳水化合物、脂肪）
- 膳食纖維
- 每份營養vs總營養
- 健康評分（0-100分）
- 個性化營養建議

**健康評分算法：**
```
基礎分數：60分

加分項：
+ 高蛋白（≥20g）：+10分
+ 中蛋白（≥15g）：+5分
+ 高纖維（≥5g）：+10分
+ 中纖維（≥3g）：+5分
+ 適中卡路里（300-600）：+10分
+ 低脂肪（<10g）：+10分

扣分項：
- 高卡路里（>800）：-10分
- 高脂肪（>30g）：-10分

最終分數：0-100（鉗位處理）
```

**營養建議示例：**
- ✅ 營養均衡，適合日常食用！
- 💡 卡路里較高，建議適量食用或增加運動量
- 🥩 蛋白質含量偏低，可以添加瘦肉、雞蛋或豆製品
- 🥬 纖維質不足，建議搭配蔬菜或全穀物
- ⚠️ 脂肪含量較高，可以減少油量或選用健康油脂

**使用示例：**
```dart
NutritionAnalysis analysis = aiService.analyzeNutrition(recipe);

print('卡路里：${analysis.perServing.calories}');
print('蛋白質：${analysis.perServing.protein}g');
print('健康評分：${analysis.healthScore}/100');

for (var suggestion in analysis.suggestions) {
  print(suggestion);
}
```

---

### 3. 🔄 智能食材替代建議

當缺少某些食材或有特殊飲食需求時，AI 建議可替代的食材。

**支持的替代類型：**

#### 蛋白質來源
| 原食材 | 替代品 | 比例 | 備註 |
|--------|--------|------|------|
| 雞肉 | 豬肉/火雞肉 | 1:1 | 烹飪時間可能需調整 |
| 雞肉 | 板豆腐/素雞 | 1:1 | 素食友好 |

#### 雞蛋替代
| 原食材 | 替代品 | 比例 | 備註 |
|--------|--------|------|------|
| 雞蛋 | 亞麻籽粉+水 | 1蛋 = 1湯匙+3湯匙水 | 適合烘焙，需靜置15分鐘 |
| 雞蛋 | 香蕉泥 | 1蛋 = 1/4杯 | 適合甜點，增加甜味 |

#### 乳製品替代
| 原食材 | 替代品 | 比例 | 備註 |
|--------|--------|------|------|
| 牛奶 | 杏仁奶/豆漿/燕麥奶 | 1:1 | 植物性替代 |
| 奶油 | 椰子油/酪梨 | 1:1 | 健康油脂 |

#### 無麩質替代
| 原食材 | 替代品 | 比例 | 備註 |
|--------|--------|------|------|
| 麵粉 | 無麩質麵粉混合 | 1:1 | 適合麩質過敏 |

#### 糖替代
| 原食材 | 替代品 | 比例 | 備註 |
|--------|--------|------|------|
| 糖 | 蜂蜜/楓糖漿 | 1杯糖 = 3/4杯液體甜味劑 | 需減少其他液體 |

**使用示例：**
```dart
List<IngredientSubstitution> subs = aiService.suggestSubstitutions(
  '雞蛋',
  dietaryRestriction: 'vegetarian',
);

for (var sub in subs) {
  print('${sub.original} → ${sub.substitute}');
  print('比例：${sub.ratio}');
  print('備註：${sub.notes}\n');
}
```

---

### 4. 🛒 智能購物清單生成

根據選擇的多個食譜，自動生成合併優化的購物清單。

**智能功能：**
- 自動合併相同食材
- 智能數量累加
- 按類別分組
- 標記用於哪些食譜
- 可勾選已購買項目

**食材分類：**
- 🥩 肉類海鮮
- 🥬 蔬菜
- 🍎 水果
- 🍚 主食
- 🥛 乳蛋類
- 🧂 調味料
- 📦 其他

**使用示例：**
```dart
List<Recipe> selectedRecipes = [recipe1, recipe2, recipe3];

ShoppingList list = aiService.generateShoppingList(selectedRecipes);

print('共 ${list.totalItems} 項食材');

// 按類別顯示
list.groupedItems.forEach((category, items) {
  print('\n$category:');
  for (var item in items) {
    print('  [ ] ${item.name} - ${item.quantity}');
    print('      用於：${item.recipes.join(', ')}');
  }
});
```

**示例輸出：**
```
共 15 項食材

肉類海鮮:
  [ ] 雞胸肉 - 500g
      用於：宮保雞丁, 雞肉沙拉
  [ ] 蝦仁 - 200g
      用於：蝦仁炒飯

蔬菜:
  [ ] 青椒 - 2個
      用於：宮保雞丁
  [ ] 生菜 - 1顆
      用於：雞肉沙拉

調味料:
  [ ] 醬油 - 3湯匙
      用於：宮保雞丁, 蝦仁炒飯
```

---

### 5. ⏱️ 烹飪計時器功能

智能計時器輔助烹飪過程。

**功能特點：**
- 多步驟計時
- 背景運行
- 到時提醒
- 暫停/繼續
- 聲音/震動提醒

**使用場景：**
```dart
// 創建計時器
CookingTimer timer = CookingTimer(
  duration: Duration(minutes: 20),
  title: '煮飯',
  onComplete: () {
    showNotification('煮飯完成！');
  },
);

// 啟動
timer.start();

// 暫停
timer.pause();

// 繼續
timer.resume();

// 取消
timer.cancel();
```

---

### 6. ⭐ 評分系統

完整的食譜評分和評論系統。

**評分維度：**
- 整體評分（1-5星）
- 美味度
- 難易度
- 準確度（實際vs描述）

**評論功能：**
- 文字評論
- 烹飪心得
- 改良建議
- 照片分享

**統計分析：**
- 平均評分
- 評分分佈
- 熱門評論
- 改良建議統計

**數據結構：**
```dart
class RecipeRating {
  final String userId;
  final double overall; // 1-5
  final double taste;
  final double difficulty;
  final double accuracy;
  final String comment;
  final List<String> photos;
  final DateTime createdAt;
}
```

**使用示例：**
```dart
// 添加評分
RecipeRating rating = RecipeRating(
  userId: 'user123',
  overall: 4.5,
  taste: 5.0,
  difficulty: 3.0,
  accuracy: 4.0,
  comment: '非常美味！下次會再做',
  photos: ['photo1.jpg'],
  createdAt: DateTime.now(),
);

await recipeProvider.addRating(recipe.id, rating);

// 獲取平均評分
double avgRating = recipe.calculateAverageRating();
print('平均評分：$avgRating ⭐');
```

---

## 🎯 用戶偏好設定

AI 系統支持個性化設定：

```dart
Map<String, dynamic> preferences = {
  // 喜愛的料理類別
  'favoriteCategories': ['中式料理', '日式料理'],

  // 過敏原
  'allergies': ['花生', '海鮮'],

  // 飲食限制
  'dietaryRestrictions': ['vegetarian'], // 或 'gluten-free', 'vegan'

  // 烹飪技能
  'skillLevel': 'intermediate', // 'beginner', 'advanced'

  // 最長烹飪時間（分鐘）
  'cookingTime': 60,
};

aiService.updateUserPreferences(preferences);
```

---

## 🚀 完整使用流程示例

### 場景：週末準備三餐

```dart
// 1. 設定偏好
aiService.updateUserPreferences({
  'favoriteCategories': ['中式料理', '健康輕食'],
  'allergies': ['海鮮'],
  'cookingTime': 45,
  'skillLevel': 'intermediate',
});

// 2. 獲取推薦食譜
List<Recipe> recommendations = aiService.recommendRecipes(
  allRecipes,
  favoriteRecipes: userFavorites,
  limit: 10,
);

print('為您推薦 ${recommendations.length} 道食譜：');
for (var recipe in recommendations) {
  print('- ${recipe.title}');
}

// 3. 選擇食譜並分析營養
Recipe selectedRecipe = recommendations[0];
NutritionAnalysis nutrition = aiService.analyzeNutrition(selectedRecipe);

print('\n營養分析：');
print('卡路里：${nutrition.perServing.calories}');
print('健康評分：${nutrition.healthScore}/100');
print('\n建議：');
nutrition.suggestions.forEach(print);

// 4. 處理缺少的食材
String missingIngredient = '雞蛋';
List<IngredientSubstitution> subs = aiService.suggestSubstitutions(
  missingIngredient,
  userAllergens: ['海鮮'],
);

print('\n$missingIngredient 的替代方案：');
for (var sub in subs) {
  print('${sub.substitute} (${sub.ratio})');
}

// 5. 生成購物清單
List<Recipe> selectedRecipes = [
  recommendations[0],
  recommendations[1],
  recommendations[2],
];

ShoppingList shoppingList = aiService.generateShoppingList(selectedRecipes);

print('\n購物清單（${shoppingList.totalItems} 項）：');
shoppingList.groupedItems.forEach((category, items) {
  print('\n$category:');
  for (var item in items) {
    print('  [ ] ${item.name} - ${item.quantity}');
  }
});

// 6. 開始烹飪
print('\n開始烹飪 ${selectedRecipe.title}');

// 使用計時器
for (var i = 0; i < selectedRecipe.steps.length; i++) {
  print('\n步驟 ${i + 1}: ${selectedRecipe.steps[i]}');

  // 如果步驟需要計時
  if (selectedRecipe.steps[i].contains('分鐘')) {
    CookingTimer timer = CookingTimer(
      duration: Duration(minutes: 15),
      title: '步驟 ${i + 1}',
    );
    timer.start();
  }
}

// 7. 完成後評分
RecipeRating rating = RecipeRating(
  userId: 'user123',
  overall: 4.5,
  taste: 5.0,
  difficulty: 3.0,
  accuracy: 4.5,
  comment: '非常成功！家人都很喜歡',
  createdAt: DateTime.now(),
);

await recipeProvider.addRating(selectedRecipe.id, rating);
print('\n已提交評分！謝謝您的反饋');
```

---

## 📊 AI 性能優化

### 推薦算法優化
- 使用緩存避免重複計算
- 批量處理提升效率
- 異步加載不阻塞 UI

### 營養計算優化
- 食材營養數據庫緩存
- 增量計算（僅計算變化部分）

### 最佳實踐
```dart
// ✅ 好的做法
final recommendations = await compute(
  _computeRecommendations,
  allRecipes,
); // 使用 isolate 避免阻塞

// ❌ 避免的做法
for (var recipe in allRecipes) {
  // 在主線程同步計算大量數據
}
```

---

## 🔮 未來增強方向

### 短期（1-2個月）
- [ ] 整合真實營養數據庫 API
- [ ] 機器學習模型優化推薦算法
- [ ] 語音烹飪助手
- [ ] AR 烹飪指導

### 中期（3-6個月）
- [ ] 社交分享功能
- [ ] 用戶生成內容（UGC）
- [ ] 烹飪影片整合
- [ ] 智能餐點規劃

### 長期（6個月+）
- [ ] 電商整合（一鍵購買食材）
- [ ] IoT 設備整合（智能廚房）
- [ ] 個性化營養師建議
- [ ] AI 生成新食譜

---

**享受 AI 驅動的智能烹飪體驗！** 👨‍🍳🤖
