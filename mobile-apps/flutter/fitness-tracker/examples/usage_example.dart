import 'package:flutter/material.dart';
import '../models/workout.dart';
import '../models/exercise.dart';
import '../models/goal.dart';

/// Fitness Tracker App 使用範例
///
/// 這個範例展示如何:
/// 1. 創建和記錄訓練
/// 2. 管理運動項目
/// 3. 設定健身目標
/// 4. 追蹤進度
/// 5. 統計分析

/// 範例 1: 訓練記錄測試數據
class WorkoutTestData {
  /// 創建力量訓練範例
  static Workout createStrengthWorkout() {
    return Workout(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: '上半身力量訓練',
      type: WorkoutType.strength,
      date: DateTime.now(),
      duration: 60, // 60分鐘
      caloriesBurned: 350,
      exercises: [
        Exercise(
          id: '1',
          name: '槓鈴臥推',
          sets: 4,
          reps: 10,
          weight: 60.0,
          restTime: 90,
        ),
        Exercise(
          id: '2',
          name: '啞鈴飛鳥',
          sets: 3,
          reps: 12,
          weight: 15.0,
          restTime: 60,
        ),
        Exercise(
          id: '3',
          name: '肩推',
          sets: 3,
          reps: 10,
          weight: 40.0,
          restTime: 90,
        ),
        Exercise(
          id: '4',
          name: '引體向上',
          sets: 3,
          reps: 8,
          weight: 0.0,
          restTime: 90,
        ),
      ],
      notes: '狀態良好,力量有進步',
    );
  }

  /// 創建有氧訓練範例
  static Workout createCardioWorkout() {
    return Workout(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: '跑步訓練',
      type: WorkoutType.cardio,
      date: DateTime.now(),
      duration: 45,
      caloriesBurned: 420,
      distance: 7.5, // 公里
      exercises: [],
      notes: '早晨慢跑,天氣很好',
    );
  }

  /// 創建瑜伽訓練範例
  static Workout createYogaWorkout() {
    return Workout(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: '瑜伽伸展',
      type: WorkoutType.yoga,
      date: DateTime.now(),
      duration: 30,
      caloriesBurned: 120,
      exercises: [],
      notes: '放鬆身心,改善柔軟度',
    );
  }

  /// 獲取一週訓練計劃
  static List<Workout> getWeeklyWorkouts() {
    final now = DateTime.now();
    return [
      // 週一 - 上半身
      Workout(
        id: '1',
        name: '上半身力量',
        type: WorkoutType.strength,
        date: now.subtract(const Duration(days: 6)),
        duration: 60,
        caloriesBurned: 350,
        exercises: [
          Exercise(id: '1', name: '臥推', sets: 4, reps: 10, weight: 60.0),
          Exercise(id: '2', name: '划船', sets: 4, reps: 10, weight: 50.0),
          Exercise(id: '3', name: '肩推', sets: 3, reps: 12, weight: 40.0),
        ],
      ),

      // 週二 - 有氧
      Workout(
        id: '2',
        name: '跑步',
        type: WorkoutType.cardio,
        date: now.subtract(const Duration(days: 5)),
        duration: 40,
        caloriesBurned: 400,
        distance: 6.5,
        exercises: [],
      ),

      // 週三 - 下半身
      Workout(
        id: '3',
        name: '下半身力量',
        type: WorkoutType.strength,
        date: now.subtract(const Duration(days: 4)),
        duration: 55,
        caloriesBurned: 380,
        exercises: [
          Exercise(id: '4', name: '深蹲', sets: 4, reps: 10, weight: 80.0),
          Exercise(id: '5', name: '硬舉', sets: 3, reps: 8, weight: 100.0),
          Exercise(id: '6', name: '腿推', sets: 3, reps: 12, weight: 120.0),
        ],
      ),

      // 週四 - 休息/瑜伽
      Workout(
        id: '4',
        name: '瑜伽',
        type: WorkoutType.yoga,
        date: now.subtract(const Duration(days: 3)),
        duration: 30,
        caloriesBurned: 120,
        exercises: [],
      ),

      // 週五 - 全身
      Workout(
        id: '5',
        name: '全身訓練',
        type: WorkoutType.strength,
        date: now.subtract(const Duration(days: 2)),
        duration: 65,
        caloriesBurned: 400,
        exercises: [
          Exercise(id: '7', name: '臥推', sets: 3, reps: 10, weight: 60.0),
          Exercise(id: '8', name: '深蹲', sets: 3, reps: 10, weight: 80.0),
          Exercise(id: '9', name: '硬舉', sets: 3, reps: 8, weight: 100.0),
          Exercise(id: '10', name: '引體向上', sets: 3, reps: 8, weight: 0.0),
        ],
      ),

      // 週六 - 有氧
      Workout(
        id: '6',
        name: '騎車',
        type: WorkoutType.cardio,
        date: now.subtract(const Duration(days: 1)),
        duration: 60,
        caloriesBurned: 500,
        distance: 20.0,
        exercises: [],
      ),

      // 週日 - 休息
    ];
  }
}

