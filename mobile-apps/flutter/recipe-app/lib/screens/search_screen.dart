import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recipe_provider.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: '搜尋食譜、食材...',
            border: InputBorder.none,
          ),
          onChanged: (value) {
            setState(() {
              _searchQuery = value;
            });
          },
        ),
      ),
      body: Consumer<RecipeProvider>(
        builder: (context, provider, child) {
          final results = provider.searchRecipes(_searchQuery);

          if (_searchQuery.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    '輸入關鍵字搜尋食譜',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          if (results.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search_off, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    '找不到相關食譜',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: results.length,
            itemBuilder: (context, index) {
              final recipe = results[index];
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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
