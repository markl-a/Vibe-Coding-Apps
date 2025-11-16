import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/transaction_provider.dart';
import '../widgets/transaction_card.dart';
import '../models/category.dart';
import 'add_transaction_screen.dart';
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
        title: const Text('記帳本'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () {
              // 日曆視圖
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
                    builder: (context) => const AddTransactionScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('新增交易'),
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
            icon: Icon(Icons.pie_chart_outline),
            selectedIcon: Icon(Icons.pie_chart),
            label: '統計',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return Consumer<TransactionProvider>(
      builder: (context, provider, child) {
        final now = DateTime.now();
        final startOfMonth = DateTime(now.year, now.month, 1);
        final endOfMonth = DateTime(now.year, now.month + 1, 0);

        final monthIncome = provider.getTotalIncome(
          start: startOfMonth,
          end: endOfMonth,
        );
        final monthExpense = provider.getTotalExpense(
          start: startOfMonth,
          end: endOfMonth,
        );
        final balance = monthIncome - monthExpense;

        return CustomScrollView(
          slivers: [
            // 收支概覽卡片
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.secondary,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      '本月餘額',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      NumberFormat.currency(symbol: 'NT\$ ').format(balance),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: _buildBalanceItem(
                            '收入',
                            monthIncome,
                            Icons.arrow_downward,
                            Colors.green[300]!,
                          ),
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        Expanded(
                          child: _buildBalanceItem(
                            '支出',
                            monthExpense,
                            Icons.arrow_upward,
                            Colors.red[300]!,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // 交易記錄列表標題
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '最近交易',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    TextButton(
                      onPressed: () {
                        // 查看全部
                      },
                      child: const Text('查看全部'),
                    ),
                  ],
                ),
              ),
            ),

            // 交易記錄列表
            provider.transactions.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.receipt_long,
                            size: 80,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '還沒有交易記錄',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '點擊下方按鈕開始記帳',
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
                          final transaction = provider.transactions[index];
                          final category = defaultCategories.firstWhere(
                            (c) => c.id == transaction.categoryId,
                          );

                          return TransactionCard(
                            transaction: transaction,
                            category: category,
                            onDelete: () {
                              provider.deleteTransaction(transaction.id);
                            },
                          );
                        },
                        childCount: provider.transactions.length > 10
                            ? 10
                            : provider.transactions.length,
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

  Widget _buildBalanceItem(String label, double amount, IconData icon, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.9),
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          NumberFormat.currency(symbol: '\$ ').format(amount),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
