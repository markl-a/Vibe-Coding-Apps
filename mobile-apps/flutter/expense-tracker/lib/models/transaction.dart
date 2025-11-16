class Transaction {
  final String id;
  final String categoryId;
  final double amount;
  final String type; // 'expense' or 'income'
  final DateTime date;
  final String? note;
  final String? account;

  Transaction({
    required this.id,
    required this.categoryId,
    required this.amount,
    required this.type,
    required this.date,
    this.note,
    this.account,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'categoryId': categoryId,
        'amount': amount,
        'type': type,
        'date': date.toIso8601String(),
        'note': note,
        'account': account,
      };

  factory Transaction.fromMap(Map<String, dynamic> map) => Transaction(
        id: map['id'],
        categoryId: map['categoryId'],
        amount: map['amount'],
        type: map['type'],
        date: DateTime.parse(map['date']),
        note: map['note'],
        account: map['account'],
      );
}
