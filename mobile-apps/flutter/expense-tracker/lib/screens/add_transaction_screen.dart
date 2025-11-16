import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart' as model;
import '../models/category.dart';
import '../providers/transaction_provider.dart';

class AddTransactionScreen extends StatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();

  String _type = 'expense';
  String? _selectedCategoryId;
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final categories = defaultCategories
        .where((c) => c.type.toString().split('.').last == _type)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('新增交易'),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // 類型選擇
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'expense', label: Text('支出'), icon: Icon(Icons.remove)),
                ButtonSegment(value: 'income', label: Text('收入'), icon: Icon(Icons.add)),
              ],
              selected: {_type},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() {
                  _type = newSelection.first;
                  _selectedCategoryId = null;
                });
              },
            ),

            const SizedBox(height: 24),

            // 金額輸入
            TextFormField(
              controller: _amountController,
              decoration: InputDecoration(
                labelText: '金額',
                prefixText: 'NT\$ ',
                border: const OutlineInputBorder(),
                filled: true,
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '請輸入金額';
                }
                if (double.tryParse(value) == null) {
                  return '請輸入有效金額';
                }
                return null;
              },
            ),

            const SizedBox(height: 16),

            // 類別選擇
            Text('選擇類別', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.85,
              ),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final isSelected = _selectedCategoryId == category.id;

                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedCategoryId = category.id;
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? category.color.withOpacity(0.2)
                          : Theme.of(context).colorScheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: isSelected
                          ? Border.all(color: category.color, width: 2)
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(category.icon, color: category.color, size: 32),
                        const SizedBox(height: 4),
                        Text(
                          category.name,
                          style: const TextStyle(fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 16),

            // 日期選擇
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('日期'),
              subtitle: Text('${_selectedDate.year}/${_selectedDate.month}/${_selectedDate.day}'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (date != null) {
                  setState(() {
                    _selectedDate = date;
                  });
                }
              },
            ),

            const SizedBox(height: 16),

            // 備註
            TextFormField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: '備註',
                hintText: '輸入備註說明',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),

            const SizedBox(height: 24),

            // 儲存按鈕
            FilledButton(
              onPressed: _saveTransaction,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('儲存', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  void _saveTransaction() {
    if (_formKey.currentState!.validate() && _selectedCategoryId != null) {
      final transaction = model.Transaction(
        id: const Uuid().v4(),
        categoryId: _selectedCategoryId!,
        amount: double.parse(_amountController.text),
        type: _type,
        date: _selectedDate,
        note: _noteController.text.isNotEmpty ? _noteController.text : null,
      );

      context.read<TransactionProvider>().addTransaction(transaction);
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('交易已儲存！')),
      );
    } else if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('請選擇類別')),
      );
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }
}
