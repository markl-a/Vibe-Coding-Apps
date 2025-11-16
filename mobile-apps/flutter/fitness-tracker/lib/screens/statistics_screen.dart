import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/workout_provider.dart';

class StatisticsScreen extends StatelessWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<WorkoutProvider>(
      builder: (context, provider, child) {
        final distribution = provider.getExerciseTypeDistribution();

        return ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // 本週統計
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '本週運動時長',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          provider.getTotalMinutesThisWeek().toString(),
                          style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(width: 8),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Text(
                            '分鐘',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // 運動類型分佈
            if (distribution.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '運動類型分佈',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 200,
                        child: PieChart(
                          PieChartData(
                            sections: distribution.entries.map((entry) {
                              final colors = [
                                Colors.blue,
                                Colors.green,
                                Colors.orange,
                                Colors.purple,
                                Colors.red,
                                Colors.teal,
                                Colors.amber,
                                Colors.indigo,
                              ];
                              final index = distribution.keys.toList().indexOf(entry.key);

                              return PieChartSectionData(
                                value: entry.value.toDouble(),
                                title: '${entry.key}\n${entry.value}分',
                                color: colors[index % colors.length],
                                radius: 80,
                                titleStyle: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              );
                            }).toList(),
                            sectionsSpace: 2,
                            centerSpaceRadius: 0,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // 運動類型列表
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '運動時長統計',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 16),
                      ...distribution.entries.map((entry) {
                        final totalMinutes = distribution.values.fold(0, (a, b) => a + b);
                        final percentage = (entry.value / totalMinutes * 100).toStringAsFixed(1);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    entry.key,
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  Text(
                                    '${entry.value} 分鐘 ($percentage%)',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: entry.value / totalMinutes,
                                backgroundColor: Colors.grey[200],
                                minHeight: 8,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ] else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(40.0),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.bar_chart,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '還沒有統計數據',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
