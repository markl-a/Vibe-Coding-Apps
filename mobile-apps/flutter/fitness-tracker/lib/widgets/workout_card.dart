import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/workout.dart';
import '../models/exercise.dart';

class WorkoutCard extends StatelessWidget {
  final Workout workout;
  final VoidCallback? onDelete;

  const WorkoutCard({
    super.key,
    required this.workout,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final exerciseType =
        exerciseTypes.firstWhere((e) => e.name == workout.exerciseType);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // 顯示詳情
          _showDetails(context);
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // 圖標
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  exerciseType.icon,
                  color: Theme.of(context).colorScheme.primary,
                  size: 28,
                ),
              ),

              const SizedBox(width: 16),

              // 運動資訊
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workout.exerciseType,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('yyyy/MM/dd HH:mm').format(workout.date),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildTag(
                          context,
                          Icons.timer,
                          '${workout.duration} 分鐘',
                        ),
                        if (workout.distance != null) ...[
                          const SizedBox(width: 8),
                          _buildTag(
                            context,
                            Icons.straighten,
                            '${workout.distance!.toStringAsFixed(1)} km',
                          ),
                        ],
                        const SizedBox(width: 8),
                        _buildTag(
                          context,
                          Icons.local_fire_department,
                          '${workout.calories.toStringAsFixed(0)} kcal',
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 刪除按鈕
              IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () {
                  _showDeleteDialog(context);
                },
                color: Colors.red[300],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(BuildContext context, IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }

  void _showDetails(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(workout.exerciseType),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('日期', DateFormat('yyyy/MM/dd HH:mm').format(workout.date)),
            _buildDetailRow('時長', '${workout.duration} 分鐘'),
            if (workout.distance != null)
              _buildDetailRow('距離', '${workout.distance!.toStringAsFixed(1)} 公里'),
            _buildDetailRow('卡路里', '${workout.calories.toStringAsFixed(0)} kcal'),
            if (workout.notes != null) ...[
              const SizedBox(height: 8),
              const Text('備註：', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(workout.notes!),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('關閉'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$label:',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(value),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('確認刪除'),
        content: const Text('確定要刪除這筆運動記錄嗎？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              onDelete?.call();
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('刪除'),
          ),
        ],
      ),
    );
  }
}
