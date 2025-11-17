import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../models/category.dart';

/// Recipe App 使用範例
///
/// 這個範例展示如何:
/// 1. 創建和管理食譜
/// 2. 使用分類系統
/// 3. 收藏功能
/// 4. 搜尋和篩選
/// 5. 評分系統

/// 範例 1: 食譜測試數據
class RecipeTestData {
  /// 創建義大利麵食譜
  static Recipe createPastaRecipe() {
    return Recipe(
      id: '1',
      name: '番茄羅勒義大利麵',
      description: '經典的義式料理,簡單卻美味',
      imageUrl: 'https://example.com/pasta.jpg',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: Difficulty.easy,
      category: RecipeCategory.pasta,
      ingredients: [
        '義大利麵 400g',
        '新鮮番茄 6顆',
        '大蒜 4瓣',
        '新鮮羅勒葉 1把',
        '橄欖油 3大匙',
        '鹽 適量',
        '黑胡椒 適量',
        '帕瑪森起司 50g',
      ],
      instructions: [
        '煮一鍋滾水,加入鹽和橄欖油',
        '放入義大利麵,依包裝指示煮至彈牙',
        '番茄切丁,大蒜切末',
        '熱鍋加入橄欖油,爆香大蒜',
        '加入番茄丁,煮至軟化出汁',
        '撈起義大利麵,拌入番茄醬汁',
        '加入撕碎的羅勒葉,調味',
        '盛盤後撒上帕瑪森起司',
      ],
      rating: 4.5,
      reviews: 128,
      isFavorite: false,
      tags: ['義式', '素食', '簡單'],
    );
  }

  /// 創建泰式料理食譜
  static Recipe createThaiRecipe() {
    return Recipe(
      id: '2',
      name: '泰式綠咖哩雞',
      description: '香辣濃郁的泰國經典菜餚',
      imageUrl: 'https://example.com/thai-curry.jpg',
      prepTime: 20,
      cookTime: 30,
      servings: 4,
      difficulty: Difficulty.medium,
      category: RecipeCategory.asian,
      ingredients: [
        '雞腿肉 500g',
        '綠咖哩醬 3大匙',
        '椰奶 400ml',
        '茄子 2條',
        '甜羅勒葉 1把',
        '檸檬葉 3片',
        '魚露 2大匙',
        '棕櫚糖 1大匙',
        '紅辣椒 2根',
      ],
      instructions: [
        '雞肉切塊,茄子切段',
        '熱鍋炒綠咖哩醬至香',
        '加入一半椰奶,煮至油水分離',
        '放入雞肉,炒至變色',
        '加入剩餘椰奶、檸檬葉',
        '放入茄子,煮10分鐘',
        '加入魚露、糖調味',
        '最後加入羅勒葉和辣椒',
      ],
      rating: 4.8,
      reviews: 95,
      isFavorite: true,
      tags: ['泰式', '辣', '咖哩'],
    );
  }

