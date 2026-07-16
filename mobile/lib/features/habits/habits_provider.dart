import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_providers.dart';
import '../../core/models/models.dart';
import '../dashboard/dashboard_provider.dart';

class HabitsData {
  HabitsData({required this.habits, required this.shadow});

  final List<HabitItem> habits;
  final List<ShadowStatus> shadow;

  List<HabitItem> get buildHabits =>
      habits.where((h) => !h.isShadow).toList();
  List<HabitItem> get shadowHabits =>
      habits.where((h) => h.isShadow).toList();
}

/// GET /v1/habits → {habits, shadow}
final habitsProvider = FutureProvider<HabitsData>((ref) async {
  final api = ref.watch(apiClientProvider);
  final json = await api.get('/v1/habits');
  return HabitsData(
    habits: (json['habits'] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(HabitItem.fromJson)
        .toList(),
    shadow: (json['shadow'] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ShadowStatus.fromJson)
        .toList(),
  );
});

/// GET /v1/recovery/open → {recovery} (nullable)
final recoveryProvider = FutureProvider<RecoveryQuest?>((ref) async {
  final api = ref.watch(apiClientProvider);
  final json = await api.get('/v1/recovery/open');
  final rec = json['recovery'];
  if (rec is Map<String, dynamic>) return RecoveryQuest.fromJson(rec);
  return null;
});

/// GET /v1/streaks → {streaks}
final streaksProvider = FutureProvider<List<StreakItem>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final json = await api.get('/v1/streaks');
  return (json['streaks'] as List? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(StreakItem.fromJson)
      .toList();
});

class HabitsActions {
  HabitsActions(this._ref);
  final Ref _ref;

  /// result: DONE | MISSED | CLEAN | RELAPSE
  Future<void> log(String habitKey, String result) async {
    await _ref.read(apiClientProvider).post('/v1/habits/log', body: {
      'habitKey': habitKey,
      'result': result,
    });
    _invalidate();
    if (result == 'RELAPSE') _ref.invalidate(recoveryProvider);
  }

  Future<void> logUrge({
    required String habitKey,
    required bool resisted,
    String? trigger,
    String? mood,
    String? reason,
  }) async {
    await _ref.read(apiClientProvider).post('/v1/urges', body: {
      'habitKey': habitKey,
      'resisted': resisted,
      if (trigger != null && trigger.isNotEmpty) 'trigger': trigger,
      if (mood != null && mood.isNotEmpty) 'mood': mood,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
    _invalidate();
  }

  Future<void> completeRecovery(String id) async {
    await _ref.read(apiClientProvider).post('/v1/recovery/$id/complete');
    _ref.invalidate(recoveryProvider);
    _invalidate();
  }

  void _invalidate() {
    _ref.invalidate(habitsProvider);
    _ref.invalidate(streaksProvider);
    _ref.invalidate(dashboardProvider);
  }
}

final habitsActionsProvider = Provider<HabitsActions>(HabitsActions.new);
