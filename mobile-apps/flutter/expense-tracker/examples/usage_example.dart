import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../models/budget.dart';

/// Expense Tracker App 使用範例
///
/// 這個範例展示如何:
/// 1. 創建和管理交易記錄
/// 2. 使用分類系統
/// 3. 設定預算
/// 4. 統計分析
/// 5. 圖表顯示

/// 範例 1: 交易記錄測試數據
class TransactionTestData {
  /// 創建範例收入交易
  static Transaction createIncomeTransaction() {
    return Transaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: '薪水',
      amount: 50000.0,
      category: Category.income,
      date: DateTime.now(),
      description: '11月份薪水',
      type: TransactionType.income,
    );
  }

  /// 創建範例支出交易
  static Transaction createExpenseTransaction() {
    return Transaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: '超市購物',
      amount: 1250.0,
      category: Category.food,
      date: DateTime.now(),
      description: '週末採購',
      type: TransactionType.expense,
    );
  }

  /// 創建本月交易範例數據
  static List<Transaction> getMonthlyTransactions() {
    final now = DateTime.now();
    return [
      // 收入
      Transaction(
        id: '1',
        title: '薪水',
        amount: 50000.0,
        category: Category.income,
        date: DateTime(now.year, now.month, 1),
        description: '月薪',
        type: TransactionType.income,
      ),
      Transaction(
        id: '2',
        title: '兼職收入',
        amount: 5000.0,
        category: Category.income,
        date: DateTime(now.year, now.month, 15),
        description: '週末兼職',
        type: TransactionType.income,
      ),

      // 支出 - 飲食
      Transaction(
        id: '3',
        title: '超市購物',
        amount: 3500.0,
        category: Category.food,
        date: DateTime(now.year, now.month, 2),
        description: '每週採購',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '4',
        title: '餐廳聚餐',
        amount: 1800.0,
        category: Category.food,
        date: DateTime(now.year, now.month, 8),
        description: '朋友聚餐',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '5',
        title: '咖啡店',
        amount: 150.0,
        category: Category.food,
        date: DateTime(now.year, now.month, 10),
        description: '早餐咖啡',
        type: TransactionType.expense,
      ),

      // 支出 - 交通
      Transaction(
        id: '6',
        title: '加油',
        amount: 1200.0,
        category: Category.transportation,
        date: DateTime(now.year, now.month, 5),
        description: '汽車加油',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '7',
        title: '捷運卡儲值',
        amount: 500.0,
        category: Category.transportation,
        date: DateTime(now.year, now.month, 1),
        description: '悠遊卡',
        type: TransactionType.expense,
      ),

      // 支出 - 娛樂
      Transaction(
        id: '8',
        title: '電影票',
        amount: 600.0,
        category: Category.entertainment,
        date: DateTime(now.year, now.month, 12),
        description: '週末看電影',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '9',
        title: 'Netflix 訂閱',
        amount: 390.0,
        category: Category.entertainment,
        date: DateTime(now.year, now.month, 1),
        description: '月費',
        type: TransactionType.expense,
      ),

      // 支出 - 購物
      Transaction(
        id: '10',
        title: '衣服',
        amount: 2500.0,
        category: Category.shopping,
        date: DateTime(now.year, now.month, 14),
        description: '換季購物',
        type: TransactionType.expense,
      ),

      // 支出 - 健康
      Transaction(
        id: '11',
        title: '健身房會費',
        amount: 1200.0,
        category: Category.health,
        date: DateTime(now.year, now.month, 1),
        description: '月費',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '12',
        title: '看醫生',
        amount: 450.0,
        category: Category.health,
        date: DateTime(now.year, now.month, 7),
        description: '感冒就診',
        type: TransactionType.expense,
      ),

      // 支出 - 帳單
      Transaction(
        id: '13',
        title: '電費',
        amount: 800.0,
        category: Category.bills,
        date: DateTime(now.year, now.month, 3),
        description: '上月電費',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '14',
        title: '網路費',
        amount: 599.0,
        category: Category.bills,
        date: DateTime(now.year, now.month, 5),
        description: '月租費',
        type: TransactionType.expense,
      ),
      Transaction(
        id: '15',
        title: '手機費',
        amount: 699.0,
        category: Category.bills,
        date: DateTime(now.year, now.month, 6),
        description: '電信費',
        type: TransactionType.expense,
      ),
    ];
  }
}

