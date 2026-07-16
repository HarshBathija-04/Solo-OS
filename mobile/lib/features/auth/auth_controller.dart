import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/api_providers.dart';

/// Emits on every Supabase auth state change; router redirect listens to it.
final authStateProvider = StreamProvider<AuthState>(
  (ref) => Supabase.instance.client.auth.onAuthStateChange,
);

final currentSessionProvider = Provider<Session?>((ref) {
  ref.watch(authStateProvider); // rebuild on auth changes
  return Supabase.instance.client.auth.currentSession;
});

/// Sign-in / sign-up actions. State is the in-flight/error status.
class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;
  SupabaseClient get _auth => Supabase.instance.client;

  Future<bool> signIn({required String email, required String password}) async {
    state = const AsyncValue.loading();
    try {
      await _auth.auth.signInWithPassword(email: email, password: password);
      // Idempotent — safe to call on every login; guarantees game rows exist.
      await _ref.read(apiClientProvider).post('/v1/account/bootstrap');
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      final res = await _auth.auth.signUp(
        email: email,
        password: password,
        data: {'name': name},
      );
      if (res.session == null) {
        throw Exception(
            'Signup succeeded but no session — email confirmation may be '
            'required. Check your inbox, then sign in.');
      }
      await _ref.read(apiClientProvider).post('/v1/account/bootstrap');
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<void> signOut() async {
    await _auth.auth.signOut();
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>(
  (ref) => AuthController(ref),
);
