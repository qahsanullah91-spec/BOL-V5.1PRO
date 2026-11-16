import 'dart:convert';

/// Represents a single stop along an overland/multimodal corridor
class RouteStop {
  final String id;
  final String location;
  final String locationPersian;
  final int stopOrder;
  final String transportMode;
  final String? arrivalDate;
  final String? departureDate;
  final String? notes;
  final String? customsSealNumber;

  const RouteStop({
    required this.id,
    required this.location,
    required this.locationPersian,
    required this.stopOrder,
    this.transportMode = 'truck',
    this.arrivalDate,
    this.departureDate,
    this.notes,
    this.customsSealNumber,
  });

  factory RouteStop.fromJson(Map<String, dynamic> json) {
    return RouteStop(
      id: json['id'] as String? ?? '',
      location: json['location'] as String? ?? '',
      locationPersian: json['locationPersian'] as String? ?? json['location_persian'] as String? ?? '',
      stopOrder: (json['stopOrder'] ?? json['stop_order'] ?? 0) as int,
      transportMode: json['transportMode'] as String? ?? json['transport_mode'] as String? ?? 'truck',
      arrivalDate: json['arrivalDate'] as String? ?? json['arrival_date'] as String?,
      departureDate: json['departureDate'] as String? ?? json['departure_date'] as String?,
      notes: json['notes'] as String?,
      customsSealNumber: json['customsSealNumber'] as String? ?? json['customs_seal_number'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'location': location,
      'locationPersian': locationPersian,
      'stopOrder': stopOrder,
      'transportMode': transportMode,
      'arrivalDate': arrivalDate,
      'departureDate': departureDate,
      'notes': notes,
      'customsSealNumber': customsSealNumber,
    };
  }
}

/// Core Bill of Lading (BOL) domain model for the companion app
class BillOfLading {
  final String id;
  final String bolNumber;
  final String issueDate;
  final String shipperName;
  final String? shipperAddress;
  final String consigneeName;
  final String? consigneeAddress;
  final String? notifyParty;
  final String? notifyPartyAddress;
  final String? vesselName;
  final String? voyageNumber;
  final String? portOfLoading;
  final String? portOfDischarge;
  final String? placeOfDelivery;
  final String? transitBorder;
  final String? driverName;
  final String? driverFatherName;
  final String? driverPhone;
  final double? driverRent;
  final String driverRentCurrency;
  final String? truckNumber;
  final String? containerNumber;
  final String? containerType;
  final String? sealNumber;
  final String? cargoDescription;
  final int? cartonCount;
  final double? grossWeightKg;
  final double? netWeightKg;
  final String status;
  final List<RouteStop> routes;
  final int version;
  final String updatedAt;

  const BillOfLading({
    required this.id,
    required this.bolNumber,
    required this.issueDate,
    required this.shipperName,
    this.shipperAddress,
    required this.consigneeName,
    this.consigneeAddress,
    this.notifyParty,
    this.notifyPartyAddress,
    this.vesselName,
    this.voyageNumber,
    this.portOfLoading,
    this.portOfDischarge,
    this.placeOfDelivery,
    this.transitBorder,
    this.driverName,
    this.driverFatherName,
    this.driverPhone,
    this.driverRent,
    this.driverRentCurrency = 'AFN',
    this.truckNumber,
    this.containerNumber,
    this.containerType,
    this.sealNumber,
    this.cargoDescription,
    this.cartonCount,
    this.grossWeightKg,
    this.netWeightKg,
    this.status = 'IN_TRANSIT',
    this.routes = const [],
    this.version = 1,
    required this.updatedAt,
  });