/// 範例 2: 預算管理範例
class BudgetExamples {
  /// 創建月度預算
  static Budget createMonthlyBudget(String categoryId, double amount) {
    final now = DateTime.now();
    return Budget(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      categoryId: categoryId,
      amount: amount,
      month: now.month,
      year: now.year,
    );
  }

  /// 獲取推薦的月度預算設定
  static List<Budget> getRecommendedBudgets() {
    final now = DateTime.now();
    return [
      Budget(
        id: '1',
        categoryId: 'food',
        amount: 8000.0,
        month: now.month,
        year: now.year,
      ),
      Budget(
        id: '2',
        categoryId: 'transportation',
        amount: 3000.0,
        month: now.month,
        year: now.year,
      ),
      Budget(
        id: '3',
        categoryId: 'entertainment',
        amount: 2000.0,
        month: now.month,
        year: now.year,
      ),
      Budget(
        id: '4',
        categoryId: 'shopping',
        amount: 5000.0,
        month: now.month,
        year: now.year,
      ),
      Budget(
        id: '5',
        categoryId: 'health',
        amount: 2000.0,
        month: now.month,
        year: now.year,
      ),
      Budget(
        id: '6',
        categoryId: 'bills',
        amount: 3000.0,
        month: now.month,
        year: now.year,
      ),
    ];
  }
}

