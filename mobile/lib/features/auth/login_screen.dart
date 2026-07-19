import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(authControllerProvider.notifier).signIn(
          email: _email.text.trim(),
          password: _password.text,
        );
    if (ok && mounted) context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: SystemPanel(
            title: 'SYSTEM ACCESS',
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'ARISE//OS',
                    textAlign: TextAlign.center,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: AriseColors.blue, fontSize: 28),
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _email,
                    decoration: const InputDecoration(labelText: 'EMAIL'),
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: (v) => (v == null || !v.contains('@'))
                        ? 'Enter a valid email'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    decoration: const InputDecoration(labelText: 'PASSWORD'),
                    obscureText: true,
                    autofillHints: const [AutofillHints.password],
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) => (v == null || v.length < 6)
                        ? 'Min 6 characters'
                        : null,
                  ),
                  const SizedBox(height: 20),
                  if (auth.hasError)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        auth.error.toString(),
                        style: const TextStyle(
                            color: AriseColors.danger, fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  FilledButton(
                    onPressed: auth.isLoading ? null : _submit,
                    child: auth.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('ENTER THE GATE'),
                  ),
                  const SizedBox(height: 8),
                  // Demo account hint — tap to autofill credentials.
                  InkWell(
                    onTap: () {
                      _email.text = 'demo@arise.os';
                      _password.text = 'password123';
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        border: Border.all(
                            color: AriseColors.blue.withValues(alpha: 0.35)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Column(
                        children: [
                          Text(
                            'DEMO ACCESS — TAP TO FILL',
                            style: TextStyle(
                                color: AriseColors.blue,
                                letterSpacing: 1,
                                fontSize: 11),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'demo@arise.os  ·  password123',
                            style: TextStyle(
                                color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextButton(
                    onPressed: () => context.go('/signup'),
                    child: const Text(
                      'NO ACCOUNT? AWAKEN HERE',
                      style: TextStyle(
                          color: AriseColors.violetBright,
                          letterSpacing: 1,
                          fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
