import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_providers.dart';
import '../../core/models/models.dart';
import '../dashboard/dashboard_provider.dart';

/// GET /v1/quests/today
final questsProvider = FutureProvider<List<QuestItem>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final json = await api.get('/v1/quests/today');
  return (json['quests'] as List? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(QuestItem.fromJson)
      .toList();
});

/// Quest mutations. Invalidate quests + dashboard on success — don't wait
/// for realtime.
class QuestsActions {
  QuestsActions(this._ref);
  final Ref _ref;

  Future<AwardResult> complete(String questId, String result) async {
    final api = _ref.read(apiClientProvider);
    final json = await api
        .post('/v1/quests/$questId/complete', body: {'result': result});
    _invalidate();
    return AwardResult.fromJson(
        (json['award'] as Map<String, dynamic>?) ?? const {});
  }

  Future<void> generate() async {
    await _ref.read(apiClientProvider).post('/v1/quests/generate');
    _invalidate();
  }

  void _invalidate() {
    _ref.invalidate(questsProvider);
    _ref.invalidate(dashboardProvider);
  }
}

final questsActionsProvider = Provider<QuestsActions>(QuestsActions.new);
