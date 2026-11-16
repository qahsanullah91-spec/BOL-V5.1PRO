import 'package:flutter/material.dart';
import '../../../../domain/models/bill_of_lading.dart';
import '../view_models/bol_list_view_model.dart';
import '../../bol_detail/views/bol_detail_view.dart';

const double kLargeScreenBreakpoint = 720.0;

class BolListView extends StatefulWidget {
  final BolListViewModel viewModel;

  const BolListView({super.key, required this.viewModel});

  @override
  State<BolListView> createState() => _BolListViewState();
}

class _BolListViewState extends State<BolListView> {
  @override
  void initState() {
    super.initState();
    widget.viewModel.loadBols();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.viewModel,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(
            backgroundColor: const Color(0xFF1E3A8A),
            foregroundColor: Colors.white,
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AQ Logistics — Driver Companion',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'سیستم بارنامه و حمل و نقل بین‌المللی',
                  style: TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
            actions: [
              if (widget.viewModel.pendingOfflineCount > 0)
                TextButton.icon(
                  onPressed: () => widget.viewModel.syncOfflineQueue(),
                  icon: const Icon(Icons.sync, color: Colors.amber, size: 18),
                  label: Text(
                    '${widget.viewModel.pendingOfflineCount} Pending',
                    style: const TextStyle(color: Colors.amber, fontSize: 12),
                  ),
                ),
              IconButton(
                icon: const Icon(Icons.refresh),
                tooltip: 'Refresh / تازه سازی',
                onPressed: () => widget.viewModel.loadBols(forceRefresh: true),
              ),
            ],
          ),
          body: Column(
            children: [
              _buildSearchBar(context),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth > kLargeScreenBreakpoint) {
                      return _buildLargeScreenLayout();
                    } else {
                      return _buildMobileLayout();
                    }
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search BOL, Consignee, Driver, Truck, Container...',
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: widget.viewModel.setSearchQuery,
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: widget.viewModel.statusFilter,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'ALL', child: Text('All')),
              DropdownMenuItem(value: 'IN_TRANSIT', child: Text('Transit')),
              DropdownMenuItem(value: 'DELIVERED', child: Text('Delivered')),
              DropdownMenuItem(value: 'CUSTOMS_HOLD', child: Text('Customs')),
            ],
            onChanged: (val) {
              if (val != null) widget.viewModel.setStatusFilter(val);
            },
          ),
        ],
      ),
    );
  }

  /// Tablet & Desktop: Split View (List on left, detail on right)
  Widget _buildLargeScreenLayout() {
    final bols = widget.viewModel.filteredBols;

    return Row(
      children: [
        SizedBox(
          width: 360,
          child: _buildBolList(bols, isMasterDetail: true),
        ),
        const VerticalDivider(width: 1, color: Color(0xFFE2E8F0)),
        Expanded(
          child: widget.viewModel.selectedBol != null
              ? BolDetailView(
                  bol: widget.viewModel.selectedBol!,
                  viewModel: widget.viewModel,
                )
              : const Center(
                  child: Text('Select a Bill of Lading to inspect details'),
                ),
        ),
      ],
    );
  }

  /// Mobile: Full-width list, tap navigates to detail screen
  Widget _buildMobileLayout() {
    final bols = widget.viewModel.filteredBols;
    return _buildBolList(bols, isMasterDetail: false);
  }

  Widget _buildBolList(List<BillOfLading> bols, {required bool isMasterDetail}) {
    if (widget.viewModel.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (bols.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(
              'No Bills of Lading Found',
              style: TextStyle(fontSize: 15, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: bols.length,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemBuilder: (context, idx) {
        final item = bols[idx];
        final isSelected = isMasterDetail && widget.viewModel.selectedBol?.id == item.id;

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: isSelected ? 2 : 0,
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(
              color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFFE2E8F0),
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(10),
            onTap: () {
              widget.viewModel.selectBol(item);
              if (!isMasterDetail) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => BolDetailView(
                      bol: item,
                      viewModel: widget.viewModel,
                    ),
                  ),
                );
              }
            },
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.bolNumber,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      _buildStatusBadge(item.status),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.consigneeName,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.local_shipping_outlined, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${item.driverName ?? 'No driver'} • ${item.truckNumber ?? 'No truck'}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (item.transitBorder != null && item.transitBorder!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Border: ${item.transitBorder}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF0369A1)),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF15803D);
        break;
      case 'CUSTOMS_HOLD':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
        break;
      case 'IN_TRANSIT':
      default:
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1E40AF);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