  factory BillOfLading.fromJson(Map<String, dynamic> json) {
    final rawRoutes = json['routes'] as List<dynamic>? ?? [];
    return BillOfLading(
      id: json['id'] as String? ?? '',
      bolNumber: json['bol_number'] as String? ?? json['bolNumber'] as String? ?? '',
      issueDate: json['issue_date'] as String? ?? json['issueDate'] as String? ?? '',
      shipperName: json['shipper_name'] as String? ?? json['shipperName'] as String? ?? '',
      shipperAddress: json['shipper_address'] as String? ?? json['shipperAddress'] as String?,
      consigneeName: json['consignee_name'] as String? ?? json['consigneeName'] as String? ?? '',
      consigneeAddress: json['consignee_address'] as String? ?? json['consigneeAddress'] as String?,
      notifyParty: json['notify_party'] as String? ?? json['notifyParty'] as String?,
      notifyPartyAddress: json['notify_party_address'] as String? ?? json['notifyPartyAddress'] as String?,
      vesselName: json['vessel_name'] as String? ?? json['vesselName'] as String?,
      voyageNumber: json['voyage_number'] as String? ?? json['voyageNumber'] as String?,
      portOfLoading: json['port_of_loading'] as String? ?? json['portOfLoading'] as String?,
      portOfDischarge: json['port_of_discharge'] as String? ?? json['portOfDischarge'] as String?,
      placeOfDelivery: json['place_of_delivery'] as String? ?? json['placeOfDelivery'] as String?,
      transitBorder: json['transit_border'] as String? ?? json['transitBorder'] as String?,
      driverName: json['driver_name'] as String? ?? json['driverName'] as String?,
      driverFatherName: json['driver_father_name'] as String? ?? json['driverFatherName'] as String?,
      driverPhone: json['driver_phone'] as String? ?? json['driverPhone'] as String?,
      driverRent: (json['driver_rent'] ?? json['driverRent']) != null
          ? double.tryParse(json['driver_rent']?.toString() ?? json['driverRent']?.toString() ?? '')
          : null,
      driverRentCurrency: json['driver_rent_currency'] as String? ?? json['driverRentCurrency'] as String? ?? 'AFN',
      truckNumber: json['truck_number'] as String? ?? json['truckNumber'] as String?,
      containerNumber: json['container_number'] as String? ?? json['containerNumber'] as String?,
      containerType: json['container_type'] as String? ?? json['containerType'] as String?,
      sealNumber: json['seal_number'] as String? ?? json['sealNumber'] as String?,
      cargoDescription: json['cargo_description'] as String? ?? json['cargoDescription'] as String?,
      cartonCount: (json['carton_count'] ?? json['cartonCount']) as int?,
      grossWeightKg: (json['gross_weight_kg'] ?? json['grossWeightKg']) != null
          ? double.tryParse(json['gross_weight_kg']?.toString() ?? json['grossWeightKg']?.toString() ?? '')
          : null,
      netWeightKg: (json['net_weight_kg'] ?? json['netWeightKg']) != null
          ? double.tryParse(json['net_weight_kg']?.toString() ?? json['netWeightKg']?.toString() ?? '')
          : null,
      status: json['status'] as String? ?? 'IN_TRANSIT',
      routes: rawRoutes
          .map((r) => RouteStop.fromJson(r as Map<String, dynamic>))
          .toList(),
      version: (json['version'] ?? 1) as int,
      updatedAt: json['updated_at'] as String? ?? json['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bol_number': bolNumber,
      'issue_date': issueDate,
      'shipper_name': shipperName,
      'shipper_address': shipperAddress,
      'consignee_name': consigneeName,
      'consignee_address': consigneeAddress,
      'notify_party': notifyParty,
      'notify_party_address': notifyPartyAddress,
      'vessel_name': vesselName,
      'voyage_number': voyageNumber,
      'port_of_loading': portOfLoading,
      'port_of_discharge': portOfDischarge,
      'place_of_delivery': placeOfDelivery,
      'transit_border': transitBorder,
      'driver_name': driverName,
      'driver_father_name': driverFatherName,
      'driver_phone': driverPhone,
      'driver_rent': driverRent,
      'driver_rent_currency': driverRentCurrency,
      'truck_number': truckNumber,
      'container_number': containerNumber,
      'container_type': containerType,
      'seal_number': sealNumber,
      'cargo_description': cargoDescription,
      'carton_count': cartonCount,
      'gross_weight_kg': grossWeightKg,
      'net_weight_kg': netWeightKg,
      'status': status,
      'routes': routes.map((r) => r.toJson()).toList(),
      'version': version,
      'updated_at': updatedAt,
    };
  }

  BillOfLading copyWith({
    String? status,
    String? driverPhone,
    double? driverRent,
    String? sealNumber,
    int? version,
    String? updatedAt,
  }) {
    return BillOfLading(
      id: id,
      bolNumber: bolNumber,
      issueDate: issueDate,
      shipperName: shipperName,
      shipperAddress: shipperAddress,
      consigneeName: consigneeName,
      consigneeAddress: consigneeAddress,
      notifyParty: notifyParty,
      notifyPartyAddress: notifyPartyAddress,
      vesselName: vesselName,
      voyageNumber: voyageNumber,
      portOfLoading: portOfLoading,
      portOfDischarge: portOfDischarge,
      placeOfDelivery: placeOfDelivery,
      transitBorder: transitBorder,
      driverName: driverName,
      driverFatherName: driverFatherName,
      driverPhone: driverPhone ?? this.driverPhone,
      driverRent: driverRent ?? this.driverRent,
      driverRentCurrency: driverRentCurrency,
      truckNumber: truckNumber,
      containerNumber: containerNumber,
      containerType: containerType,
      sealNumber: sealNumber ?? this.sealNumber,
      cargoDescription: cargoDescription,
      cartonCount: cartonCount,
      grossWeightKg: grossWeightKg,
      netWeightKg: netWeightKg,
      status: status ?? this.status,
      routes: routes,
      version: version ?? (this.version + 1),
      updatedAt: updatedAt ?? DateTime.now().toIso8601String(),
    );
  }
}
