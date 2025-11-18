import 'package:flutter/foundation.dart';
import '../models/transaction.dart';
import '../models/budget.dart';
import '../models/category.dart';
import '../utils/database_helper.dart';
import '../services/ai_service.dart';

class TransactionProvider extends ChangeNotifier {
  List<Transaction> _transactions = [];
  List<Budget> _budgets = [];
  final DatabaseHelper _db = DatabaseHelper.instance;
  final AIService _aiService = AIService();

  List<Transaction> get transactions => _transactions;
  List<Budget> get budgets => _budgets;

  Future<void> loadTransactions() async {
    _transactions = await _db.getAllTransactions();
    notifyListeners();
  }

  Future<void> addTransaction(Transaction transaction) async {
    await _db.insertTransaction(transaction);
    await loadTransactions();
  }

  Future<void> deleteTransaction(String id) async {
    await _db.deleteTransaction(id);
    await loadTransactions();
  }

  // 獲取特定月份的交易
  List<Transaction> getTransactionsByMonth(int month, int year) {
    return _transactions.where((t) {
      return t.date.month == month && t.date.year == year;
    }).toList();
  }

  // 獲取特定類別的交易
  List<Transaction> getTransactionsByCategory(String categoryId) {
    return _transactions.where((t) => t.categoryId == categoryId).toList();
  }

  // 統計功能
  double getTotalIncome({DateTime? start, DateTime? end}) {
    var filtered = _transactions.where((t) => t.type == 'income');

    if (start != null && end != null) {
      filtered = filtered.where((t) =>
          t.date.isAfter(start.subtract(const Duration(days: 1))) &&
          t.date.isBefore(end.add(const Duration(days: 1))));
    }

    return filtered.fold(0.0, (sum, t) => sum + t.amount);
  }

  double getTotalExpense({DateTime? start, DateTime? end}) {
    var filtered = _transactions.where((t) => t.type == 'expense');

    if (start != null && end != null) {
      filtered = filtered.where((t) =>
          t.date.isAfter(start.subtract(const Duration(days: 1))) &&
          t.date.isBefore(end.add(const Duration(days: 1))));
    }

    return filtered.fold(0.0, (sum, t) => sum + t.amount);
  }

  double getBalance() {
    final income = getTotalIncome();
    final expense = getTotalExpense();
    return income - expense;
  }

  Map<String, double> getExpenseByCategory({DateTime? start, DateTime? end}) {
    var filtered = _transactions.where((t) => t.type == 'expense');

    if (start != null && end != null) {
      filtered = filtered.where((t) =>
          t.date.isAfter(start.subtract(const Duration(days: 1))) &&
          t.date.isBefore(end.add(const Duration(days: 1))));
    }

    final Map<String, double> result = {};
    for (var transaction in filtered) {
      result[transaction.categoryId] =
          (result[transaction.categoryId] ?? 0) + transaction.amount;
    }

    return result;
  }

  // 預算管理
  Future<void> loadBudgets(int month, int year) async {
    _budgets = await _db.getBudgetsByMonth(month, year);
    notifyListeners();
  }

  Future<void> setBudget(Budget budget) async {
    await _db.insertBudget(budget);
    await loadBudgets(budget.month, budget.year);
  }

  double getBudgetProgress(String categoryId, int month, int year) {
    final budget = _budgets.firstWhere(
      (b) => b.categoryId == categoryId && b.month == month && b.year == year,
      orElse: () => Budget(
        id: '',
        categoryId: categoryId,
        amount: 0,
        month: month,
        year: year,
      ),
    );

    if (budget.amount == 0) return 0;

    final spent = _transactions
        .where((t) =>
            t.categoryId == categoryId &&
            t.type == 'expense' &&
            t.date.month == month &&
            t.date.year == year)
        .fold(0.0, (sum, t) => sum + t.amount);

    return spent / budget.amount;
  }

  // ========== AI 功能 ==========

  /// AI 智能分類建議
  String suggestCategoryForTransaction(String description) {
    return _aiService.suggestCategory(description, _transactions);
  }

  /// AI 預算建議
  Map<String, double> getAIBudgetSuggestions(double monthlyIncome) {
    // 計算過去3個月的平均支出
    final now = DateTime.now();
    final threeMonthsAgo = DateTime(now.year, now.month - 3, now.day);

    final recentExpenses = _transactions
        .where((t) =>
            t.type == 'expense' &&
            t.date.isAfter(threeMonthsAgo))
        .toList();

    // 按類別統計
    Map<String, double> categorySpending = {};
    for (var transaction in recentExpenses) {
      categorySpending[transaction.categoryId] =
          (categorySpending[transaction.categoryId] ?? 0) + transaction.amount;
    }

    // 計算平均月支出
    final monthCount = 3;
    categorySpending.updateAll((key, value) => value / monthCount);

    return _aiService.suggestBudget(monthlyIncome, categorySpending);
  }

  /// AI 支出預測
  double predictNextMonthExpense() {
    return _aiService.predictNextMonthExpense(_transactions);
  }

  /// AI 財務建議
  List<String> getAIFinancialAdvice({DateTime? start, DateTime? end}) {
    final income = getTotalIncome(start: start, end: end);
    final expense = getTotalExpense(start: start, end: end);
    final categoryExpenses = getExpenseByCategory(start: start, end: end);

    return _aiService.getFinancialAdvice(
      income,
      expense,
      categoryExpenses,
      _budgets,
    );
  }

  /// AI 異常檢測
  List<String> detectAnomalies() {
    return _aiService.detectAnomalies(_transactions);
  }

  /// 智能標籤建議
  List<String> suggestTags(String description, double amount) {
    return _aiService.suggestTags(description, amount);
  }
}
