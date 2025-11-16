import 'package:hive/hive.dart';

part 'recipe.g.dart';

@HiveType(typeId: 0)
class Recipe extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String imageUrl;

  @HiveField(4)
  final int prepTime; // 準備時間（分鐘）

  @HiveField(5)
  final int cookTime; // 烹飪時間（分鐘）

  @HiveField(6)
  final int servings; // 份量

  @HiveField(7)
  final String difficulty; // 'easy', 'medium', 'hard'

  @HiveField(8)
  final List<String> ingredients;

  @HiveField(9)
  final List<String> steps;

  @HiveField(10)
  final String category;

  @HiveField(11)
  final List<String> tags;

  @HiveField(12)
  final int? calories;

  @HiveField(13)
  bool isFavorite;

  Recipe({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.prepTime,
    required this.cookTime,
    required this.servings,
    required this.difficulty,
    required this.ingredients,
    required this.steps,
    required this.category,
    this.tags = const [],
    this.calories,
    this.isFavorite = false,
  });

  int get totalTime => prepTime + cookTime;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'imageUrl': imageUrl,
        'prepTime': prepTime,
        'cookTime': cookTime,
        'servings': servings,
        'difficulty': difficulty,
        'ingredients': ingredients,
        'steps': steps,
        'category': category,
        'tags': tags,
        'calories': calories,
        'isFavorite': isFavorite,
      };

  factory Recipe.fromJson(Map<String, dynamic> json) => Recipe(
        id: json['id'],
        title: json['title'],
        description: json['description'],
        imageUrl: json['imageUrl'],
        prepTime: json['prepTime'],
        cookTime: json['cookTime'],
        servings: json['servings'],
        difficulty: json['difficulty'],
        ingredients: List<String>.from(json['ingredients']),
        steps: List<String>.from(json['steps']),
        category: json['category'],
        tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
        calories: json['calories'],
        isFavorite: json['isFavorite'] ?? false,
      );
}
