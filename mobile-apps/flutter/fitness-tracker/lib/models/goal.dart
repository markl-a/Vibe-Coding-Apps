import 'package:hive/hive.dart';

part 'goal.g.dart';

@HiveType(typeId: 1)
class Goal extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final int targetMinutes; // 目標分鐘數

  @HiveField(3)
  final String period; // 'daily' or 'weekly'

  @HiveField(4)
  final DateTime createdAt;

  @HiveField(5)
  bool isActive;

  Goal({
    required this.id,
    required this.title,
    required this.targetMinutes,
    required this.period,
    required this.createdAt,
    this.isActive = true,
  });
}
