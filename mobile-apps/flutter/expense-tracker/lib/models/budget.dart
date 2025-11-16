class Budget {
  final String id;
  final String categoryId;
  final double amount;
  final int month; // 1-12
  final int year;

  Budget({
    required this.id,
    required this.categoryId,
    required this.amount,
    required this.month,
    required this.year,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'categoryId': categoryId,
        'amount': amount,
        'month': month,
        'year': year,
      };

  factory Budget.fromMap(Map<String, dynamic> map) => Budget(
        id: map['id'],
        categoryId: map['categoryId'],
        amount: map['amount'],
        month: map['month'],
        year: map['year'],
      );
}
