import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../providers/transaction_provider.dart';
import '../models/category.dart';

class StatisticsScreen extends StatelessWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<TransactionProvider>(
      builder: (context, provider, child) {
        final now = DateTime.now();
        final startOfMonth = DateTime(now.year, now.month, 1);
        final endOfMonth = DateTime(now.year, now.month + 1, 0);

        final expenseByCategory = provider.getExpenseByCategory(
          start: startOfMonth,
          end: endOfMonth,
        );

        return ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            if (expenseByCategory.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '本月支出分佈',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 200,
                        child: PieChart(
                          PieChartData(
                            sections: expenseByCategory.entries.map((entry) {
                              final category = defaultCategories.firstWhere(
                                (c) => c.id == entry.key,
                              );

                              return PieChartSectionData(
                                value: entry.value,
                                title: '\n${NumberFormat.compact().format(entry.value)}',
                                color: category.color,
                                radius: 80,
                                titleStyle: const TextStyle(
                                  fontSize: 14,
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
                      const SizedBox(height: 16),
                      ...expenseByCategory.entries.map((entry) {
                        final category = defaultCategories.firstWhere(
                          (c) => c.id == entry.key,
                        );
                        final total = expenseByCategory.values.fold(0.0, (a, b) => a + b);
                        final percentage = (entry.value / total * 100).toStringAsFixed(1);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            children: [
                              Icon(category.icon, color: category.color, size: 20),
                              const SizedBox(width: 8),
                              Expanded(child: Text(category.name)),
                              Text(
                                '${NumberFormat.currency(symbol: '\$').format(entry.value)} ($percentage%)',
                                style: TextStyle(color: Colors.grey[600]),
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
                        Icon(Icons.pie_chart, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text(
                          '本月還沒有支出記錄',
                          style: TextStyle(fontSize: 16, color: Colors.grey[600]),
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
