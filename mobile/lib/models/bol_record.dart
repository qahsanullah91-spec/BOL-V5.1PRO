import 'dart:convert';

/// Strongly-typed Bill of Lading record model for Flutter client
class BolRecord {
  final String bolNumber;
  final String consigneeName;
  final String cargoDescription;
  final String numberOfPackages;
  final String netWeight;
  final String grossWeight;
  final String shipperName;
  final String issueDate;
  final String finalDestination;

  const BolRecord({
    required this.bolNumber,
    required this.consigneeName,
    required this.cargoDescription,
    required this.numberOfPackages,
    required this.netWeight,
    this.grossWeight = '',
    this.shipperName = '',
    this.issueDate = '',
    this.finalDestination = '',
  });

  factory BolRecord.fromJson(Map<String, dynamic> json) {
    return BolRecord(
      bolNumber: (json['bol_number'] ?? json['bolNumber'] ?? '').toString(),
      consigneeName: (json['consignee_name'] ?? json['consignee'] ?? '').toString(),
      cargoDescription: (json['cargo_description'] ?? json['commodity'] ?? '').toString(),
      numberOfPackages: (json['number_of_packages'] ?? json['packages'] ?? '').toString(),
      netWeight: (json['net_weight'] ?? json['weight'] ?? '').toString(),
      grossWeight: (json['gross_weight'] ?? '').toString(),
      shipperName: (json['shipper_name'] ?? json['shipper'] ?? '').toString(),
      issueDate: (json['issue_date'] ?? json['date'] ?? '').toString(),
      finalDestination: (json['final_destination'] ?? json['destination'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'bol_number': bolNumber,
    'consignee_name': consigneeName,
    'cargo_description': cargoDescription,
    'number_of_packages': numberOfPackages,
    'net_weight': netWeight,
    'gross_weight': grossWeight,
    'shipper_name': shipperName,
    'issue_date': issueDate,
    'final_destination': finalDestination,
  };

  /// Clean one-line display for mobile list item subtitles
  String get cleanSummary {
    final parts = <String>[];
    if (numberOfPackages.isNotEmpty) parts.add(numberOfPackages);
    if (netWeight.isNotEmpty) parts.add(netWeight.contains('KG') ? netWeight : '$netWeight KGS');
    if (finalDestination.isNotEmpty) parts.add(finalDestination);
    return parts.join(' • ');
  }
}
