import 'package:flutter/foundation.dart';
import '../models/transaction.dart';
import '../models/budget.dart';
import '../models/category.dart';
import '../utils/database_helper.dart';

class TransactionProvider extends ChangeNotifier {
  List<Transaction> _transactions = [];
  List<Budget> _budgets = [];
  final DatabaseHelper _db = DatabaseHelper.instance;

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
}
