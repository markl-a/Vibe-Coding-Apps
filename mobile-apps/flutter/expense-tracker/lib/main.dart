import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/transaction_provider.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final transactionProvider = TransactionProvider();
  await transactionProvider.loadTransactions();

  final now = DateTime.now();
  await transactionProvider.loadBudgets(now.month, now.year);

  runApp(MyApp(transactionProvider: transactionProvider));
}

class MyApp extends StatelessWidget {
  final TransactionProvider transactionProvider;

  const MyApp({super.key, required this.transactionProvider});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: transactionProvider,
      child: MaterialApp(
        title: '記帳本',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.teal,
            brightness: Brightness.light,
          ),
          textTheme: GoogleFonts.notoSansTextTheme(),
          cardTheme: CardTheme(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        darkTheme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.teal,
            brightness: Brightness.dark,
          ),
          textTheme: GoogleFonts.notoSansTextTheme(ThemeData.dark().textTheme),
          cardTheme: CardTheme(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        themeMode: ThemeMode.system,
        home: const HomeScreen(),
      ),
    );
  }
}
