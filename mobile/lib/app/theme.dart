import 'package:flutter/material.dart';

/// Solo-Leveling "System" palette: near-black void, electric blue, violet.
class AriseColors {
  static const bg = Color(0xFF050A14);
  static const surface = Color(0xFF0A1322);
  static const panel = Color(0xFF0D1A2E);
  static const blue = Color(0xFF4CC9F0);
  static const violet = Color(0xFF7B2CBF);
  static const violetBright = Color(0xFF9D4EDD);
  static const text = Color(0xFFE6F1FF);
  static const textDim = Color(0xFF7A8CA6);
  static const success = Color(0xFF3DDC84);
  static const warning = Color(0xFFFF9E00);
  static const danger = Color(0xFFFF4D6D);
  static const gold = Color(0xFFFFD60A);
  static const grey = Color(0xFF9BA4B5);
}

/// Difficulty / rank tier colors: E grey, D green, C blue, B violet,
/// A orange, S red, SS gold.
Color difficultyColor(String tier) {
  switch (tier.toUpperCase()) {
    case 'E':
      return AriseColors.grey;
    case 'D':
      return AriseColors.success;
    case 'C':
      return AriseColors.blue;
    case 'B':
      return AriseColors.violetBright;
    case 'A':
      return AriseColors.warning;
    case 'S':
      return AriseColors.danger;
    case 'SS':
      return AriseColors.gold;
    default:
      return AriseColors.grey;
  }
}

/// Rarity colors: COMMON grey, RARE blue, EPIC violet, LEGENDARY gold,
/// MYTHIC red.
Color rarityColor(String rarity) {
  switch (rarity.toUpperCase()) {
    case 'COMMON':
      return AriseColors.grey;
    case 'RARE':
      return AriseColors.blue;
    case 'EPIC':
      return AriseColors.violetBright;
    case 'LEGENDARY':
      return AriseColors.gold;
    case 'MYTHIC':
      return AriseColors.danger;
    default:
      return AriseColors.grey;
  }
}

ThemeData buildAriseTheme() {
  const scheme = ColorScheme.dark(
    primary: AriseColors.blue,
    secondary: AriseColors.violet,
    surface: AriseColors.surface,
    onPrimary: AriseColors.bg,
    onSecondary: AriseColors.text,
    onSurface: AriseColors.text,
    error: AriseColors.danger,
  );

  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: AriseColors.bg,
  );

  // Mono-flavored uppercase headers give the "System window" feel.
  const headerStyle = TextStyle(
    fontFamily: 'monospace',
    fontFamilyFallback: ['Courier', 'Menlo'],
    letterSpacing: 2,
    fontWeight: FontWeight.w700,
    color: AriseColors.text,
  );

  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      titleLarge: headerStyle.copyWith(fontSize: 20),
      titleMedium: headerStyle.copyWith(fontSize: 15),
      titleSmall: headerStyle.copyWith(fontSize: 12, color: AriseColors.blue),
      bodyMedium: const TextStyle(color: AriseColors.text, fontSize: 14),
      bodySmall: const TextStyle(color: AriseColors.textDim, fontSize: 12),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AriseColors.bg,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: headerStyle.copyWith(fontSize: 18, color: AriseColors.blue),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AriseColors.surface,
      indicatorColor: AriseColors.blue.withValues(alpha: 0.15),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected)
              ? AriseColors.blue
              : AriseColors.textDim,
        ),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 11,
          letterSpacing: 1,
          color: states.contains(WidgetState.selected)
              ? AriseColors.blue
              : AriseColors.textDim,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AriseColors.panel,
      labelStyle: const TextStyle(color: AriseColors.textDim, letterSpacing: 1),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AriseColors.blue.withValues(alpha: 0.25)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AriseColors.blue),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AriseColors.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AriseColors.danger),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AriseColors.blue,
        foregroundColor: AriseColors.bg,
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AriseColors.blue,
        side: BorderSide(color: AriseColors.blue.withValues(alpha: 0.5)),
        textStyle: const TextStyle(letterSpacing: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AriseColors.panel,
      contentTextStyle: const TextStyle(color: AriseColors.text),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: AriseColors.blue.withValues(alpha: 0.4)),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AriseColors.panel,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AriseColors.blue.withValues(alpha: 0.4)),
      ),
    ),
    dividerTheme: DividerThemeData(
      color: AriseColors.blue.withValues(alpha: 0.12),
    ),
  );
}
