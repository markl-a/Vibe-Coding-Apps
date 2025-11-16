import 'package:flutter/material.dart';

class RecipeCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color color;

  const RecipeCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

// 預定義分類
const List<RecipeCategory> recipeCategories = [
  RecipeCategory(
    id: 'chinese',
    name: '中式料理',
    icon: Icons.ramen_dining,
    color: Colors.red,
  ),
  RecipeCategory(
    id: 'western',
    name: '西式料理',
    icon: Icons.restaurant,
    color: Colors.blue,
  ),
  RecipeCategory(
    id: 'japanese',
    name: '日式料理',
    icon: Icons.set_meal,
    color: Colors.pink,
  ),
  RecipeCategory(
    id: 'dessert',
    name: '甜點烘焙',
    icon: Icons.cake,
    color: Colors.purple,
  ),
  RecipeCategory(
    id: 'healthy',
    name: '健康輕食',
    icon: Icons.eco,
    color: Colors.green,
  ),
  RecipeCategory(
    id: 'soup',
    name: '湯品燉煮',
    icon: Icons.soup_kitchen,
    color: Colors.orange,
  ),
  RecipeCategory(
    id: 'drink',
    name: '飲品調酒',
    icon: Icons.local_bar,
    color: Colors.teal,
  ),
  RecipeCategory(
    id: 'other',
    name: '異國料理',
    icon: Icons.public,
    color: Colors.indigo,
  ),
];