/// 範例 2: 運動項目資料庫
class ExerciseLibrary {
  /// 胸部運動
  static List<Exercise> getChestExercises() {
    return [
      Exercise(id: '1', name: '槓鈴臥推', sets: 4, reps: 10, weight: 60.0),
      Exercise(id: '2', name: '啞鈴臥推', sets: 4, reps: 10, weight: 25.0),
      Exercise(id: '3', name: '啞鈴飛鳥', sets: 3, reps: 12, weight: 15.0),
      Exercise(id: '4', name: '伏地挺身', sets: 3, reps: 15, weight: 0.0),
    ];
  }

  /// 背部運動
  static List<Exercise> getBackExercises() {
    return [
      Exercise(id: '5', name: '引體向上', sets: 3, reps: 8, weight: 0.0),
      Exercise(id: '6', name: '槓鈴划船', sets: 4, reps: 10, weight: 50.0),
      Exercise(id: '7', name: '啞鈴划船', sets: 4, reps: 10, weight: 30.0),
      Exercise(id: '8', name: '滑輪下拉', sets: 3, reps: 12, weight: 40.0),
    ];
  }

  /// 腿部運動
  static List<Exercise> getLegExercises() {
    return [
      Exercise(id: '9', name: '槓鈴深蹲', sets: 4, reps: 10, weight: 80.0),
      Exercise(id: '10', name: '硬舉', sets: 3, reps: 8, weight: 100.0),
      Exercise(id: '11', name: '腿推', sets: 3, reps: 12, weight: 120.0),
      Exercise(id: '12', name: '腿彎舉', sets: 3, reps: 12, weight: 40.0),
    ];
  }

  /// 所有運動
  static List<Exercise> getAllExercises() {
    return [
      ...getChestExercises(),
      ...getBackExercises(),
      ...getLegExercises(),
    ];
  }
}

/// 範例 3: 健身目標管理
class GoalExamples {
  /// 創建減重目標
  static Goal createWeightLossGoal() {
    return Goal(
      id: '1',
      name: '減重目標',
      type: GoalType.weightLoss,
      targetValue: 75.0,
      currentValue: 82.0,
      unit: 'kg',
      deadline: DateTime.now().add(const Duration(days: 90)),
      description: '3個月減重7公斤',
    );
  }

  /// 創建增肌目標
  static Goal createMuscleGainGoal() {
    return Goal(
      id: '2',
      name: '增肌目標',
      type: GoalType.muscleGain,
      targetValue: 80.0,
      currentValue: 75.0,
      unit: 'kg',
      deadline: DateTime.now().add(const Duration(days: 120)),
      description: '4個月增重5公斤純肌肉',
    );
  }

  /// 創建訓練頻率目標
  static Goal createWorkoutFrequencyGoal() {
    return Goal(
      id: '3',
      name: '每週訓練次數',
      type: GoalType.frequency,
      targetValue: 5.0,
      currentValue: 3.0,
      unit: '次/週',
      deadline: DateTime.now().add(const Duration(days: 30)),
      description: '每週至少運動5次',
    );
  }

  /// 創建跑步距離目標
  static Goal createRunningDistanceGoal() {
    return Goal(
      id: '4',
      name: '月跑量目標',
      type: GoalType.distance,
      targetValue: 100.0,
      currentValue: 45.0,
      unit: '公里',
      deadline: DateTime.now().add(const Duration(days: 30)),
      description: '本月累計跑步100公里',
    );
  }
}

/// 範例 4: 訓練統計分析
class WorkoutStatistics {
  /// 計算總訓練時間
  static int calculateTotalDuration(List<Workout> workouts) {
    return workouts.fold(0, (sum, w) => sum + w.duration);
  }

