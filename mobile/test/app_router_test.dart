import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jobtracker/src/core/router/app_router.dart';
import 'package:jobtracker/src/features/auth/application/auth_controller.dart';

class _TestAuthController extends AuthController {
  @override
  AuthState build() => const AuthState.signedOut();

  void startSubmitting() {
    state = state.copyWith(isSubmitting: true, clearError: true);
  }
}

void main() {
  test('auth state changes do not recreate the router', () {
    final container = ProviderContainer(
      overrides: [authControllerProvider.overrideWith(_TestAuthController.new)],
    );
    addTearDown(container.dispose);

    final router = container.read(appRouterProvider);
    final controller =
        container.read(authControllerProvider.notifier) as _TestAuthController;

    controller.startSubmitting();

    expect(container.read(appRouterProvider), same(router));
  });
}
