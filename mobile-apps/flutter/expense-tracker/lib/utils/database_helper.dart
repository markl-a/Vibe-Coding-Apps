import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/transaction.dart';
import '../models/budget.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('expense_tracker.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const realType = 'REAL NOT NULL';
    const intType = 'INTEGER NOT NULL';

    // 交易記錄表
    await db.execute('''
      CREATE TABLE transactions (
        id $idType,
        categoryId $textType,
        amount $realType,
        type $textType,
        date $textType,
        note TEXT,
        account TEXT
      )
    ''');

    // 預算表
    await db.execute('''
      CREATE TABLE budgets (
        id $idType,
        categoryId $textType,
        amount $realType,
        month $intType,
        year $intType
      )
    ''');

    // 創建索引
    await db.execute('CREATE INDEX idx_transaction_date ON transactions(date)');
    await db.execute('CREATE INDEX idx_transaction_type ON transactions(type)');
  }

  // 交易記錄操作
  Future<void> insertTransaction(Transaction transaction) async {
    final db = await database;
    await db.insert('transactions', transaction.toMap());
  }

  Future<List<Transaction>> getAllTransactions() async {
    final db = await database;
    final result = await db.query('transactions', orderBy: 'date DESC');
    return result.map((map) => Transaction.fromMap(map)).toList();
  }

  Future<List<Transaction>> getTransactionsByDateRange(
    DateTime start,
    DateTime end,
  ) async {
    final db = await database;
    final result = await db.query(
      'transactions',
      where: 'date >= ? AND date <= ?',
      whereArgs: [start.toIso8601String(), end.toIso8601String()],
      orderBy: 'date DESC',
    );
    return result.map((map) => Transaction.fromMap(map)).toList();
  }

  Future<void> deleteTransaction(String id) async {
    final db = await database;
    await db.delete('transactions', where: 'id = ?', whereArgs: [id]);
  }

  // 預算操作
  Future<void> insertBudget(Budget budget) async {
    final db = await database;
    await db.insert(
      'budgets',
      budget.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Budget>> getBudgetsByMonth(int month, int year) async {
    final db = await database;
    final result = await db.query(
      'budgets',
      where: 'month = ? AND year = ?',
      whereArgs: [month, year],
    );
    return result.map((map) => Budget.fromMap(map)).toList();
  }

  Future<void> close() async {
    final db = await database;
    db.close();
  }
}
