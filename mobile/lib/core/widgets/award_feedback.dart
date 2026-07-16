import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../models/models.dart';

/// Shows "+X XP" snackbar and, if the award leveled the player up, the
/// System-style level-up dialog. Call after any successful mutation.
void showAwardFeedback(BuildContext context, AwardResult award) {
  final parts = <String>[
    if (award.xpAwarded > 0) '+${award.xpAwarded} XP',
    if (award.coinsAwarded > 0) '+${award.coinsAwarded} coins',
  ];
  if (parts.isNotEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          parts.join('  ·  '),
          style: const TextStyle(
            color: AriseColors.blue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  if (award.leveledUp) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Column(
          children: [
            const Icon(Icons.arrow_upward_rounded,
                color: AriseColors.gold, size: 42),
            const SizedBox(height: 8),
            Text(
              'LEVEL UP',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(color: AriseColors.gold),
            ),
          ],
        ),
        content: Text(
          'You have reached Level ${award.newLevel}'
          '${award.newRank.isNotEmpty ? ' — ${award.newRank}' : ''}.',
          textAlign: TextAlign.center,
        ),
        actions: [
          Center(
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('ARISE'),
            ),
          ),
        ],
      ),
    );
  }
}

void showErrorSnack(BuildContext context, Object error) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        error.toString(),
        style: const TextStyle(color: AriseColors.danger),
      ),
    ),
  );
}