  /// 計算總消耗卡路里
  static int calculateTotalCalories(List<Workout> workouts) {
    return workouts.fold(0, (sum, w) => sum + w.caloriesBurned);
  }

  /// 計算總距離
  static double calculateTotalDistance(List<Workout> workouts) {
    return workouts.fold(0.0, (sum, w) => sum + (w.distance ?? 0.0));
  }

  /// 按訓練類型統計
  static Map<WorkoutType, int> getWorkoutsByType(List<Workout> workouts) {
    final Map<WorkoutType, int> result = {};
    for (final workout in workouts) {
      result[workout.type] = (result[workout.type] ?? 0) + 1;
    }
    return result;
  }

  /// 計算平均訓練時間
  static double getAverageDuration(List<Workout> workouts) {
    if (workouts.isEmpty) return 0.0;
    return calculateTotalDuration(workouts) / workouts.length;
  }

  /// 計算訓練頻率 (每週)
  static double getWeeklyFrequency(List<Workout> workouts) {
    if (workouts.isEmpty) return 0.0;

    final firstDate = workouts.map((w) => w.date).reduce(
      (a, b) => a.isBefore(b) ? a : b,
    );
    final lastDate = workouts.map((w) => w.date).reduce(
      (a, b) => a.isAfter(b) ? a : b,
    );

    final weeks = lastDate.difference(firstDate).inDays / 7;
    return weeks > 0 ? workouts.length / weeks : workouts.length.toDouble();
  }

  /// 獲取最強訓練日
  static Workout? getMostIntenseWorkout(List<Workout> workouts) {
    if (workouts.isEmpty) return null;
    return workouts.reduce(
      (a, b) => a.caloriesBurned > b.caloriesBurned ? a : b,
    );
  }

  /// 計算目標進度百分比
  static double calculateGoalProgress(Goal goal) {
    if (goal.targetValue == 0) return 0.0;

    double progress;
    if (goal.type == GoalType.weightLoss) {
      // 減重目標: 當前值越接近目標值越好
      final totalChange = (goal.currentValue - goal.targetValue).abs();
      final achieved = (goal.currentValue - goal.targetValue).abs();
      progress = (achieved / totalChange) * 100;
    } else {
      // 其他目標: 當前值/目標值
      progress = (goal.currentValue / goal.targetValue) * 100;
    }

    return progress.clamp(0.0, 100.0);
  }
}

/// 範例 5: 格式化工具
class FitnessFormatHelper {
  /// 格式化時間 (分鐘)
  static String formatDuration(int minutes) {
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return '${hours}小時${mins}分鐘';
    }
    return '$mins分鐘';
  }

  /// 格式化距離
  static String formatDistance(double km) {
    return '${km.toStringAsFixed(1)} 公里';
  }

  /// 格式化卡路里
  static String formatCalories(int calories) {
    return '$calories 卡';
  }

  /// 格式化日期
  static String formatDate(DateTime date) {
    return '${date.year}/${date.month.toString().padLeft(2, '0')}/'
           '${date.day.toString().padLeft(2, '0')}';
  }

  /// 格式化重量
  static String formatWeight(double weight) {
    return '${weight.toStringAsFixed(1)} kg';
  }
}

