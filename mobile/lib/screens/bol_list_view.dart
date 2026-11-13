import 'package:flutter/material.dart';
import '../models/bol_record.dart';
import '../services/bol_api_service.dart';

class BolListView extends StatefulWidget {
  const BolListView({super.key});

  @override
  State<BolListView> createState() => _BolListViewState();
}

class _BolListViewState extends State<BolListView> {
  late Future<BolApiResponse> _futureResponse;
  int _currentPage = 1;
  static const int _pageSize = 20;
  bool _isServerHealthy = false;

  @override
  void initState() {
    super.initState();
    _checkServer();
    _loadPage(_currentPage);
  }

  void _checkServer() async {
    final healthy = await BolApiService.checkHealth();
    if (mounted) {
      setState(() => _isServerHealthy = healthy);
    }
  }

  void _loadPage(int page) {
    setState(() {
      _currentPage = page;
      _futureResponse = BolApiService.fetchBols(page: _currentPage, limit: _pageSize);
    });
  }

  Future<void> _handleRefresh() async {
    _checkServer();
    _loadPage(_currentPage);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sky Ariana BOL',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isServerHealthy ? Colors.greenAccent : Colors.amberAccent,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _isServerHealthy ? 'Server Connected (Port 3001)' : 'Connecting...',
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _handleRefresh,
          ),
        ],
      ),
      body: FutureBuilder<BolApiResponse>(
        future: _futureResponse,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_off, size: 64, color: Colors.redAccent),
                    const SizedBox(height: 16),
                    Text(
                      'Connection Error',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: _handleRefresh,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            );
          }

          final apiResp = snapshot.data;
          final bols = apiResp?.bols ?? [];

          if (bols.isEmpty) {
            return const Center(
              child: Text(
                'No Bill of Lading records found.',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _handleRefresh,
            child: Column(
              children: [
                // Summary Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: Colors.blueGrey.withOpacity(0.08),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total: ${apiResp?.total ?? bols.length} BOL Records',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        'Page ${apiResp?.page ?? 1} of ${apiResp?.totalPages ?? 1}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),

                // Shipment Records List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(8),
                    itemCount: bols.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final bol = bols[index];
                      return Card(
                        elevation: 1.5,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: CircleAvatar(
                            backgroundColor: Colors.blue.shade100,
                            foregroundColor: Colors.blue.shade900,
                            child: const Icon(Icons.assignment_outlined),
                          ),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                bol.bolNumber,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              if (bol.issueDate.isNotEmpty)
                                Text(
                                  bol.issueDate,
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(
                                'Consignee: ${bol.consigneeName.isNotEmpty ? bol.consigneeName : "N/A"}',
                                style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                bol.cargoDescription,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, color: Colors.black87),
                              ),
                              if (bol.cleanSummary.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  bol.cleanSummary,
                                  style: TextStyle(fontSize: 11, color: Colors.blueGrey.shade700, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Pagination Buttons
                if ((apiResp?.totalPages ?? 1) > 1)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          offset: const Offset(0, -2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        ElevatedButton.icon(
                          onPressed: _currentPage > 1 ? () => _loadPage(_currentPage - 1) : null,
                          icon: const Icon(Icons.chevron_left),
                          label: const Text('Previous'),
                        ),
                        Text(
                          'Page $_currentPage of ${apiResp?.totalPages}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        ElevatedButton.icon(
                          onPressed: _currentPage < (apiResp?.totalPages ?? 1)
                              ? () => _loadPage(_currentPage + 1)
                              : null,
                          icon: const Icon(Icons.chevron_right),
                          label: const Text('Next'),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
