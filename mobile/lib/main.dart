import 'package:flutter/material.dart';
import 'screens/bol_list_view.dart';

void main() {
  runApp(const SkyArianaMobileApp());
}

class SkyArianaMobileApp extends StatelessWidget {
  const SkyArianaMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sky Ariana BOL Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // Corporate Sky Ariana Navy Blue
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A),
          brightness: Brightness.dark,
        ),
      ),
      themeMode: ThemeMode.system,
      home: const BolListView(),
    );
  }
}
