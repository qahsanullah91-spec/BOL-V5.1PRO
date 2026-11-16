import 'package:flutter/foundation.dart';
import '../../../../domain/models/bill_of_lading.dart';
import '../../../../data/repositories/bol_repository.dart';

class BolListViewModel extends ChangeNotifier {
  final BolRepository _repository;

  List<BillOfLading> _allBols = [];
  String _searchQuery = '';
  String _statusFilter = 'ALL';
  bool _isLoading = false;
  String? _errorMessage;
  BillOfLading? _selectedBol;

  BolListViewModel({required BolRepository repository}) : _repository = repository;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get statusFilter => _statusFilter;
  BillOfLading? get selectedBol => _selectedBol;
  int get pendingOfflineCount => _repository.pendingUploads.length;

  List<BillOfLading> get filteredBols {
    return _allBols.where((bol) {
      final matchesSearch = _searchQuery.isEmpty ||
          bol.bolNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          bol.consigneeName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (bol.driverName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (bol.truckNumber?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (bol.containerNumber?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);

      final matchesStatus = _statusFilter == 'ALL' || bol.status.toUpperCase() == _statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    }).toList();
  }

  void selectBol(BillOfLading? bol) {
    _selectedBol = bol;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setStatusFilter(String filter) {
    _statusFilter = filter;
    notifyListeners();
  }

  Future<void> loadBols({bool forceRefresh = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _allBols = await _repository.getBols(forceRefresh: forceRefresh);
      if (_allBols.isNotEmpty && _selectedBol == null) {
        _selectedBol = _allBols.first;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStatus(BillOfLading bol, String newStatus) async {
    final updated = bol.copyWith(status: newStatus);
    final saved = await _repository.updateBol(updated);

    // Update in local list
    final idx = _allBols.indexWhere((b) => b.id == saved.id);
    if (idx != -1) {
      _allBols[idx] = saved;
    }
    if (_selectedBol?.id == saved.id) {
      _selectedBol = saved;
    }
    notifyListeners();
  }

  Future<void> syncOfflineQueue() async {
    await _repository.syncPendingChanges();
    notifyListeners();
  }
}
