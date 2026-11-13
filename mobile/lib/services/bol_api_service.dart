import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/bol_record.dart';

/// Top-level Isolate parsing function to prevent UI frame drops
List<BolRecord> parseBolsPayload(String responseBody) {
  final cleanBody = responseBody.replaceFirst('\uFEFF', '');
  final dynamic decoded = jsonDecode(cleanBody);

  final List<dynamic> items;
  if (decoded is Map<String, dynamic>) {
    if (decoded['bols'] is List) {
      items = decoded['bols'] as List;
    } else if (decoded['data'] is Map && decoded['data']['documents'] is List) {
      items = decoded['data']['documents'] as List;
    } else {
      items = [];
    }
  } else if (decoded is List) {
    items = decoded;
  } else {
    items = [];
  }

  return items
      .map<BolRecord>((item) => BolRecord.fromJson(item as Map<String, dynamic>))
      .toList();
}

class BolApiResponse {
  final List<BolRecord> bols;
  final int page;
  final int total;
  final int totalPages;

  const BolApiResponse({
    required this.bols,
    required this.page,
    required this.total,
    required this.totalPages,
  });
}

class BolApiService {
  /// Default base URL dynamically resolved by platform
  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:3001/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:3001/api';
    return 'http://localhost:3001/api';
  }

  /// Probes server health
  static Future<bool> checkHealth({String? baseUrl}) async {
    final rootUrl = baseUrl ?? defaultBaseUrl;
    final uri = Uri.parse('$rootUrl/health');
    try {
      final response = await http.get(uri).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Fetches paginated BOL records using mobile-optimized stream and compute()
  static Future<BolApiResponse> fetchBols({
    int page = 1,
    int limit = 20,
    String? baseUrl,
    String? authToken,
  }) async {
    final rootUrl = baseUrl ?? defaultBaseUrl;
    final uri = Uri.parse('$rootUrl/sync?mode=mobile&page=$page&limit=$limit');

    final response = await http.get(
      uri,
      headers: {
        HttpHeaders.acceptHeader: 'application/json',
        if (authToken != null && authToken.isNotEmpty)
          HttpHeaders.authorizationHeader: 'Bearer $authToken',
      },
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final cleanBody = response.body.replaceFirst('\uFEFF', '');
      final dynamic decoded = jsonDecode(cleanBody);
      final pagination = decoded is Map ? (decoded['pagination'] as Map<String, dynamic>?) : null;

      // Offload heavy JSON parsing to background isolate
      final records = await compute(parseBolsPayload, response.body);

      return BolApiResponse(
        bols: records,
        page: pagination?['page'] ?? page,
        total: pagination?['total'] ?? records.length,
        totalPages: pagination?['totalPages'] ?? 1,
      );
    } else {
      throw HttpException('Failed to load BOLs. HTTP Status: ${response.statusCode}');
    }
  }
}
