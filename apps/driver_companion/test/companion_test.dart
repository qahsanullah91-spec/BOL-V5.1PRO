import 'package:flutter_test/flutter_test.dart';
import '../lib/domain/models/bill_of_lading.dart';
import '../lib/domain/models/ledger_entry.dart';
import '../lib/data/repositories/sync_engine.dart';

void main() {
  group('AQ Driver Companion - Domain & Accounting Tests', () {
    test('1. Bill of Lading JSON Serialization & Deserialization parity', () {
      final sampleJson = {
        'id': 'bol-101',
        'bol_number': 'NSA-2026-9901',
        'issue_date': '2026-11-15',
        'shipper_name': 'DUBAI LOGISTICS FZE',
        'consignee_name': 'KABUL IMPORT TRADING LTD',
        'transit_border': 'Islam Qala / اسلام قلعه',
        'driver_name': 'Mohammad Reza',
        'driver_phone': '+93700112233',
        'driver_rent': 42000.0,
        'driver_rent_currency': 'AFN',
        'truck_number': 'هرات ۱۲۳۴۵',
        'container_number': 'MSKU9081234',
        'status': 'IN_TRANSIT',
        'routes': [
          {
            'id': 'stop-1',
            'location': 'Bandar Abbas',
            'locationPersian': 'بندر عباس',
            'stopOrder': 1,
            'transportMode': 'vessel',
          },
          {
            'id': 'stop-2',
            'location': 'Islam Qala',
            'locationPersian': 'اسلام قلعه',
            'stopOrder': 2,
            'transportMode': 'truck',
          }
        ],
        'version': 1,
        'updated_at': '2026-11-15T00:00:00Z',
      };

      final bol = BillOfLading.fromJson(sampleJson);

      expect(bol.bolNumber, 'NSA-2026-9901');
      expect(bol.consigneeName, 'KABUL IMPORT TRADING LTD');
      expect(bol.driverRent, 42000.0);
      expect(bol.driverRentCurrency, 'AFN');
      expect(bol.routes.length, 2);
      expect(bol.routes.first.locationPersian, 'بندر عباس');

      final serialized = bol.toJson();
      expect(serialized['bol_number'], 'NSA-2026-9901');
      expect(serialized['driver_name'], 'Mohammad Reza');
      expect((serialized['routes'] as List).length, 2);
    });

    test('2. Accounting Invariance Identity strictly holds (Balance = Debit - Credit)', () {
      final entry = LedgerEntry.create(
        id: 'led-1',
        sNo: 1,
        date: '2026-11-15',
        shipperDescription: 'Textiles',
        invoiceNo: 'INV-2026-001',
        billOfLading: 'NSA-2026-9901',
        containerNo: 'MSKU9081234',
        consignee: 'Kabul Trading',
        debit: 15000.0,
        credit: 3500.0,
      );

      // Invariance check: 15,000 - 3,500 = 11,500
      expect(entry.balance, equals(11500.0));
      expect(entry.balance, equals(entry.debit - entry.credit));
    });

    test('3. SyncEngine merges disjoint non-conflicting field edits cleanly', () {
      final base = BillOfLading(
        id: 'bol-01',
        bolNumber: 'NSA-100',
        issueDate: '2026-11-01',
        shipperName: 'Shipper A',
        consigneeName: 'Consignee A',
        driverName: 'Driver 1',
        driverPhone: '0700000001',
        status: 'IN_TRANSIT',
        updatedAt: '2026-11-01T10:00:00Z',
        version: 1,
      );

      // Local user updates driver phone
      final local = base.copyWith(
        driverPhone: '0700999999',
        version: 2,
        updatedAt: '2026-11-02T10:00:00Z',
      );

      // Remote server updates status to DELIVERED
      final remote = base.copyWith(
        status: 'DELIVERED',
        version: 2,
        updatedAt: '2026-11-02T11:00:00Z',
      );

      final mergeResult = SyncEngine.mergeBols(
        local: local,
        remote: remote,
        base: base,
      );

      expect(mergeResult.hasConflict, isFalse);
      expect(mergeResult.merged.driverPhone, '0700999999'); // preserved local phone
      expect(mergeResult.merged.status, 'DELIVERED'); // preserved remote status
      expect(mergeResult.merged.version, greaterThan(base.version));
    });
  });
}
