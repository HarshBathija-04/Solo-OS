import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../../core/models/models.dart';
import '../../core/widgets/award_feedback.dart';
import '../../core/widgets/widgets.dart';
import 'focus_controller.dart';

const _categories = [
  'GATE',
  'DSA',
  'AIML',
  'FULLSTACK',
  'DATASCIENCE',
  'SYSTEMDESIGN',
  'PROJECT',
];

const _minuteOptions = [15, 25, 45, 60, 90, 120];

class FocusScreen extends ConsumerStatefulWidget {
  const FocusScreen({super.key});

  @override
  ConsumerState<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends ConsumerState<FocusScreen> {
  String _category = 'DSA';
  int _minutes = 25;
  bool _starting = false;

  Future<void> _start() async {
    setState(() => _starting = true);
    try {
      await ref
          .read(focusControllerProvider.notifier)
          .start(category: _category, plannedMinutes: _minutes);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _finish(String result) async {
    try {
      final award =
          await ref.read(focusControllerProvider.notifier).finish(result);
      if (mounted) showAwardFeedback(context, award);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    }
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final focus = ref.watch(focusControllerProvider);
    final today = ref.watch(focusTodayProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('FOCUS GATE')),
      body: RefreshIndicator(
        color: AriseColors.blue,
        onRefresh: () async => ref.invalidate(focusTodayProvider),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            focus.active
                ? _ActiveSession(
                    state: focus,
                    fmt: _fmt,
                    onComplete: () => _finish('COMPLETE'),
                    onPartial: () => _finish('PARTIAL'),
                    onAbandon: () => _finish('ABANDONED'),
                  )
                : _SetupPanel(
                    category: _category,
                    minutes: _minutes,
                    starting: _starting,
                    onCategory: (c) => setState(() => _category = c),
                    onMinutes: (m) => setState(() => _minutes = m),
                    onStart: _start,
                  ),
            SystemPanel(
              title: "TODAY'S SESSIONS",
              glowColor: AriseColors.violetBright,
              child: AsyncValueView<List<FocusSession>>(
                value: today,
                onRetry: () => ref.invalidate(focusTodayProvider),
                data: (sessions) => sessions.isEmpty
                    ? Text('No sessions yet — enter the gate.',
                        style: Theme.of(context).textTheme.bodySmall)
                    : Column(
                        children: [
                          for (final s in sessions)
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  Icon(
                                    s.result == 'COMPLETE'
                                        ? Icons.check_circle
                                        : s.result == 'PARTIAL'
                                            ? Icons.timelapse
                                            : s.result == 'ABANDONED'
                                                ? Icons.cancel
                                                : Icons.play_circle_outline,
                                    size: 18,
                                    color: s.result == 'COMPLETE'
                                        ? AriseColors.success
                                        : s.result == 'PARTIAL'
                                            ? AriseColors.warning
                                            : s.result == 'ABANDONED'
                                                ? AriseColors.danger
                                                : AriseColors.blue,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(s.category,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium),
                                  ),
                                  Text(
                                    '${s.actualMin}/${s.plannedMin}m',
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    '+${s.xpAwarded} XP',
                                    style: const TextStyle(
                                        color: AriseColors.blue,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700),
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
}

class _SetupPanel extends StatelessWidget {
  const _SetupPanel({
    required this.category,
    required this.minutes,
    required this.starting,
    required this.onCategory,
    required this.onMinutes,
    required this.onStart,
  });

  final String category;
  final int minutes;
  final bool starting;
  final ValueChanged<String> onCategory;
  final ValueChanged<int> onMinutes;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return SystemPanel(
      title: 'OPEN A GATE',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('CATEGORY', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final c in _categories)
                ChoiceChip(
                  label: Text(c, style: const TextStyle(fontSize: 11)),
                  selected: c == category,
                  selectedColor: AriseColors.blue.withValues(alpha: 0.25),
                  backgroundColor: AriseColors.surface,
                  labelStyle: TextStyle(
                    color: c == category
                        ? AriseColors.blue
                        : AriseColors.textDim,
                  ),
                  side: BorderSide(
                    color: c == category
                        ? AriseColors.blue
                        : AriseColors.textDim.withValues(alpha: 0.3),
                  ),
                  onSelected: (_) => onCategory(c),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text('PLANNED MINUTES', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            children: [
              for (final m in _minuteOptions)
                ChoiceChip(
                  label: Text('${m}m', style: const TextStyle(fontSize: 11)),
                  selected: m == minutes,
                  selectedColor:
                      AriseColors.violetBright.withValues(alpha: 0.25),
                  backgroundColor: AriseColors.surface,
                  labelStyle: TextStyle(
                    color: m == minutes
                        ? AriseColors.violetBright
                        : AriseColors.textDim,
                  ),
                  side: BorderSide(
                    color: m == minutes
                        ? AriseColors.violetBright
                        : AriseColors.textDim.withValues(alpha: 0.3),
                  ),
                  onSelected: (_) => onMinutes(m),
                ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: starting ? null : onStart,
              icon: starting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.play_arrow),
              label: const Text('ENTER FOCUS'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveSession extends StatelessWidget {
  const _ActiveSession({
    required this.state,
    required this.fmt,
    required this.onComplete,
    required this.onPartial,
    required this.onAbandon,
  });

  final FocusState state;
  final String Function(Duration) fmt;
  final VoidCallback onComplete;
  final VoidCallback onPartial;
  final VoidCallback onAbandon;

  @override
  Widget build(BuildContext context) {
    final progress = state.planned.inSeconds > 0
        ? (state.elapsed.inSeconds / state.planned.inSeconds).clamp(0.0, 1.0)
        : 0.0;
    final color = state.overtime ? AriseColors.gold : AriseColors.blue;

    return SystemPanel(
      title: 'GATE OPEN  ·  ${state.category}',
      glowColor: color,
      child: Column(
        children: [
          const SizedBox(height: 8),
          SizedBox(
            width: 180,
            height: 180,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 8,
                  color: color,
                  backgroundColor: AriseColors.surface,
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        fmt(state.elapsed),
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'monospace',
                          fontFamilyFallback: const ['Courier'],
                          color: color,
                        ),
                      ),
                      Text(
                        state.overtime
                            ? 'OVERTIME'
                            : '${fmt(state.remaining)} LEFT',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  style:
                      FilledButton.styleFrom(backgroundColor: AriseColors.success),
                  onPressed: onComplete,
                  child: const Text('COMPLETE', style: TextStyle(fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AriseColors.warning,
                    side: BorderSide(
                        color: AriseColors.warning.withValues(alpha: 0.5)),
                  ),
                  onPressed: onPartial,
                  child: const Text('PARTIAL', style: TextStyle(fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AriseColors.danger,
                    side: BorderSide(
                        color: AriseColors.danger.withValues(alpha: 0.5)),
                  ),
                  onPressed: onAbandon,
                  child: const Text('ABANDON', style: TextStyle(fontSize: 11)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
