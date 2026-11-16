import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../domain/models/bill_of_lading.dart';

class ApiService {
  final String baseUrl;
  final http.Client _client;

  ApiService({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// Fetch active Bills of Lading from the backend server
  Future<List<BillOfLading>> fetchBols() async {
    final uri = Uri.parse('$baseUrl/api/bol');
    final response = await _client.get(
      uri,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AQ-Driver-Companion-Mobile/1.0',
      },
    );

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      final List<dynamic> list = (decoded is Map<String, dynamic> && decoded.containsKey('bols'))
          ? decoded['bols'] as List<dynamic>
          : (decoded is List ? decoded : []);

      return list
          .map((item) => BillOfLading.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception('Failed to load Bills of Lading: HTTP ${response.statusCode}');
    }
  }

  /// Update BOL status or cargo checkpoint from the mobile companion app
  Future<BillOfLading> updateBol(BillOfLading bol) async {
    final uri = Uri.parse('$baseUrl/api/bol/${bol.id}');
    final response = await _client.put(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(bol.toJson()),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final payload = decoded.containsKey('bol') ? decoded['bol'] as Map<String, dynamic> : decoded;
      return BillOfLading.fromJson(payload);
    } else {
      throw Exception('Failed to update BOL: HTTP ${response.statusCode}');
    }
  }

  /// Health check ping to verify server connectivity
  Future<bool> checkServerHealth() async {
    try {
      final uri = Uri.parse('$baseUrl/api/health');
      final response = await _client.get(uri).timeout(const Duration(seconds: 4));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
