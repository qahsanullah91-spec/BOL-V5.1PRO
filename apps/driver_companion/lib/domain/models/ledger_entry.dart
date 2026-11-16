import 'dart:convert';

/// Ledger entry model adhering to strict mathematical invariance:
/// Net Balance = Total Debit - Total Credit
class LedgerEntry {
  final String id;
  final int sNo;
  final String date;
  final String shipperDescription;
  final String invoiceNo;
  final String billOfLading;
  final String containerNo;
  final String consignee;
  final double debit;
  final double credit;
  final double balance;
  final String currency;
  final int version;
  final String updatedAt;

  const LedgerEntry({
    required this.id,
    required this.sNo,
    required this.date,
    required this.shipperDescription,
    required this.invoiceNo,
    required this.billOfLading,
    required this.containerNo,
    required this.consignee,
    required this.debit,
    required this.credit,
    required this.balance,
    this.currency = 'USD',
    this.version = 1,
    required this.updatedAt,
  });

  /// Factory constructor ensuring the balance matches Debit - Credit
  factory LedgerEntry.create({
    required String id,
    required int sNo,
    required String date,
    required String shipperDescription,
    required String invoiceNo,
    required String billOfLading,
    required String containerNo,
    required String consignee,
    required double debit,
    required double credit,
    String currency = 'USD',
    int version = 1,
    String? updatedAt,
  }) {
    // Enforce Accounting Invariance Identity: Balance = Debit - Credit
    final calculatedBalance = debit - credit;

    return LedgerEntry(
      id: id,
      sNo: sNo,
      date: date,
      shipperDescription: shipperDescription,
      invoiceNo: invoiceNo,
      billOfLading: billOfLading,
      containerNo: containerNo,
      consignee: consignee,
      debit: debit,
      credit: credit,
      balance: calculatedBalance,
      currency: currency,
      version: version,
      updatedAt: updatedAt ?? DateTime.now().toIso8601String(),
    );
  }

  factory LedgerEntry.fromJson(Map<String, dynamic> json) {
    final debit = (json['debit'] as num?)?.toDouble() ?? 0.0;
    final credit = (json['credit'] as num?)?.toDouble() ?? 0.0;
    // Strict invariance: Balance must equal Debit - Credit
    final balance = (json['balance'] as num?)?.toDouble() ?? (debit - credit);

    return LedgerEntry(
      id: json['id'] as String? ?? '',
      sNo: (json['sNo'] ?? json['s_no'] ?? 0) as int,
      date: json['date'] as String? ?? '',
      shipperDescription: json['shipperDescription'] as String? ?? json['shipper_description'] as String? ?? '',
      invoiceNo: json['invoiceNo'] as String? ?? json['invoice_no'] as String? ?? '',
      billOfLading: json['billOfLanding'] as String? ?? json['bill_of_lading'] as String? ?? '',
      containerNo: json['containerNo'] as String? ?? json['container_no'] as String? ?? '',
      consignee: json['consignee'] as String? ?? '',
      debit: debit,
      credit: credit,
      balance: balance,
      currency: json['currency'] as String? ?? 'USD',
      version: (json['version'] ?? 1) as int,
      updatedAt: json['updatedAt'] as String? ?? json['updated_at'] as String? ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sNo': sNo,
      'date': date,
      'shipperDescription': shipperDescription,
      'invoiceNo': invoiceNo,
      'billOfLanding': billOfLading,
      'containerNo': containerNo,
      'consignee': consignee,
      'debit': debit,
      'credit': credit,
      'balance': balance,
      'currency': currency,
      'version': version,
      'updatedAt': updatedAt,
    };
  }
}
