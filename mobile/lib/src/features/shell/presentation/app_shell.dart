import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/theme_controller.dart';
import '../../applications/presentation/applications_page.dart';
import '../../applications/presentation/dashboard_page.dart';
import '../../auth/application/auth_controller.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    const pages = <Widget>[
      DashboardPage(),
      ApplicationsPage(),
      SizedBox.shrink(),
      _StatsPreview(),
      _ProfilePage(),
    ];
    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) {
          if (index == 2) {
            context.push('/applications/new');
            return;
          }
          setState(() => _index = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.work_outline_rounded),
            selectedIcon: Icon(Icons.work_rounded),
            label: 'Jobs',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline_rounded),
            selectedIcon: Icon(Icons.add_circle_rounded),
            label: 'Add',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart_rounded),
            label: 'Stats',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _StatsPreview extends StatelessWidget {
  const _StatsPreview();

  @override
  Widget build(BuildContext context) => SafeArea(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Insights', style: Theme.of(context).textTheme.headlineMedium),
          const Spacer(),
          Center(
            child: Column(
              children: [
                Icon(
                  Icons.insights_outlined,
                  size: 48,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Your progress will appear here',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                const Text(
                  'Detailed conversion analytics arrive in Phase 5.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const Spacer(),
        ],
      ),
    ),
  );
}

class _ProfilePage extends ConsumerWidget {
  const _ProfilePage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text('Profile', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.lg),
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                child: Icon(Icons.person_outline_rounded),
              ),
              title: Text(user?['full_name'] as String? ?? 'Job seeker'),
              subtitle: Text(user?['email'] as String? ?? ''),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.brightness_6_outlined),
                  title: const Text('Appearance'),
                  subtitle: const Text('Follow system by default'),
                  trailing: PopupMenuButton<ThemeMode>(
                    tooltip: 'Choose appearance',
                    onSelected: ref
                        .read(themeControllerProvider.notifier)
                        .setMode,
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                        value: ThemeMode.system,
                        child: Text('System'),
                      ),
                      PopupMenuItem(
                        value: ThemeMode.light,
                        child: Text('Light'),
                      ),
                      PopupMenuItem(value: ThemeMode.dark, child: Text('Dark')),
                    ],
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout_rounded),
                  title: const Text('Sign out'),
                  onTap: () =>
                      ref.read(authControllerProvider.notifier).logout(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
