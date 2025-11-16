import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/recipe_provider.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final recipeProvider = RecipeProvider();
  await recipeProvider.initialize();

  runApp(MyApp(recipeProvider: recipeProvider));
}

class MyApp extends StatelessWidget {
  final RecipeProvider recipeProvider;

  const MyApp({super.key, required this.recipeProvider});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: recipeProvider,
      child: MaterialApp(
        title: '食譜分享',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.orange,
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
            seedColor: Colors.orange,
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
