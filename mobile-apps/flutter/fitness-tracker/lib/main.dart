import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/workout_provider.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final workoutProvider = WorkoutProvider();
  await workoutProvider.initialize();

  runApp(MyApp(workoutProvider: workoutProvider));
}

class MyApp extends StatelessWidget {
  final WorkoutProvider workoutProvider;

  const MyApp({super.key, required this.workoutProvider});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: workoutProvider,
      child: MaterialApp(
        title: '健身追蹤',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
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
            seedColor: Colors.blue,
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
