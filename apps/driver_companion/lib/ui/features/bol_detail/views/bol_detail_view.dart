import 'package:flutter/material.dart';
import '../../../../domain/models/bill_of_lading.dart';
import '../view_models/bol_list_view_model.dart';

class BolDetailView extends StatelessWidget {
  final BillOfLading bol;
  final BolListViewModel viewModel;

  const BolDetailView({
    super.key,
    required this.bol,
    required this.viewModel,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          bol.bolNumber.isNotEmpty ? bol.bolNumber : 'Bill of Lading Details',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          _buildStatusDropdown(context),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeaderCard(context),
            const SizedBox(height: 16),
            _buildDriverAndTruckCard(context),
            const SizedBox(height: 16),
            _buildCargoCard(context),
            const SizedBox(height: 16),
            _buildRouteStopsCard(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusDropdown(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12.0),
      child: PopupMenuButton<String>(
        initialValue: bol.status,
        onSelected: (status) => viewModel.updateStatus(bol, status),
        itemBuilder: (context) => [
          const PopupMenuItem(value: 'IN_TRANSIT', child: Text('🚚 In Transit / در حال انتقال')),
          const PopupMenuItem(value: 'CUSTOMS_HOLD', child: Text('🛂 Customs Hold / گمرک')),
          const PopupMenuItem(value: 'DELIVERED', child: Text('✅ Delivered / تحویل داده شد')),
          const PopupMenuItem(value: 'DISCHARGED', child: Text('📦 Discharged / تخلیه شد')),
        ],
        child: Chip(
          label: Text(
            bol.status,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
          ),
          backgroundColor: _getStatusColor(bol.status),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.emerald;
      case 'CUSTOMS_HOLD':
        return Colors.amber.shade800;
      case 'IN_TRANSIT':
      default:
        return const Color(0xFF1E3A8A); // Brand Blue
    }
  }

  Widget _buildHeaderCard(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'BOL #${bol.bolNumber}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                Text(
                  bol.issueDate,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              ],
            ),
            const Divider(height: 24),
            _buildInfoRow('Consignee / گیرنده:', bol.consigneeName),
            const SizedBox(height: 8),
            _buildInfoRow('Shipper / فرستنده:', bol.shipperName),
            if (bol.transitBorder != null && bol.transitBorder!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow('Transit Border / مرز ترانزیتی:', bol.transitBorder!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDriverAndTruckCard(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Driver & Transport Information / مشخصات راننده و باربری',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Driver Name / نام راننده:', bol.driverName ?? 'N/A'),
            if (bol.driverFatherName != null) ...[
              const SizedBox(height: 8),
              _buildInfoRow('Father Name / نام پدر:', bol.driverFatherName!),
            ],
            if (bol.driverPhone != null) ...[
              const SizedBox(height: 8),
              _buildInfoRow('Phone / تماس:', bol.driverPhone!),
            ],
            const SizedBox(height: 8),
            _buildInfoRow('Truck Plate / نمبر پلیت:', bol.truckNumber ?? 'N/A'),
            const SizedBox(height: 8),
            _buildInfoRow(
              'Driver Rent / کرایه موتر:',
              bol.driverRent != null
                  ? '${bol.driverRent!.toStringAsFixed(0)} ${bol.driverRentCurrency}'
                  : 'N/A',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCargoCard(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cargo & Container / معلومات بار و کانتینر',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Description / شرح کالا:', bol.cargoDescription ?? 'General Cargo'),
            const SizedBox(height: 8),
            _buildInfoRow('Container No / کانتینر:', bol.containerNumber ?? 'N/A'),
            const SizedBox(height: 8),
            _buildInfoRow('Seal Number / نمبر مهر و موم:', bol.sealNumber ?? 'N/A'),
            const SizedBox(height: 8),
            _buildInfoRow(
              'Gross / Net Weight:',
              '${bol.grossWeightKg?.toStringAsFixed(0) ?? '-'} kg / ${bol.netWeightKg?.toStringAsFixed(0) ?? '-'} kg',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteStopsCard(BuildContext context) {
    if (bol.routes.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Multimodal Route Corridor / مسیر ترانزیتی',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
            ),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: bol.routes.length,
              separatorBuilder: (_, __) => const Divider(height: 16),
              itemBuilder: (context, idx) {
                final stop = bol.routes[idx];
                return Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: const Color(0xFF1E3A8A),
                      child: Text(
                        '${idx + 1}',
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stop.location,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          if (stop.locationPersian.isNotEmpty)
                            Text(
                              stop.locationPersian,
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                        ],
                      ),
                    ),
                    Chip(
                      label: Text(stop.transportMode, style: const TextStyle(fontSize: 11)),
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 150,
          child: Text(
            label,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
          ),
        ),
      ],
    );
  }
}
