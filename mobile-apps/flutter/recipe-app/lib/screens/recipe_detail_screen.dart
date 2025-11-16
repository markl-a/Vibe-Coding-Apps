import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/recipe.dart';
import '../providers/recipe_provider.dart';

class RecipeDetailScreen extends StatelessWidget {
  final Recipe recipe;

  const RecipeDetailScreen({super.key, required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // 圖片和標題
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                recipe.title,
                style: const TextStyle(
                  shadows: [
                    Shadow(
                      blurRadius: 4.0,
                      color: Colors.black45,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
              ),
              background: Hero(
                tag: 'recipe_${recipe.id}',
                child: CachedNetworkImage(
                  imageUrl: recipe.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.grey[300],
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.error, size: 50),
                  ),
                ),
              ),
            ),
            actions: [
              Consumer<RecipeProvider>(
                builder: (context, provider, child) {
                  final isFavorite = provider.recipes
                      .firstWhere((r) => r.id == recipe.id)
                      .isFavorite;

                  return IconButton(
                    icon: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.red : Colors.white,
                    ),
                    onPressed: () {
                      provider.toggleFavorite(recipe.id);
                    },
                  );
                },
              ),
            ],
          ),

          // 詳細資訊
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 描述
                  Text(
                    recipe.description,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 16),

                  // 資訊卡片
                  Row(
                    children: [
                      _buildInfoCard(
                        context,
                        Icons.timer,
                        '${recipe.totalTime}分鐘',
                        '總時長',
                      ),
                      const SizedBox(width: 12),
                      _buildInfoCard(
                        context,
                        Icons.people,
                        '${recipe.servings}人份',
                        '份量',
                      ),
                      const SizedBox(width: 12),
                      _buildInfoCard(
                        context,
                        Icons.local_fire_department,
                        '${recipe.calories ?? '?'} kcal',
                        '卡路里',
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // 食材
                  Text(
                    '食材',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...recipe.ingredients.map((ingredient) => Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.green, size: 20),
                            const SizedBox(width: 8),
                            Text(ingredient),
                          ],
                        ),
                      )),

                  const SizedBox(height: 24),

                  // 步驟
                  Text(
                    '烹飪步驟',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...recipe.steps.asMap().entries.map((entry) {
                    final index = entry.key;
                    final step = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              step,
                              style: const TextStyle(fontSize: 16),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context,
    IconData icon,
    String value,
    String label,
  ) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