  /// 獲取完整食譜集合
  static List<Recipe> getAllRecipes() {
    return [
      // 義式料理
      createPastaRecipe(),
      Recipe(
        id: '3',
        name: '瑪格麗特披薩',
        description: '最經典的義大利披薩',
        imageUrl: 'https://example.com/pizza.jpg',
        prepTime: 30,
        cookTime: 15,
        servings: 2,
        difficulty: Difficulty.medium,
        category: RecipeCategory.italian,
        ingredients: ['麵團', '番茄醬', '莫札瑞拉起司', '羅勒葉', '橄欖油'],
        instructions: [
          '烤箱預熱至250°C',
          '麵團擀開成圓形',
          '塗抹番茄醬',
          '鋪上起司',
          '烤12-15分鐘至金黃',
          '出爐後撒羅勒葉',
        ],
        rating: 4.7,
        reviews: 203,
        isFavorite: true,
        tags: ['義式', '披薩', '起司'],
      ),

      // 亞洲料理
      createThaiRecipe(),
      Recipe(
        id: '4',
        name: '日式豬排飯',
        description: '酥脆多汁的日式炸豬排',
        imageUrl: 'https://example.com/tonkatsu.jpg',
        prepTime: 20,
        cookTime: 15,
        servings: 2,
        difficulty: Difficulty.medium,
        category: RecipeCategory.japanese,
        ingredients: [
          '豬里肌肉 2片',
          '麵包粉 100g',
          '雞蛋 2顆',
          '麵粉 適量',
          '高麗菜絲',
          '豬排醬',
        ],
        instructions: [
          '豬肉拍鬆,撒鹽胡椒',
          '依序沾麵粉、蛋液、麵包粉',
          '油炸至金黃酥脆',
          '切片擺盤,配高麗菜絲',
          '淋上豬排醬',
        ],
        rating: 4.6,
        reviews: 156,
        isFavorite: false,
        tags: ['日式', '炸物', '豬肉'],
      ),

      // 甜點
      Recipe(
        id: '5',
        name: '提拉米蘇',
        description: '義大利經典甜點',
        imageUrl: 'https://example.com/tiramisu.jpg',
        prepTime: 30,
        cookTime: 0,
        servings: 6,
        difficulty: Difficulty.medium,
        category: RecipeCategory.dessert,
        ingredients: [
          '手指餅乾 200g',
          '馬斯卡彭起司 500g',
          '蛋黃 4個',
          '糖 100g',
          '濃縮咖啡 200ml',
          '可可粉 適量',
        ],
        instructions: [
          '蛋黃加糖打發至泛白',
          '加入馬斯卡彭起司拌勻',
          '手指餅乾沾咖啡液',
          '一層餅乾一層起司糊',
          '冷藏4小時以上',
          '食用前撒可可粉',
        ],
        rating: 4.9,
        reviews: 312,
        isFavorite: true,
        tags: ['甜點', '義式', '咖啡'],
      ),

      // 早餐
      Recipe(
        id: '6',
        name: '班尼迪克蛋',
        description: '經典的早午餐選擇',
        imageUrl: 'https://example.com/eggs-benedict.jpg',
        prepTime: 15,
        cookTime: 15,
        servings: 2,
        difficulty: Difficulty.hard,
        category: RecipeCategory.breakfast,
        ingredients: [
          '英式鬆餅 2個',
          '雞蛋 4顆',
          '培根或火腿',
          '荷蘭醬材料',
        ],
        instructions: [
          '準備荷蘭醬',
          '烤鬆餅至金黃',
          '煎培根',
          '水波蛋',
          '組合:鬆餅、培根、蛋',
          '淋上荷蘭醬',
        ],
        rating: 4.4,
        reviews: 87,
        isFavorite: false,
        tags: ['早餐', '蛋料理', '西式'],
      ),

      // 湯品
      Recipe(
        id: '7',
        name: '法式洋蔥湯',
        description: '溫暖香醇的經典湯品',
        imageUrl: 'https://example.com/onion-soup.jpg',
        prepTime: 15,
        cookTime: 45,
        servings: 4,
        difficulty: Difficulty.easy,
        category: RecipeCategory.soup,
        ingredients: [
          '洋蔥 6顆',
          '牛高湯 1L',
          '法國麵包',
          '格魯耶爾起司',
          '奶油 50g',
          '白酒 100ml',
        ],
        instructions: [
          '洋蔥切絲',
          '奶油炒洋蔥至焦糖化(30分鐘)',
          '加入白酒收汁',
          '倒入高湯,煮15分鐘',
          '盛入碗中,放麵包',
          '撒起司,烤至融化',
        ],
        rating: 4.5,
        reviews: 134,
        isFavorite: false,
        tags: ['法式', '湯品', '起司'],
      ),

      // 沙拉
      Recipe(
        id: '8',
        name: '凱撒沙拉',
        description: '清爽健康的經典沙拉',
        imageUrl: 'https://example.com/caesar-salad.jpg',
        prepTime: 15,
        cookTime: 10,
        servings: 2,
        difficulty: Difficulty.easy,
        category: RecipeCategory.salad,
        ingredients: [
          '羅曼生菜 1顆',
          '烤麵包丁',
          '帕瑪森起司',
          '凱撒醬',
          '雞胸肉(可選)',
        ],
        instructions: [
          '生菜洗淨瀝乾',
          '雞肉煎熟切片',
          '混合生菜、麵包丁',
          '淋上凱撒醬',
          '撒帕瑪森起司',
          '擺上雞肉片',
        ],
        rating: 4.3,
        reviews: 98,
        isFavorite: false,
        tags: ['沙拉', '健康', '輕食'],
      ),
    ];
  }
}

