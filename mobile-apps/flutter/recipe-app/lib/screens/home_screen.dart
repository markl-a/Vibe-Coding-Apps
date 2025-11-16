import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recipe_provider.dart';
import '../widgets/recipe_card.dart';
import '../models/category.dart';
import 'search_screen.dart';
import 'favorites_screen.dart';
import 'category_screen.dart';
import 'recipe_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildHomeTab(),
      const FavoritesScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('食譜分享'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SearchScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: pages[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '首頁',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            selectedIcon: Icon(Icons.favorite),
            label: '收藏',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return Consumer<RecipeProvider>(
      builder: (context, provider, child) {
        final recommended = provider.getRecommendedRecipes(5);

        return CustomScrollView(
          slivers: [
            // 分類橫向滾動
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '料理分類',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: recipeCategories.length,
                        itemBuilder: (context, index) {
                          final category = recipeCategories[index];
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => CategoryScreen(
                                    category: category,
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              width: 80,
                              margin: const EdgeInsets.only(right: 12),
                              child: Column(
                                children: [
                                  Container(
                                    width: 70,
                                    height: 70,
                                    decoration: BoxDecoration(
                                      color: category.color.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Icon(
                                      category.icon,
                                      color: category.color,
                                      size: 32,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    category.name,
                                    style: const TextStyle(fontSize: 12),
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 推薦食譜
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Text(
                  '推薦食譜',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ),

            // 食譜列表
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final recipe = recommended[index];
                    return RecipeCard(
                      recipe: recipe,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RecipeDetailScreen(
                              recipe: recipe,
                            ),
                          ),
                        );
                      },
                    );
                  },
                  childCount: recommended.length,
                ),
              ),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 16),
            ),
          ],
        );
      },
    );
  }
}
