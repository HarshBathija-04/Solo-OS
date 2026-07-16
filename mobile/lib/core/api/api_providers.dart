import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';

/// Single shared API client instance.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
