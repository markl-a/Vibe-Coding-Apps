import 'package:flutter/material.dart';

class ExerciseType {
  final String name;
  final IconData icon;
  final double caloriesPerMinute;
  final String category;

  const ExerciseType({
    required this.name,
    required this.icon,
    required this.caloriesPerMinute,
    required this.category,
  });
}

// 預定義的運動類型
const List<ExerciseType> exerciseTypes = [
  ExerciseType(
    name: '跑步',
    icon: Icons.directions_run,
    caloriesPerMinute: 10.0,
    category: '有氧運動',
  ),
  ExerciseType(
    name: '騎車',
    icon: Icons.directions_bike,
    caloriesPerMinute: 8.0,
    category: '有氧運動',
  ),
  ExerciseType(
    name: '游泳',
    icon: Icons.pool,
    caloriesPerMinute: 12.0,
    category: '有氧運動',
  ),
  ExerciseType(
    name: '重訓',
    icon: Icons.fitness_center,
    caloriesPerMinute: 6.0,
    category: '力量訓練',
  ),
  ExerciseType(
    name: '瑜伽',
    icon: Icons.self_improvement,
    caloriesPerMinute: 4.0,
    category: '伸展運動',
  ),
  ExerciseType(
    name: '步行',
    icon: Icons.directions_walk,
    caloriesPerMinute: 5.0,
    category: '有氧運動',
  ),
  ExerciseType(
    name: '爬山',
    icon: Icons.terrain,
    caloriesPerMinute: 9.0,
    category: '有氧運動',
  ),
  ExerciseType(
    name: '籃球',
    icon: Icons.sports_basketball,
    caloriesPerMinute: 8.5,
    category: '球類運動',
  ),
];