/// 範例 3: 統計分析工具
class FinanceStatistics {
  /// 計算總收入
  static double calculateTotalIncome(List<Transaction> transactions) {
    return transactions
        .where((t) => t.type == TransactionType.income)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  /// 計算總支出
  static double calculateTotalExpense(List<Transaction> transactions) {
    return transactions
        .where((t) => t.type == TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  /// 計算淨收入 (收入 - 支出)
  static double calculateNetIncome(List<Transaction> transactions) {
    return calculateTotalIncome(transactions) -
           calculateTotalExpense(transactions);
  }

  /// 按分類統計支出
  static Map<Category, double> getExpenseByCategory(
    List<Transaction> transactions,
  ) {
    final Map<Category, double> result = {};

    for (final transaction in transactions) {
      if (transaction.type == TransactionType.expense) {
        result[transaction.category] =
            (result[transaction.category] ?? 0.0) + transaction.amount;
      }
    }

    return result;
  }

  /// 計算分類佔比百分比
  static Map<Category, double> getCategoryPercentages(
    List<Transaction> transactions,
  ) {
    final categoryTotals = getExpenseByCategory(transactions);
    final totalExpense = calculateTotalExpense(transactions);

    if (totalExpense == 0) return {};

    return categoryTotals.map(
      (category, amount) => MapEntry(
        category,
        (amount / totalExpense) * 100,
      ),
    );
  }

  /// 獲取前 N 大支出交易
  static List<Transaction> getTopExpenses(
    List<Transaction> transactions, {
    int count = 5,
  }) {
    final expenses = transactions
        .where((t) => t.type == TransactionType.expense)
        .toList()
      ..sort((a, b) => b.amount.compareTo(a.amount));

    return expenses.take(count).toList();
  }

  /// 計算日均支出
  static double getDailyAverageExpense(List<Transaction> transactions) {
    if (transactions.isEmpty) return 0.0;

    final expenses = transactions
        .where((t) => t.type == TransactionType.expense)
        .toList();

    if (expenses.isEmpty) return 0.0;

    final totalExpense = calculateTotalExpense(transactions);
    final firstDate = expenses.map((t) => t.date).reduce(
      (a, b) => a.isBefore(b) ? a : b,
    );
    final lastDate = expenses.map((t) => t.date).reduce(
      (a, b) => a.isAfter(b) ? a : b,
    );

    final days = lastDate.difference(firstDate).inDays + 1;
    return totalExpense / days;
  }

  /// 檢查預算執行情況
  static Map<String, dynamic> checkBudgetStatus(
    List<Transaction> transactions,
    List<Budget> budgets,
  ) {
    final categoryExpenses = getExpenseByCategory(transactions);
    final result = <String, dynamic>{};

    for (final budget in budgets) {
      final spent = categoryExpenses.entries
          .firstWhere(
            (e) => e.key.id == budget.categoryId,
            orElse: () => const MapEntry(Category.other, 0.0),
          )
          .value;

      final remaining = budget.amount - spent;
      final percentage = (spent / budget.amount) * 100;

      result[budget.categoryId] = {
        'budget': budget.amount,
        'spent': spent,
        'remaining': remaining,
        'percentage': percentage,
        'isOverBudget': spent > budget.amount,
      };
    }

    return result;
  }
}

/// 範例 4: 格式化工具
class FormatHelper {
  /// 格式化金額
  static String formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  /// 格式化日期
  static String formatDate(DateTime date) {
    return '${date.year}/${date.month.toString().padLeft(2, '0')}/'
           '${date.day.toString().padLeft(2, '0')}';
  }

  /// 格式化百分比
  static String formatPercentage(double percentage) {
    return '${percentage.toStringAsFixed(1)}%';
  }
}

/// 主函數 - 執行所有範例
void main() {
  print('💰 Expense Tracker App 使用範例\n');
  print('=' * 60);

  // 範例 1: 載入測試數據
  final transactions = TransactionTestData.getMonthlyTransactions();
  print('📊 已載入 ${transactions.length} 筆交易記錄\n');

  // 範例 2: 統計分析
  print('=' * 60);
  print('財務統計分析');
  print('=' * 60);

  final totalIncome = FinanceStatistics.calculateTotalIncome(transactions);
  final totalExpense = FinanceStatistics.calculateTotalExpense(transactions);
  final netIncome = FinanceStatistics.calculateNetIncome(transactions);

  print('總收入: ${FormatHelper.formatCurrency(totalIncome)}');
  print('總支出: ${FormatHelper.formatCurrency(totalExpense)}');
  print('淨收入: ${FormatHelper.formatCurrency(netIncome)}');
  print('儲蓄率: ${FormatHelper.formatPercentage((netIncome / totalIncome) * 100)}\n');

  // 範例 3: 分類統計
  print('=' * 60);
  print('支出分類統計');
  print('=' * 60);

  final categoryExpenses = FinanceStatistics.getExpenseByCategory(transactions);
  final categoryPercentages = FinanceStatistics.getCategoryPercentages(transactions);

  categoryExpenses.forEach((category, amount) {
    final percentage = categoryPercentages[category] ?? 0.0;
    print('${category.name}: ${FormatHelper.formatCurrency(amount)} '
          '(${FormatHelper.formatPercentage(percentage)})');
  });

  // 範例 4: 前 5 大支出
  print('\n' + '=' * 60);
  print('前 5 大支出');
  print('=' * 60);

  final topExpenses = FinanceStatistics.getTopExpenses(transactions);
  for (var i = 0; i < topExpenses.length; i++) {
    final t = topExpenses[i];
    print('${i + 1}. ${t.title}: ${FormatHelper.formatCurrency(t.amount)}');
    print('   ${t.category.name} - ${FormatHelper.formatDate(t.date)}');
  }

  // 範例 5: 預算檢查
  print('\n' + '=' * 60);
  print('預算執行情況');
  print('=' * 60);

  final budgets = BudgetExamples.getRecommendedBudgets();
  final budgetStatus = FinanceStatistics.checkBudgetStatus(
    transactions,
    budgets,
  );

  budgetStatus.forEach((categoryId, status) {
    final isOver = status['isOverBudget'] as bool;
    final emoji = isOver ? '❌' : '✅';
    print('$emoji $categoryId:');
    print('   預算: ${FormatHelper.formatCurrency(status['budget'])}');
    print('   已用: ${FormatHelper.formatCurrency(status['spent'])} '
          '(${FormatHelper.formatPercentage(status['percentage'])})');
    print('   剩餘: ${FormatHelper.formatCurrency(status['remaining'])}');
  });

  // 範例 6: 日均支出
  print('\n' + '=' * 60);
  print('日均支出分析');
  print('=' * 60);

  final dailyAvg = FinanceStatistics.getDailyAverageExpense(transactions);
  print('日均支出: ${FormatHelper.formatCurrency(dailyAvg)}');
  print('月均預估: ${FormatHelper.formatCurrency(dailyAvg * 30)}');

  print('\n✨ 所有範例執行完成!');
  print('''

💡 如何在您的應用中使用:

1. 在 Provider 中使用測試數據:
```dart
final testTransactions = TransactionTestData.getMonthlyTransactions();
await provider.addTransactions(testTransactions);
```

2. 在 UI 中顯示統計:
```dart
final totalIncome = FinanceStatistics.calculateTotalIncome(transactions);
Text('總收入: \${FormatHelper.formatCurrency(totalIncome)}');
```

3. 檢查預算狀態:
```dart
final budgetStatus = FinanceStatistics.checkBudgetStatus(
  transactions,
  budgets,
);
```

4. 生成圖表數據:
```dart
final categoryData = FinanceStatistics.getCategoryPercentages(transactions);
// 用於 PieChart 或 BarChart
```
  ''');
}
