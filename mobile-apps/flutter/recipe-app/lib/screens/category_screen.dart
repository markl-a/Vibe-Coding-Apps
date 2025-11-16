import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/category.dart';
import '../providers/recipe_provider.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';

class CategoryScreen extends StatelessWidget {
  final RecipeCategory category;

  const CategoryScreen({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(category.name),
        backgroundColor: category.color,
      ),
      body: Consumer<RecipeProvider>(
        builder: (context, provider, child) {
          final recipes = provider.getRecipesByCategory(category.id);

          if (recipes.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(category.icon, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    '此分類暫無食譜',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: recipes.length,
            itemBuilder: (context, index) {
              final recipe = recipes[index];
              return RecipeCard(
                recipe: recipe,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => RecipeDetailScreen(recipe: recipe),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
