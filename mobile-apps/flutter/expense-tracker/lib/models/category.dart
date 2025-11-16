import 'package:flutter/material.dart';

enum CategoryType { expense, income }

class Category {
  final String id;
  final String name;
  final IconData icon;
  final Color color;
  final CategoryType type;

  const Category({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.type,
  });
}

// 預設類別
const List<Category> defaultCategories = [
  // 支出類別
  Category(
    id: 'food',
    name: '餐飲',
    icon: Icons.restaurant,
    color: Colors.orange,
    type: CategoryType.expense,
  ),
  Category(
    id: 'transport',
    name: '交通',
    icon: Icons.directions_car,
    color: Colors.blue,
    type: CategoryType.expense,
  ),
  Category(
    id: 'home',
    name: '居家',
    icon: Icons.home,
    color: Colors.green,
    type: CategoryType.expense,
  ),
  Category(
    id: 'entertainment',
    name: '娛樂',
    icon: Icons.movie,
    color: Colors.purple,
    type: CategoryType.expense,
  ),
  Category(
    id: 'shopping',
    name: '購物',
    icon: Icons.shopping_bag,
    color: Colors.pink,
    type: CategoryType.expense,
  ),
  Category(
    id: 'health',
    name: '醫療',
    icon: Icons.local_hospital,
    color: Colors.red,
    type: CategoryType.expense,
  ),
  Category(
    id: 'education',
    name: '教育',
    icon: Icons.school,
    color: Colors.indigo,
    type: CategoryType.expense,
  ),
  Category(
    id: 'travel',
    name: '旅遊',
    icon: Icons.flight,
    color: Colors.teal,
    type: CategoryType.expense,
  ),
  Category(
    id: 'other_expense',
    name: '其他支出',
    icon: Icons.more_horiz,
    color: Colors.grey,
    type: CategoryType.expense,
  ),

  // 收入類別
  Category(
    id: 'salary',
    name: '薪資',
    icon: Icons.account_balance_wallet,
    color: Colors.green,
    type: CategoryType.income,
  ),
  Category(
    id: 'investment',
    name: '投資',
    icon: Icons.trending_up,
    color: Colors.blue,
    type: CategoryType.income,
  ),
  Category(
    id: 'bonus',
    name: '獎金',
    icon: Icons.card_giftcard,
    color: Colors.amber,
    type: CategoryType.income,
  ),
  Category(
    id: 'other_income',
    name: '其他收入',
    icon: Icons.attach_money,
    color: Colors.lightGreen,
    type: CategoryType.income,
  ),
];
