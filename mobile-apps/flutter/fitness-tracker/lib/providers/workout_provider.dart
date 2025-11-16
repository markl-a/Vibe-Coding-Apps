import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/workout.dart';
import '../models/goal.dart';

class WorkoutProvider extends ChangeNotifier {
  late Box<Workout> _workoutBox;
  late Box<Goal> _goalBox;
  List<Workout> _workouts = [];
  List<Goal> _goals = [];

  List<Workout> get workouts => _workouts;
  List<Goal> get goals => _goals;

  Future<void> initialize() async {
    await Hive.initFlutter();

    // 註冊適配器（需要先運行 build_runner）
    // Hive.registerAdapter(WorkoutAdapter());
    // Hive.registerAdapter(GoalAdapter());

    _workoutBox = await Hive.openBox<Workout>('workouts');
    _goalBox = await Hive.openBox<Goal>('goals');

    _loadData();
  }

  void _loadData() {
    _workouts = _workoutBox.values.toList();
    _workouts.sort((a, b) => b.date.compareTo(a.date));

    _goals = _goalBox.values.toList();
    notifyListeners();
  }

  // 運動記錄管理
  Future<void> addWorkout(Workout workout) async {
    await _workoutBox.put(workout.id, workout);
    _loadData();
  }

  Future<void> deleteWorkout(String id) async {
    await _workoutBox.delete(id);
    _loadData();
  }

  // 目標管理
  Future<void> addGoal(Goal goal) async {
    await _goalBox.put(goal.id, goal);
    _loadData();
  }

  Future<void> updateGoal(Goal goal) async {
    await _goalBox.put(goal.id, goal);
    _loadData();
  }

  Future<void> deleteGoal(String id) async {
    await _goalBox.delete(id);
    _loadData();
  }

  // 統計功能
  int getTotalWorkouts() => _workouts.length;

  int getTotalMinutesThisWeek() {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));

    return _workouts
        .where((w) => w.date.isAfter(weekStart))
        .fold(0, (sum, w) => sum + w.duration);
  }

  double getTotalCaloriesToday() {
    final today = DateTime.now();

    return _workouts
        .where((w) =>
          w.date.year == today.year &&
          w.date.month == today.month &&
          w.date.day == today.day)
        .fold(0.0, (sum, w) => sum + w.calories);
  }

  Map<String, int> getExerciseTypeDistribution() {
    final Map<String, int> distribution = {};

    for (var workout in _workouts) {
      distribution[workout.exerciseType] =
          (distribution[workout.exerciseType] ?? 0) + workout.duration;
    }

    return distribution;
  }

  List<Workout> getWorkoutsForDate(DateTime date) {
    return _workouts
        .where((w) =>
            w.date.year == date.year &&
            w.date.month == date.month &&
            w.date.day == date.day)
        .toList();
  }

  double getGoalProgress(Goal goal) {
    if (!goal.isActive) return 0.0;

    int completedMinutes = 0;
    final now = DateTime.now();

    if (goal.period == 'daily') {
      completedMinutes = _workouts
          .where((w) =>
              w.date.year == now.year &&
              w.date.month == now.month &&
              w.date.day == now.day)
          .fold(0, (sum, w) => sum + w.duration);
    } else if (goal.period == 'weekly') {
      final weekStart = now.subtract(Duration(days: now.weekday - 1));
      completedMinutes = _workouts
          .where((w) => w.date.isAfter(weekStart))
          .fold(0, (sum, w) => sum + w.duration);
    }

    return completedMinutes / goal.targetMinutes;
  }
}
