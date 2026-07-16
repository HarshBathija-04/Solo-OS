/// Helpers for parsing API JSON that may arrive in camelCase (view models)
/// or snake_case (raw Supabase rows).
library;

/// Return the first non-null value among [keys] in [json].
Object? pick(Map<String, dynamic> json, List<String> keys) {
  for (final k in keys) {
    final v = json[k];
    if (v != null) return v;
  }
  return null;
}

int pickInt(Map<String, dynamic> json, List<String> keys,
    {int fallback = 0}) {
  final v = pick(json, keys);
  if (v is int) return v;
  if (v is num) return v.round();
  if (v is String) return int.tryParse(v) ?? fallback;
  return fallback;
}

double pickDouble(Map<String, dynamic> json, List<String> keys,
    {double fallback = 0}) {
  final v = pick(json, keys);
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? fallback;
  return fallback;
}

String pickString(Map<String, dynamic> json, List<String> keys,
    {String fallback = ''}) {
  final v = pick(json, keys);
  return v?.toString() ?? fallback;
}

bool pickBool(Map<String, dynamic> json, List<String> keys,
    {bool fallback = false}) {
  final v = pick(json, keys);
  if (v is bool) return v;
  return fallback;
}

DateTime? pickDate(Map<String, dynamic> json, List<String> keys) {
  final v = pick(json, keys);
  if (v is String) return DateTime.tryParse(v);
  return null;
}

List<Map<String, dynamic>> asList(Object? v) {
  if (v is List) return v.whereType<Map<String, dynamic>>().toList();
  return const [];
}
