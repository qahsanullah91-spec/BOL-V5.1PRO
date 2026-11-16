import '../../domain/models/bill_of_lading.dart';
import '../services/api_service.dart';
import 'sync_engine.dart';

class BolRepository {
  final ApiService _apiService;
  final Map<String, BillOfLading> _cache = {};
  final List<BillOfLading> _pendingOfflineQueue = [];

  BolRepository({required ApiService apiService}) : _apiService = apiService;

  List<BillOfLading> get cachedBols => _cache.values.toList();
  List<BillOfLading> get pendingUploads => List.unmodifiable(_pendingOfflineQueue);

  /// Loads BOLs from API or falls back to local cache if offline
  Future<List<BillOfLading>> getBols({bool forceRefresh = false}) async {
    if (_cache.isNotEmpty && !forceRefresh) {
      return cachedBols;
    }

    try {
      final remoteList = await _apiService.fetchBols();
      for (final bol in remoteList) {
        _cache[bol.id] = bol;
      }
      return cachedBols;
    } catch (_) {
      // Offline fallback: return existing cache
      if (_cache.isNotEmpty) {
        return cachedBols;
      }
      rethrow;
    }
  }

  /// Updates a BOL record. If online, syncs immediately; if offline, enqueues.
  Future<BillOfLading> updateBol(BillOfLading updatedBol) async {
    // 1. Optimistically update local cache
    _cache[updatedBol.id] = updatedBol;

    // 2. Try to sync to server
    try {
      final synced = await _apiService.updateBol(updatedBol);
      _cache[synced.id] = synced;
      // Remove from offline queue if it was present
      _pendingOfflineQueue.removeWhere((item) => item.id == updatedBol.id);
      return synced;
    } catch (_) {
      // Network failed: store in pending offline queue
      _pendingOfflineQueue.removeWhere((item) => item.id == updatedBol.id);
      _pendingOfflineQueue.add(updatedBol);
      return updatedBol;
    }
  }

  /// Synchronizes all pending offline changes when connection resumes
  Future<int> syncPendingChanges() async {
    if (_pendingOfflineQueue.isEmpty) return 0;

    int syncedCount = 0;
    final queueCopy = List<BillOfLading>.from(_pendingOfflineQueue);

    for (final item in queueCopy) {
      try {
        final synced = await _apiService.updateBol(item);
        _cache[synced.id] = synced;
        _pendingOfflineQueue.removeWhere((p) => p.id == item.id);
        syncedCount++;
      } catch (_) {
        // Stop on connection error to retry later
        break;
      }
    }

    return syncedCount;
  }
}
