import '../../domain/models/bill_of_lading.dart';
import '../../domain/models/sync_entity.dart';

class SyncConflict<T> {
  final String entityId;
  final T localVersion;
  final T remoteVersion;
  final List<String> conflictingFields;

  SyncConflict({
    required this.entityId,
    required this.localVersion,
    required this.remoteVersion,
    required this.conflictingFields,
  });
}

/// Offline-first synchronization engine implementing 3-way merge
/// Ported from TypeScript lib/sync/merge.ts and lib/sync/conflict-resolver.ts
class SyncEngine {
  /// Merges a local BOL with a remote BOL.
  /// If non-conflicting fields were edited, merges them deterministically.
  /// If identical scalar fields conflict, flags a SyncConflict.
  static ({BillOfLading merged, bool hasConflict, List<String> conflictFields}) mergeBols({
    required BillOfLading local,
    required BillOfLading remote,
    BillOfLading? base,
  }) {
    // If remote and local are already identical, no work needed
    final localJson = local.toJson();
    final remoteJson = remote.toJson();
    final baseJson = base?.toJson() ?? {};

    final localChecksum = SyncEntity.calculateChecksum(localJson);
    final remoteChecksum = SyncEntity.calculateChecksum(remoteJson);

    if (localChecksum == remoteChecksum) {
      return (merged: remote, hasConflict: false, conflictFields: <String>[]);
    }

    final mergedMap = Map<String, dynamic>.from(baseJson);
    final conflicts = <String>[];

    final allKeys = {...localJson.keys, ...remoteJson.keys};

    for (final key in allKeys) {
      if (key == 'version' || key == 'updated_at') continue;

      final localVal = localJson[key];
      final remoteVal = remoteJson[key];
      final baseVal = baseJson[key];

      final localChanged = localVal != baseVal;
      final remoteChanged = remoteVal != baseVal;

      if (localChanged && !remoteChanged) {
        // Only local changed this field -> take local
        mergedMap[key] = localVal;
      } else if (!localChanged && remoteChanged) {
        // Only remote changed this field -> take remote
        mergedMap[key] = remoteVal;
      } else if (localChanged && remoteChanged) {
        // Both changed! Check if they agreed on the same value
        if (localVal == remoteVal) {
          mergedMap[key] = localVal;
        } else {
          // Field conflict
          conflicts.add(key);
          // Default to latest timestamp/remote, but report conflict for review
          mergedMap[key] = remoteVal;
        }
      } else {
        // Neither changed
        mergedMap[key] = baseVal ?? localVal;
      }
    }

    // Set updated version and timestamp
    final maxVersion = local.version > remote.version ? local.version + 1 : remote.version + 1;
    mergedMap['version'] = maxVersion;
    mergedMap['updated_at'] = DateTime.now().toIso8601String();

    final result = BillOfLading.fromJson(mergedMap);
    return (
      merged: result,
      hasConflict: conflicts.isNotEmpty,
      conflictFields: conflicts,
    );
  }
}