/// 範例 2: 食譜搜尋和篩選
class RecipeSearchHelper {
  /// 按名稱搜尋
  static List<Recipe> searchByName(List<Recipe> recipes, String query) {
    return recipes
        .where((r) => r.name.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }

  /// 按分類篩選
  static List<Recipe> filterByCategory(
    List<Recipe> recipes,
    RecipeCategory category,
  ) {
    return recipes.where((r) => r.category == category).toList();
  }

  /// 按難度篩選
  static List<Recipe> filterByDifficulty(
    List<Recipe> recipes,
    Difficulty difficulty,
  ) {
    return recipes.where((r) => r.difficulty == difficulty).toList();
  }

  /// 按時間篩選 (總時間少於指定分鐘)
  static List<Recipe> filterByTime(List<Recipe> recipes, int maxMinutes) {
    return recipes
        .where((r) => (r.prepTime + r.cookTime) <= maxMinutes)
        .toList();
  }

  /// 按評分篩選
  static List<Recipe> filterByRating(List<Recipe> recipes, double minRating) {
    return recipes.where((r) => r.rating >= minRating).toList();
  }

  /// 獲取收藏的食譜
  static List<Recipe> getFavorites(List<Recipe> recipes) {
    return recipes.where((r) => r.isFavorite).toList();
  }

  /// 按標籤搜尋
  static List<Recipe> searchByTag(List<Recipe> recipes, String tag) {
    return recipes.where((r) => r.tags.contains(tag)).toList();
  }
}

/// 範例 3: 食譜統計分析
class RecipeStatistics {
  /// 計算平均評分
  static double getAverageRating(List<Recipe> recipes) {
    if (recipes.isEmpty) return 0.0;
    return recipes.fold(0.0, (sum, r) => sum + r.rating) / recipes.length;
  }

  /// 計算總評論數
  static int getTotalReviews(List<Recipe> recipes) {
    return recipes.fold(0, (sum, r) => sum + r.reviews);
  }

  /// 獲取最受歡迎的食譜
  static Recipe? getMostPopular(List<Recipe> recipes) {
    if (recipes.isEmpty) return null;
    return recipes.reduce((a, b) => a.reviews > b.reviews ? a : b);
  }

  /// 獲取評分最高的食譜
  static Recipe? getHighestRated(List<Recipe> recipes) {
    if (recipes.isEmpty) return null;
    return recipes.reduce((a, b) => a.rating > b.rating ? a : b);
  }

  /// 按分類統計數量
  static Map<RecipeCategory, int> getCountByCategory(List<Recipe> recipes) {
    final Map<RecipeCategory, int> result = {};
    for (final recipe in recipes) {
      result[recipe.category] = (result[recipe.category] ?? 0) + 1;
    }
    return result;
  }

  /// 按難度統計數量
  static Map<Difficulty, int> getCountByDifficulty(List<Recipe> recipes) {
    final Map<Difficulty, int> result = {};
    for (final recipe in recipes) {
      result[recipe.difficulty] = (result[recipe.difficulty] ?? 0) + 1;
    }
    return result;
  }

  /// 計算平均烹飪時間
  static int getAverageCookTime(List<Recipe> recipes) {
    if (recipes.isEmpty) return 0;
    final totalTime = recipes.fold(
      0,
      (sum, r) => sum + r.prepTime + r.cookTime,
    );
    return totalTime ~/ recipes.length;
  }
}

/// 範例 4: 格式化工具
class RecipeFormatHelper {
  /// 格式化時間
  static String formatTime(int minutes) {
    if (minutes < 60) {
      return '$minutes 分鐘';
    }
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (mins == 0) {
      return '$hours 小時';
    }
    return '$hours 小時 $mins 分鐘';
  }

  /// 格式化難度
  static String formatDifficulty(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return '簡單 ⭐';
      case Difficulty.medium:
        return '中等 ⭐⭐';
      case Difficulty.hard:
        return '困難 ⭐⭐⭐';
    }
  }

  /// 格式化評分
  static String formatRating(double rating) {
    return '${rating.toStringAsFixed(1)} ⭐';
  }

  /// 格式化份量
  static String formatServings(int servings) {
    return '$servings 人份';
  }
}

