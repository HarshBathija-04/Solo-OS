import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_providers.dart';
import '../../core/models/models.dart';

/// GET /v1/dashboard — composite home-screen payload.
final dashboardProvider = FutureProvider<DashboardData>((ref) async {
  final api = ref.watch(apiClientProvider);
  final json = await api.get('/v1/dashboard');
  return DashboardData.fromJson(json);
});
