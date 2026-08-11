import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/auth_screen.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/onboarding/presentation/welcome_screen.dart';
import '../../features/onboarding/presentation/profile_setup_screen.dart';
import '../../features/shell/presentation/app_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);
  return GoRouter(
    initialLocation: '/welcome',
    redirect: (context, state) {
      final public = {
        '/welcome',
        '/login',
        '/register',
        '/forgot-password',
      }.contains(state.matchedLocation);
      if (auth.status == AuthStatus.checking) return '/loading';
      if (auth.status == AuthStatus.signedOut && !public) return '/welcome';
      final profile = auth.user?['profile'] as Map<String, dynamic>?;
      final onboardingComplete = profile?['onboarding_completed'] == true;
      if (auth.status == AuthStatus.signedIn &&
          !onboardingComplete &&
          state.matchedLocation != '/onboarding') {
        return '/onboarding';
      }
      if (auth.status == AuthStatus.signedIn &&
          onboardingComplete &&
          (public || state.matchedLocation == '/onboarding')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, _) => const _LoadingScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(
        path: '/login',
        builder: (_, _) => const AuthScreen(register: false),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => const AuthScreen(register: true),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, _) => const ProfileSetupScreen(),
      ),
      GoRoute(path: '/home', builder: (_, _) => const AppShell()),
    ],
  );
});

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
