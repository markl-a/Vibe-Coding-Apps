import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/recipe.dart';

class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onTap;

  const RecipeCard({
    super.key,
    required this.recipe,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 圖片
            Hero(
              tag: 'recipe_${recipe.id}',
              child: CachedNetworkImage(
                imageUrl: recipe.imageUrl,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  height: 200,
                  color: Colors.grey[300],
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) => Container(
                  height: 200,
                  color: Colors.grey[300],
                  child: const Icon(Icons.error, size: 50),
                ),
              ),
            ),

            // 資訊
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    recipe.description,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildTag(
                        Icons.timer,
                        '${recipe.totalTime}分鐘',
                        context,
                      ),
                      const SizedBox(width: 12),
                      _buildTag(
                        Icons.people,
                        '${recipe.servings}人份',
                        context,
                      ),
                      const SizedBox(width: 12),
                      _buildDifficultyTag(recipe.difficulty, context),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String text, BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildDifficultyTag(String difficulty, BuildContext context) {
    final Map<String, Map<String, dynamic>> difficultyMap = {
      'easy': {'text': '簡單', 'color': Colors.green},
      'medium': {'text': '中等', 'color': Colors.orange},
      'hard': {'text': '困難', 'color': Colors.red},
    };

    final data = difficultyMap[difficulty] ?? {'text': '未知', 'color': Colors.grey};

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (data['color'] as Color).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: data['color'] as Color),
      ),
      child: Text(
        data['text'] as String,
        style: TextStyle(
          fontSize: 12,
          color: data['color'] as Color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
