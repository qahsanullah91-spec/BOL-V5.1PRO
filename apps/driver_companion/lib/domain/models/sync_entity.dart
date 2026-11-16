import 'dart:convert';
import 'package:crypto/crypto.dart';

enum SyncStatus {
  synced,
  pendingUpload,
  conflict,
  error,
}

/// Sync metadata wrapper representing an offline-capable entity
class SyncEntity<T> {
  final String id;
  final String entityType;
  final T data;
  final int version;
  final String checksum;
  final bool isDeleted;
  final String lastModified;
  final SyncStatus syncStatus;

  const SyncEntity({
    required this.id,
    required this.entityType,
    required this.data,
    required this.version,
    required this.checksum,
    this.isDeleted = false,
    required this.lastModified,
    this.syncStatus = SyncStatus.synced,
  });

  /// Computes deterministic SHA-256 checksum of payload
  static String calculateChecksum(Map<String, dynamic> jsonPayload) {
    // Sort keys alphabetically for canonical consistency
    final sortedKeys = jsonPayload.keys.toList()..sort();
    final canonicalMap = <String, dynamic>{};
    for (final key in sortedKeys) {
      if (key != 'checksum' && key != 'syncStatus') {
        canonicalMap[key] = jsonPayload[key];
      }
    }
    final rawString = jsonEncode(canonicalMap);
    return sha256.convert(utf8.encode(rawString)).toString();
  }

  SyncEntity<T> copyWith({
    T? data,
    int? version,
    String? checksum,
    bool? isDeleted,
    String? lastModified,
    SyncStatus? syncStatus,
  }) {
    return SyncEntity<T>(
      id: id,
      entityType: entityType,
      data: data ?? this.data,
      version: version ?? this.version,
      checksum: checksum ?? this.checksum,
      isDeleted: isDeleted ?? this.isDeleted,
      lastModified: lastModified ?? this.lastModified,
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }
}