/// 主函數 - 執行所有範例
void main() {
  print('💪 Fitness Tracker App 使用範例\n');
  print('=' * 60);

  // 範例 1: 載入訓練記錄
  final workouts = WorkoutTestData.getWeeklyWorkouts();
  print('📊 本週訓練記錄 (${workouts.length} 次訓練)\n');

  workouts.asMap().forEach((index, workout) {
    print('${index + 1}. ${workout.name}');
    print('   類型: ${workout.type.name}');
    print('   時間: ${FitnessFormatHelper.formatDuration(workout.duration)}');
    print('   卡路里: ${FitnessFormatHelper.formatCalories(workout.caloriesBurned)}');
    if (workout.distance != null && workout.distance! > 0) {
      print('   距離: ${FitnessFormatHelper.formatDistance(workout.distance!)}');
    }
    if (workout.exercises.isNotEmpty) {
      print('   運動項目: ${workout.exercises.length} 個');
    }
    print('');
  });

  // 範例 2: 統計分析
  print('=' * 60);
  print('訓練統計分析');
  print('=' * 60);

  final totalDuration = WorkoutStatistics.calculateTotalDuration(workouts);
  final totalCalories = WorkoutStatistics.calculateTotalCalories(workouts);
  final totalDistance = WorkoutStatistics.calculateTotalDistance(workouts);
  final avgDuration = WorkoutStatistics.getAverageDuration(workouts);
  final weeklyFreq = WorkoutStatistics.getWeeklyFrequency(workouts);

  print('總訓練時間: ${FitnessFormatHelper.formatDuration(totalDuration)}');
  print('總消耗卡路里: ${FitnessFormatHelper.formatCalories(totalCalories)}');
  print('總跑步距離: ${FitnessFormatHelper.formatDistance(totalDistance)}');
  print('平均訓練時間: ${FitnessFormatHelper.formatDuration(avgDuration.toInt())}');
  print('每週訓練頻率: ${weeklyFreq.toStringAsFixed(1)} 次');

  // 範例 3: 訓練類型分布
  print('\n' + '=' * 60);
  print('訓練類型分布');
  print('=' * 60);

  final workoutsByType = WorkoutStatistics.getWorkoutsByType(workouts);
  workoutsByType.forEach((type, count) {
    final percentage = (count / workouts.length * 100).toStringAsFixed(1);
    print('${type.name}: $count 次 ($percentage%)');
  });

  // 範例 4: 最強訓練
  print('\n' + '=' * 60);
  print('最高強度訓練');
  print('=' * 60);

  final mostIntense = WorkoutStatistics.getMostIntenseWorkout(workouts);
  if (mostIntense != null) {
    print('🔥 ${mostIntense.name}');
    print('   消耗: ${FitnessFormatHelper.formatCalories(mostIntense.caloriesBurned)}');
    print('   時長: ${FitnessFormatHelper.formatDuration(mostIntense.duration)}');
    print('   日期: ${FitnessFormatHelper.formatDate(mostIntense.date)}');
  }

  // 範例 5: 健身目標
  print('\n' + '=' * 60);
  print('健身目標追蹤');
  print('=' * 60);

  final goals = [
    GoalExamples.createWeightLossGoal(),
    GoalExamples.createRunningDistanceGoal(),
    GoalExamples.createWorkoutFrequencyGoal(),
  ];

  for (final goal in goals) {
    final progress = WorkoutStatistics.calculateGoalProgress(goal);
    final progressBar = '█' * (progress / 5).toInt() +
                        '░' * (20 - (progress / 5).toInt());

    print('\n${goal.name}');
    print('目標: ${goal.targetValue} ${goal.unit}');
    print('當前: ${goal.currentValue} ${goal.unit}');
    print('進度: $progressBar ${progress.toStringAsFixed(1)}%');
    print('截止: ${FitnessFormatHelper.formatDate(goal.deadline)}');
  }

  // 範例 6: 運動項目庫
  print('\n' + '=' * 60);
  print('推薦運動項目');
  print('=' * 60);

  print('\n胸部訓練:');
  ExerciseLibrary.getChestExercises().forEach((ex) {
    print('  • ${ex.name}: ${ex.sets}組 x ${ex.reps}次 '
          '@ ${FitnessFormatHelper.formatWeight(ex.weight)}');
  });

  print('\n背部訓練:');
  ExerciseLibrary.getBackExercises().take(3).forEach((ex) {
    print('  • ${ex.name}: ${ex.sets}組 x ${ex.reps}次 '
          '@ ${FitnessFormatHelper.formatWeight(ex.weight)}');
  });

  print('\n✨ 所有範例執行完成!');
  print('''

💡 如何在您的應用中使用:

1. 在 Provider 中使用測試數據:
```dart
final testWorkouts = WorkoutTestData.getWeeklyWorkouts();
await provider.addWorkouts(testWorkouts);
```

2. 顯示統計數據:
```dart
final totalCalories = WorkoutStatistics.calculateTotalCalories(workouts);
Text('總消耗: \${FitnessFormatHelper.formatCalories(totalCalories)}');
```

3. 追蹤目標進度:
```dart
final progress = WorkoutStatistics.calculateGoalProgress(goal);
LinearProgressIndicator(value: progress / 100);
```

4. 使用運動項目庫:
```dart
final exercises = ExerciseLibrary.getChestExercises();
// 顯示在訓練計劃中
```
  ''');
}
