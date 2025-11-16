import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/workout.dart';
import '../models/exercise.dart';
import '../providers/workout_provider.dart';

class AddWorkoutScreen extends StatefulWidget {
  const AddWorkoutScreen({super.key});

  @override
  State<AddWorkoutScreen> createState() => _AddWorkoutScreenState();
}

class _AddWorkoutScreenState extends State<AddWorkoutScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedExercise;
  int _duration = 30;
  double _distance = 0;
  String _notes = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('新增運動'),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            Text(
              '選擇運動類型',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),

            // 運動類型選擇
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.8,
              ),
              itemCount: exerciseTypes.length,
              itemBuilder: (context, index) {
                final exercise = exerciseTypes[index];
                final isSelected = _selectedExercise == exercise.name;

                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedExercise = exercise.name;
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primaryContainer
                          : Theme.of(context).colorScheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: isSelected
                          ? Border.all(
                              color: Theme.of(context).colorScheme.primary,
                              width: 2,
                            )
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          exercise.icon,
                          size: 32,
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : null,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          exercise.name,
                          style: TextStyle(
                            fontSize: 12,
                            color: isSelected
                                ? Theme.of(context).colorScheme.primary
                                : null,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 24),

            // 運動時長
            Text(
              '運動時長: $_duration 分鐘',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Slider(
              value: _duration.toDouble(),
              min: 5,
              max: 180,
              divisions: 35,
              label: '$_duration 分鐘',
              onChanged: (value) {
                setState(() {
                  _duration = value.toInt();
                });
              },
            ),

            const SizedBox(height: 16),

            // 距離（可選）
            TextFormField(
              decoration: const InputDecoration(
                labelText: '距離（公里）',
                hintText: '選填，如跑步或騎車',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.straighten),
              ),
              keyboardType: TextInputType.number,
              onChanged: (value) {
                _distance = double.tryParse(value) ?? 0;
              },
            ),

            const SizedBox(height: 16),

            // 備註
            TextFormField(
              decoration: const InputDecoration(
                labelText: '備註',
                hintText: '記錄你的感受或狀態',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.note),
              ),
              maxLines: 3,
              onChanged: (value) {
                _notes = value;
              },
            ),

            const SizedBox(height: 24),

            // 儲存按鈕
            FilledButton(
              onPressed: _selectedExercise == null ? null : _saveWorkout,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                '儲存運動記錄',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _saveWorkout() {
    if (_selectedExercise == null) return;

    final selectedType =
        exerciseTypes.firstWhere((e) => e.name == _selectedExercise);
    final calories = _duration * selectedType.caloriesPerMinute;

    final workout = Workout(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      exerciseType: _selectedExercise!,
      duration: _duration,
      distance: _distance > 0 ? _distance : null,
      calories: calories,
      date: DateTime.now(),
      notes: _notes.isNotEmpty ? _notes : null,
    );

    context.read<WorkoutProvider>().addWorkout(workout);

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('運動記錄已儲存！'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