/// 主函數 - 執行所有範例
void main() {
  print('🍳 Recipe App 使用範例\n');
  print('=' * 60);

  // 範例 1: 載入食譜
  final recipes = RecipeTestData.getAllRecipes();
  print('📚 食譜庫 (${recipes.length} 道食譜)\n');

  // 範例 2: 顯示食譜列表
  print('=' * 60);
  print('所有食譜');
  print('=' * 60);

  recipes.asMap().forEach((index, recipe) {
    final fav = recipe.isFavorite ? '❤️' : '  ';
    print('${index + 1}. $fav ${recipe.name}');
    print('   ${recipe.category.name} | ${RecipeFormatHelper.formatDifficulty(recipe.difficulty)}');
    print('   時間: ${RecipeFormatHelper.formatTime(recipe.prepTime + recipe.cookTime)}');
    print('   評分: ${RecipeFormatHelper.formatRating(recipe.rating)} (${recipe.reviews} 評論)');
    print('');
  });

  // 範例 3: 統計分析
  print('=' * 60);
  print('統計分析');
  print('=' * 60);

  final avgRating = RecipeStatistics.getAverageRating(recipes);
  final totalReviews = RecipeStatistics.getTotalReviews(recipes);
  final avgCookTime = RecipeStatistics.getAverageCookTime(recipes);
  final mostPopular = RecipeStatistics.getMostPopular(recipes);
  final highestRated = RecipeStatistics.getHighestRated(recipes);

  print('平均評分: ${RecipeFormatHelper.formatRating(avgRating)}');
  print('總評論數: $totalReviews');
  print('平均烹飪時間: ${RecipeFormatHelper.formatTime(avgCookTime)}');
  print('最受歡迎: ${mostPopular?.name} (${mostPopular?.reviews} 評論)');
  print('評分最高: ${highestRated?.name} (${RecipeFormatHelper.formatRating(highestRated!.rating)})');

  // 範例 4: 分類統計
  print('\n' + '=' * 60);
  print('分類統計');
  print('=' * 60);

  final categoryCount = RecipeStatistics.getCountByCategory(recipes);
  categoryCount.forEach((category, count) {
    final percentage = (count / recipes.length * 100).toStringAsFixed(1);
    print('${category.name}: $count 道 ($percentage%)');
  });

  // 範例 5: 搜尋功能
  print('\n' + '=' * 60);
  print('搜尋功能示範');
  print('=' * 60);

  // 搜尋"義"
  final italianRecipes = RecipeSearchHelper.searchByName(recipes, '義');
  print('\n搜尋 "義" 的結果 (${italianRecipes.length} 道):');
  italianRecipes.forEach((r) => print('  • ${r.name}'));

  // 簡單食譜
  final easyRecipes = RecipeSearchHelper.filterByDifficulty(
    recipes,
    Difficulty.easy,
  );
  print('\n簡單食譜 (${easyRecipes.length} 道):');
  easyRecipes.forEach((r) => print('  • ${r.name}'));

  // 30分鐘內完成
  final quickRecipes = RecipeSearchHelper.filterByTime(recipes, 30);
  print('\n30分鐘內完成 (${quickRecipes.length} 道):');
  quickRecipes.forEach((r) {
    final totalTime = r.prepTime + r.cookTime;
    print('  • ${r.name} (${totalTime}分鐘)');
  });

  // 高評分食譜
  final topRated = RecipeSearchHelper.filterByRating(recipes, 4.5);
  print('\n高評分食譜 (4.5⭐以上, ${topRated.length} 道):');
  topRated.forEach((r) {
    print('  • ${r.name} (${RecipeFormatHelper.formatRating(r.rating)})');
  });

  // 收藏的食譜
  final favorites = RecipeSearchHelper.getFavorites(recipes);
  print('\n我的收藏 (${favorites.length} 道):');
  favorites.forEach((r) => print('  ❤️ ${r.name}'));

  print('\n✨ 所有範例執行完成!');
  print('''

💡 如何在您的應用中使用:

1. 在 Provider 中使用測試數據:
```dart
final testRecipes = RecipeTestData.getAllRecipes();
await provider.addRecipes(testRecipes);
```

2. 實現搜尋功能:
```dart
final results = RecipeSearchHelper.searchByName(recipes, searchQuery);
```

3. 顯示統計信息:
```dart
final avgRating = RecipeStatistics.getAverageRating(recipes);
Text('平均評分: \${RecipeFormatHelper.formatRating(avgRating)}');
```

4. 篩選和分類:
```dart
final italianRecipes = RecipeSearchHelper.filterByCategory(
  recipes,
  RecipeCategory.italian,
);
```
  ''');
}
