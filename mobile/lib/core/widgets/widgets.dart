import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';

/// Glowing bordered card — the "System window" panel.
class SystemPanel extends StatelessWidget {
  const SystemPanel({
    super.key,
    required this.child,
    this.title,
    this.glowColor,
    this.padding = const EdgeInsets.all(14),
    this.margin = const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  });

  final Widget child;
  final String? title;
  final Color? glowColor;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    final glow = glowColor ?? AriseColors.blue;
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: AriseColors.panel,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: glow.withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: glow.withValues(alpha: 0.12),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      ),
      child: title == null
          ? child
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title!.toUpperCase(),
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(color: glow),
                ),
                const SizedBox(height: 10),
                child,
              ],
            ),
    );
  }
}

/// XP progress bar with current/next labels.
class XpBar extends StatelessWidget {
  const XpBar({
    super.key,
    required this.currentXp,
    required this.xpForNext,
    this.height = 10,
  });

  final int currentXp;
  final int xpForNext;
  final double height;

  @override
  Widget build(BuildContext context) {
    final progress =
        xpForNext > 0 ? (currentXp / xpForNext).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: Stack(
            children: [
              Container(height: height, color: AriseColors.surface),
              FractionallySizedBox(
                widthFactor: progress,
                child: Container(
                  height: height,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AriseColors.blue, AriseColors.violetBright],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '$currentXp / $xpForNext XP',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

/// Small labelled stat chip (coins, rank, streak…).
class StatChip extends StatelessWidget {
  const StatChip({
    super.key,
    required this.icon,
    required this.label,
    this.color,
  });

  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AriseColors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: c),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: c,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Difficulty badge (E–SS) with tier color.
class DifficultyBadge extends StatelessWidget {
  const DifficultyBadge({super.key, required this.tier});

  final String tier;

  @override
  Widget build(BuildContext context) {
    final c = difficultyColor(tier);
    return Container(
      width: 34,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: c.withValues(alpha: 0.12),
        border: Border.all(color: c, width: 1.5),
        boxShadow: [
          BoxShadow(color: c.withValues(alpha: 0.35), blurRadius: 8),
        ],
      ),
      child: Text(
        tier.toUpperCase(),
        style: TextStyle(
          color: c,
          fontWeight: FontWeight.w800,
          fontSize: tier.length > 1 ? 11 : 14,
        ),
      ),
    );
  }
}

/// Standard loading / error / retry wrapper around a Riverpod AsyncValue.
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(color: AriseColors.blue),
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded,
                  color: AriseColors.danger, size: 40),
              const SizedBox(height: 12),
              Text(
                'SYSTEM ERROR',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(color: AriseColors.danger),
              ),
              const SizedBox(height: 8),
              Text(
                e.toString(),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                OutlinedButton(onPressed: onRetry, child: const Text('RETRY')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
