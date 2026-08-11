import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';

enum AuthStatus { checking, signedOut, signedIn }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.isSubmitting = false,
    this.error,
  });

  const AuthState.checking() : this(status: AuthStatus.checking);
  const AuthState.signedOut({String? error})
    : this(status: AuthStatus.signedOut, error: error);

  final AuthStatus status;
  final Map<String, dynamic>? user;
  final bool isSubmitting;
  final String? error;

  AuthState copyWith({
    AuthStatus? status,
    Map<String, dynamic>? user,
    bool? isSubmitting,
    String? error,
    bool clearError = false,
  }) => AuthState(
    status: status ?? this.status,
    user: user ?? this.user,
    isSubmitting: isSubmitting ?? this.isSubmitting,
    error: clearError ? null : error ?? this.error,
  );
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStoreProvider),
  ),
);

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

class AuthController extends Notifier<AuthState> {
  late final AuthRepository _repository;

  @override
  AuthState build() {
    _repository = ref.watch(authRepositoryProvider);
    Future<void>.microtask(_restore);
    return const AuthState.checking();
  }

  Future<void> _restore() async {
    try {
      final user = await _repository.restoreUser();
      state = user == null
          ? const AuthState.signedOut()
          : AuthState(status: AuthStatus.signedIn, user: user);
    } catch (_) {
      state = const AuthState.signedOut();
    }
  }

  Future<bool> login(String email, String password) =>
      _submit(() => _repository.login(email: email, password: password));

  Future<bool> register(String name, String email, String password) => _submit(
    () => _repository.register(name: name, email: email, password: password),
  );

  Future<bool> _submit(Future<Map<String, dynamic>> Function() action) async {
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final user = await action();
      state = AuthState(status: AuthStatus.signedIn, user: user);
      return true;
    } catch (error) {
      state = AuthState.signedOut(error: error.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.signedOut();
  }

  Future<bool> completeOnboarding({
    required String targetRole,
    required List<String> locations,
    required String experienceLevel,
    required String workPreference,
  }) async {
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final user = await _repository.completeOnboarding(
        targetRole: targetRole,
        locations: locations,
        experienceLevel: experienceLevel,
        workPreference: workPreference,
      );
      state = AuthState(status: AuthStatus.signedIn, user: user);
      return true;
    } catch (error) {
      state = state.copyWith(isSubmitting: false, error: error.toString());
      return false;
    }
  }
}
