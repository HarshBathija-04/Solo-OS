import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../../core/models/models.dart';
import '../../core/widgets/award_feedback.dart';
import '../../core/widgets/widgets.dart';
import 'habits_provider.dart';

class HabitsScreen extends ConsumerWidget {
  const HabitsScreen({super.key});

  ShadowStatus? _shadowFor(List<ShadowStatus> shadow, String key) {
    for (final s in shadow) {
      if (s.key == key) return s;
    }
    return null;
  }

  Future<void> _log(
      BuildContext context, WidgetRef ref, String key, String result) async {
    try {
      await ref.read(habitsActionsProvider).log(key, result);
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = ref.watch(habitsProvider);
    final recovery = ref.watch(recoveryProvider);
    final streaks = ref.watch(streaksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('HABITS & SHADOW')),
      body: RefreshIndicator(
        color: AriseColors.blue,
        onRefresh: () async {
          ref.invalidate(habitsProvider);
          ref.invalidate(recoveryProvider);
          ref.invalidate(streaksProvider);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            // Open recovery quest banner
            recovery.maybeWhen(
              data: (rq) => rq == null
                  ? const SizedBox.shrink()
                  : _RecoveryBanner(quest: rq),
              orElse: () => const SizedBox.shrink(),
            ),
            // BUILD habits
            AsyncValueView<HabitsData>(
              value: habits,
              onRetry: () => ref.invalidate(habitsProvider),
              data: (data) => Column(
                children: [
                  SystemPanel(
                    title: 'BUILD HABITS',
                    child: data.buildHabits.isEmpty
                        ? Text('No build habits configured.',
                            style: Theme.of(context).textTheme.bodySmall)
                        : Column(
                            children: [
                              for (final h in data.buildHabits)
                                _BuildHabitRow(
                                  habit: h,
                                  onLog: (result) =>
                                      _log(context, ref, h.key, result),
                                ),
                            ],
                          ),
                  ),
                  SystemPanel(
                    title: 'SHADOW SYSTEM',
                    glowColor: AriseColors.violetBright,
                    child: data.shadowHabits.isEmpty
                        ? Text('No shadow habits tracked.',
                            style: Theme.of(context).textTheme.bodySmall)
                        : Column(
                            children: [
                              for (final h in data.shadowHabits)
                                _ShadowHabitRow(
                                  habit: h,
                                  shadow: _shadowFor(data.shadow, h.key),
                                  onLog: (result) =>
                                      _log(context, ref, h.key, result),
                                  onUrge: () =>
                                      _showUrgeSheet(context, ref, h.key),
                                ),
                            ],
                          ),
                  ),
                ],
              ),
            ),
            // Streaks
            SystemPanel(
              title: 'STREAKS',
              glowColor: AriseColors.warning,
              child: AsyncValueView<List<StreakItem>>(
                value: streaks,
                onRetry: () => ref.invalidate(streaksProvider),
                data: (items) => items.isEmpty
                    ? Text('No streaks yet.',
                        style: Theme.of(context).textTheme.bodySmall)
                    : Column(
                        children: [
                          for (final s in items)
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  const Icon(Icons.local_fire_department,
                                      size: 18, color: AriseColors.warning),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(s.title,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium),
                                  ),
                                  Text(
                                    '${s.current}',
                                    style: const TextStyle(
                                      color: AriseColors.warning,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    '  /  best ${s.longest}',
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showUrgeSheet(BuildContext context, WidgetRef ref, String habitKey) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AriseColors.panel,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
        ),
        child: _UrgeSheet(habitKey: habitKey),
      ),
    );
  }
}

class _BuildHabitRow extends StatelessWidget {
  const _BuildHabitRow({required this.habit, required this.onLog});

  final HabitItem habit;
  final void Function(String result) onLog;

  @override
  Widget build(BuildContext context) {
    final today = habit.todayLog;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(
            child: Text(habit.title,
                style: Theme.of(context).textTheme.bodyMedium),
          ),
          if (today != null)
            Text(
              today.result,
              style: TextStyle(
                color: today.result == 'DONE'
                    ? AriseColors.success
                    : AriseColors.danger,
                fontWeight: FontWeight.w700,
                fontSize: 12,
                letterSpacing: 1,
              ),
            )
          else ...[
            IconButton(
              icon: const Icon(Icons.check_circle_outline,
                  color: AriseColors.success),
              tooltip: 'Done',
              onPressed: () => onLog('DONE'),
            ),
            IconButton(
              icon: const Icon(Icons.cancel_outlined,
                  color: AriseColors.danger),
              tooltip: 'Missed',
              onPressed: () => onLog('MISSED'),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShadowHabitRow extends StatelessWidget {
  const _ShadowHabitRow({
    required this.habit,
    required this.shadow,
    required this.onLog,
    required this.onUrge,
  });

  final HabitItem habit;
  final ShadowStatus? shadow;
  final void Function(String result) onLog;
  final VoidCallback onUrge;

  @override
  Widget build(BuildContext context) {
    final today = habit.todayLog;
    final streak = shadow?.streak;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(habit.title,
                    style: Theme.of(context).textTheme.bodyMedium),
              ),
              if (streak != null)
                StatChip(
                  icon: Icons.shield_outlined,
                  label: '${streak.current}d clean',
                  color: AriseColors.violetBright,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (today != null)
                Text(
                  'TODAY: ${today.result}',
                  style: TextStyle(
                    color: today.result == 'CLEAN'
                        ? AriseColors.success
                        : AriseColors.danger,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    letterSpacing: 1,
                  ),
                )
              else ...[
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AriseColors.success,
                      side: BorderSide(
                          color: AriseColors.success.withValues(alpha: 0.5)),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                    ),
                    onPressed: () => onLog('CLEAN'),
                    child: const Text('CLEAN', style: TextStyle(fontSize: 11)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AriseColors.danger,
                      side: BorderSide(
                          color: AriseColors.danger.withValues(alpha: 0.5)),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                    ),
                    onPressed: () => onLog('RELAPSE'),
                    child:
                        const Text('RELAPSE', style: TextStyle(fontSize: 11)),
                  ),
                ),
              ],
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: onUrge,
                icon: const Icon(Icons.psychology_alt_outlined,
                    size: 16, color: AriseColors.blue),
                label: const Text(
                  'URGE',
                  style: TextStyle(fontSize: 11, color: AriseColors.blue),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RecoveryBanner extends ConsumerStatefulWidget {
  const _RecoveryBanner({required this.quest});

  final RecoveryQuest quest;

  @override
  ConsumerState<_RecoveryBanner> createState() => _RecoveryBannerState();
}

class _RecoveryBannerState extends ConsumerState<_RecoveryBanner> {
  late List<bool> _checked;
  bool _completing = false;

  @override
  void initState() {
    super.initState();
    _checked = List.filled(widget.quest.steps.length, false);
  }

  Future<void> _complete() async {
    setState(() => _completing = true);
    try {
      await ref
          .read(habitsActionsProvider)
          .completeRecovery(widget.quest.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('RECOVERY QUEST COMPLETE')),
        );
      }
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final allChecked = _checked.every((c) => c);
    return SystemPanel(
      title: 'RECOVERY QUEST',
      glowColor: AriseColors.danger,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.quest.reason,
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          for (var i = 0; i < widget.quest.steps.length; i++)
            CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: AriseColors.danger,
              value: _checked[i],
              onChanged: (v) => setState(() => _checked[i] = v ?? false),
              title: Text(
                widget.quest.steps[i],
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      decoration:
                          _checked[i] ? TextDecoration.lineThrough : null,
                    ),
              ),
            ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style:
                  FilledButton.styleFrom(backgroundColor: AriseColors.danger),
              onPressed: allChecked && !_completing ? _complete : null,
              child: _completing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('COMPLETE RECOVERY'),
            ),
          ),
        ],
      ),
    );
  }
}

class _UrgeSheet extends ConsumerStatefulWidget {
  const _UrgeSheet({required this.habitKey});

  final String habitKey;

  @override
  ConsumerState<_UrgeSheet> createState() => _UrgeSheetState();
}

class _UrgeSheetState extends ConsumerState<_UrgeSheet> {
  final _trigger = TextEditingController();
  final _mood = TextEditingController();
  final _reason = TextEditingController();
  bool _resisted = true;
  bool _saving = false;

  @override
  void dispose() {
    _trigger.dispose();
    _mood.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      await ref.read(habitsActionsProvider).logUrge(
            habitKey: widget.habitKey,
            resisted: _resisted,
            trigger: _trigger.text.trim(),
            mood: _mood.text.trim(),
            reason: _reason.text.trim(),
          );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('LOG URGE', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeColor: AriseColors.success,
            title: Text(
              _resisted ? 'RESISTED' : 'GAVE IN',
              style: TextStyle(
                color:
                    _resisted ? AriseColors.success : AriseColors.danger,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
                fontSize: 13,
              ),
            ),
            value: _resisted,
            onChanged: (v) => setState(() => _resisted = v),
          ),
          TextField(
            controller: _trigger,
            decoration:
                const InputDecoration(labelText: 'TRIGGER (OPTIONAL)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _mood,
            decoration: const InputDecoration(labelText: 'MOOD (OPTIONAL)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reason,
            decoration:
                const InputDecoration(labelText: 'NOTES (OPTIONAL)'),
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _submit,
            child: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('LOG'),
          ),
        ],
      ),
    );
  }
}
