import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/workout_provider.dart';
import '../widgets/workout_card.dart';
import '../widgets/stats_card.dart';
import 'add_workout_screen.dart';
import 'statistics_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('健身追蹤'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // 設定頁面
            },
          ),
        ],
      ),
      body: _selectedIndex == 0 ? _buildHomeTab() : const StatisticsScreen(),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AddWorkoutScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('新增運動'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '首頁',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: '統計',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return Consumer<WorkoutProvider>(
      builder: (context, provider, child) {
        return CustomScrollView(
          slivers: [
            // 統計概覽
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '今日概覽',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: StatsCard(
                            title: '今日卡路里',
                            value: provider.getTotalCaloriesToday().toStringAsFixed(0),
                            unit: 'kcal',
                            icon: Icons.local_fire_department,
                            color: Colors.orange,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatsCard(
                            title: '本週運動',
                            value: provider.getTotalMinutesThisWeek().toString(),
                            unit: '分鐘',
                            icon: Icons.timer,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: StatsCard(
                            title: '總次數',
                            value: provider.getTotalWorkouts().toString(),
                            unit: '次',
                            icon: Icons.fitness_center,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: StatsCard(
                            title: '連續天數',
                            value: '5',
                            unit: '天',
                            icon: Icons.whatshot,
                            color: Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // 運動記錄列表
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Text(
                  '最近記錄',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ),

            provider.workouts.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.fitness_center,
                            size: 80,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '還沒有運動記錄',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '點擊下方按鈕開始記錄',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final workout = provider.workouts[index];
                          return WorkoutCard(
                            workout: workout,
                            onDelete: () {
                              provider.deleteWorkout(workout.id);
                            },
                          );
                        },
                        childCount: provider.workouts.length,
                      ),
                    ),
                  ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        );
      },
    );
  }
}
