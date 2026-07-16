import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../../core/models/models.dart';
import '../../core/widgets/award_feedback.dart';
import '../../core/widgets/widgets.dart';
import 'quests_provider.dart';

class QuestsScreen extends ConsumerWidget {
  const QuestsScreen({super.key});

  Future<void> _complete(
      BuildContext context, WidgetRef ref, QuestItem quest, String result) async {
    try {
      final award =
          await ref.read(questsActionsProvider).complete(quest.id, result);
      if (context.mounted) showAwardFeedback(context, award);
    } catch (e) {
      if (context.mounted) showErrorSnack(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quests = ref.watch(questsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('DAILY QUESTS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: AriseColors.blue),
            tooltip: 'Generate quests',
            onPressed: () async {
              try {
                await ref.read(questsActionsProvider).generate();
              } catch (e) {
                if (context.mounted) showErrorSnack(context, e);
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AriseColors.blue,
        onRefresh: () async => ref.invalidate(questsProvider),
        child: AsyncValueView<List<QuestItem>>(
          value: quests,
          onRetry: () => ref.invalidate(questsProvider),
          data: (items) => items.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 120),
                    Center(
                      child: Text(
                        'NO QUESTS TODAY.\nUSE THE GENERATE BUTTON ABOVE.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: AriseColors.textDim, letterSpacing: 2),
                      ),
                    ),
                  ],
                )
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: items.length,
                  itemBuilder: (context, i) => _QuestCard(
                    quest: items[i],
                    onAction: (result) =>
                        _complete(context, ref, items[i], result),
                  ),
                ),
        ),
      ),
    );
  }
}

class _QuestCard extends StatelessWidget {
  const _QuestCard({required this.quest, required this.onAction});

  final QuestItem quest;
  final void Function(String result) onAction;

  @override
  Widget build(BuildContext context) {
    final resolved = !quest.isActive;
    final tierColor = difficultyColor(quest.difficulty);

    return SystemPanel(
      glowColor: resolved ? AriseColors.textDim : tierColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              DifficultyBadge(tier: quest.difficulty),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      quest.title,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            decoration: quest.status == 'COMPLETED'
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                    ),
                    if (quest.description.isNotEmpty)
                      Text(
                        quest.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              StatChip(
                icon: Icons.bolt,
                label: '${quest.baseXp} XP',
                color: AriseColors.blue,
              ),
              const SizedBox(width: 6),
              if (quest.estMinutes > 0)
                StatChip(
                  icon: Icons.schedule,
                  label: '${quest.estMinutes}m',
                  color: AriseColors.textDim,
                ),
              const Spacer(),
              if (resolved)
                Text(
                  quest.status,
                  style: TextStyle(
                    color: quest.status == 'COMPLETED'
                        ? AriseColors.success
                        : quest.status == 'FAILED'
                            ? AriseColors.danger
                            : AriseColors.warning,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
          if (!resolved) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AriseColors.success,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    onPressed: () => onAction('COMPLETED'),
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
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    onPressed: () => onAction('PARTIAL'),
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
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    onPressed: () => onAction('FAILED'),
                    child: const Text('FAIL', style: TextStyle(fontSize: 11)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
