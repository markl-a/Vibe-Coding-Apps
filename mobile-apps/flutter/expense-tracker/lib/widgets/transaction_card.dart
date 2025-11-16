import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/transaction.dart';
import '../models/category.dart';

class TransactionCard extends StatelessWidget {
  final Transaction transaction;
  final Category category;
  final VoidCallback? onDelete;

  const TransactionCard({
    super.key,
    required this.transaction,
    required this.category,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isExpense = transaction.type == 'expense';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: category.color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(category.icon, color: category.color),
        ),
        title: Text(
          category.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (transaction.note != null) Text(transaction.note!),
            Text(
              DateFormat('yyyy/MM/dd HH:mm').format(transaction.date),
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isExpense ? '-' : '+'} ${NumberFormat.currency(symbol: '\$').format(transaction.amount)}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isExpense ? Colors.red : Colors.green,
              ),
            ),
          ],
        ),
        onLongPress: onDelete != null
            ? () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('確認刪除'),
                    content: const Text('確定要刪除這筆交易嗎？'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('取消'),
                      ),
                      FilledButton(
                        onPressed: () {
                          onDelete?.call();
                          Navigator.pop(context);
                        },
                        style: FilledButton.styleFrom(backgroundColor: Colors.red),
                        child: const Text('刪除'),
                      ),
                    ],
                  ),
                );
              }
            : null,
      ),
    );
  }
}
