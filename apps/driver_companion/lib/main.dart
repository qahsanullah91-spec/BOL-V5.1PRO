import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'data/services/api_service.dart';
import 'data/repositories/bol_repository.dart';
import 'ui/features/bol_list/view_models/bol_list_view_model.dart';
import 'ui/features/bol_list/views/bol_list_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Services
  // In dev / LAN testing: point to local Next.js server (e.g. 10.0.2.2:3001 for Android emulator or 127.0.0.1:3001)
  final apiService = ApiService(baseUrl: 'http://127.0.0.1:3001');

  // 2. Initialize Repositories
  final bolRepository = BolRepository(apiService: apiService);

  // 3. Initialize ViewModels
  final bolListViewModel = BolListViewModel(repository: bolRepository);

  runApp(AQDriverCompanionApp(viewModel: bolListViewModel));
}

class AQDriverCompanionApp extends StatelessWidget {
  final BolListViewModel viewModel;

  const AQDriverCompanionApp({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AQ Logistics Driver Companion',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // AQ Brand Blue
          primary: const Color(0xFF1E3A8A),
          surface: const Color(0xFFF8FAFC),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        useMaterial3: true,
      ),
      // Multilingual & RTL Support (English, Persian/Dari, Pashto)
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('fa', 'AF'), // Dari / Persian
        Locale('ps', 'AF'), // Pashto
      ],
      home: BolListView(viewModel: viewModel),
    );
  }
}
