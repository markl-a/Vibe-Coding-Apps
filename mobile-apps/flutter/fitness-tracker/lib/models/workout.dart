import 'package:hive/hive.dart';

part 'workout.g.dart';

@HiveType(typeId: 0)
class Workout extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String exerciseType;

  @HiveField(2)
  final int duration; // 分鐘

  @HiveField(3)
  final double? distance; // 公里

  @HiveField(4)
  final int? sets; // 組數

  @HiveField(5)
  final int? reps; // 次數

  @HiveField(6)
  final double calories;

  @HiveField(7)
  final DateTime date;

  @HiveField(8)
  final String? notes;

  Workout({
    required this.id,
    required this.exerciseType,
    required this.duration,
    this.distance,
    this.sets,
    this.reps,
    required this.calories,
    required this.date,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'exerciseType': exerciseType,
        'duration': duration,
        'distance': distance,
        'sets': sets,
        'reps': reps,
        'calories': calories,
        'date': date.toIso8601String(),
        'notes': notes,
      };

  factory Workout.fromJson(Map<String, dynamic> json) => Workout(
        id: json['id'],
        exerciseType: json['exerciseType'],
        duration: json['duration'],
        distance: json['distance'],
        sets: json['sets'],
        reps: json['reps'],
        calories: json['calories'],
        date: DateTime.parse(json['date']),
        notes: json['notes'],
      );
}
