import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/recipe.dart';
import '../utils/constants.dart';

class RecipeProvider extends ChangeNotifier {
  late Box<Recipe> _recipeBox;
  List<Recipe> _recipes = [];
  List<Recipe> _favorites = [];

  List<Recipe> get recipes => _recipes;
  List<Recipe> get favorites => _favorites;

  Future<void> initialize() async {
    await Hive.initFlutter();

    // 註冊適配器（需要先運行 build_runner）
    // Hive.registerAdapter(RecipeAdapter());

    _recipeBox = await Hive.openBox<Recipe>('recipes');

    await _loadData();
  }

  Future<void> _loadData() async {
    // 如果資料庫為空，載入範例資料
    if (_recipeBox.isEmpty) {
      await _loadSampleRecipes();
    }

    _recipes = _recipeBox.values.toList();
    _favorites = _recipes.where((r) => r.isFavorite).toList();
    notifyListeners();
  }

  Future<void> _loadSampleRecipes() async {
    for (var recipeData in sampleRecipes) {
      final recipe = Recipe.fromJson(recipeData);
      await _recipeBox.put(recipe.id, recipe);
    }
  }

  // 切換收藏狀態
  Future<void> toggleFavorite(String recipeId) async {
    final recipe = _recipeBox.get(recipeId);
    if (recipe != null) {
      recipe.isFavorite = !recipe.isFavorite;
      await recipe.save();
      await _loadData();
    }
  }

  // 搜尋食譜
  List<Recipe> searchRecipes(String query) {
    if (query.isEmpty) return _recipes;

    final lowerQuery = query.toLowerCase();
    return _recipes.where((recipe) {
      return recipe.title.toLowerCase().contains(lowerQuery) ||
          recipe.description.toLowerCase().contains(lowerQuery) ||
          recipe.ingredients.any((i) => i.toLowerCase().contains(lowerQuery)) ||
          recipe.tags.any((t) => t.toLowerCase().contains(lowerQuery));
    }).toList();
  }

  // 依分類篩選
  List<Recipe> getRecipesByCategory(String category) {
    return _recipes.where((r) => r.category == category).toList();
  }

  // 依難度篩選
  List<Recipe> getRecipesByDifficulty(String difficulty) {
    return _recipes.where((r) => r.difficulty == difficulty).toList();
  }

  // 取得推薦食譜（簡易版：隨機返回幾個）
  List<Recipe> getRecommendedRecipes(int count) {
    final shuffled = List<Recipe>.from(_recipes)..shuffle();
    return shuffled.take(count).toList();
  }
}
