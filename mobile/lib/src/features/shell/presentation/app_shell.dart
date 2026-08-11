import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/theme_controller.dart';
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
    final pages = <Widget>[
      const _DashboardPage(),
      const _EmptyPage(
        icon: Icons.work_outline_rounded,
        title: 'No applications yet',
        message:
            'Your job search starts here. Add your first opportunity when you are ready.',
      ),
      const SizedBox.shrink(),
      const _EmptyPage(
        icon: Icons.insights_outlined,
        title: 'Your progress will appear here',
        message:
            'Analytics become useful once you begin tracking applications.',
      ),
      const _ProfilePage(),
    ];
    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) {
          if (index == 2) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Application creation arrives in Phase 2.'),
              ),
            );
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

class _DashboardPage extends ConsumerWidget {
  const _DashboardPage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final name = (user?['full_name'] as String? ?? 'there').split(' ').first;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good to see you,',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      name,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
              const CircleAvatar(child: Icon(Icons.person_outline_rounded)),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.track_changes_rounded,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Build momentum, one application at a time.',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  const Text(
                    'Your dashboard will surface the next step that deserves your attention.',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Overview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          const Row(
            children: [
              Expanded(
                child: _Metric(label: 'Applications', value: '0'),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _Metric(label: 'Interviews', value: '0'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const _EmptyPage(
            embedded: true,
            icon: Icons.calendar_today_outlined,
            title: 'Nothing needs attention',
            message: 'Upcoming interviews and follow-ups will appear here.',
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    ),
  );
}

class _EmptyPage extends StatelessWidget {
  const _EmptyPage({
    required this.icon,
    required this.title,
    required this.message,
    this.embedded = false,
  });
  final IconData icon;
  final String title;
  final String message;
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final content = Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: Theme.of(context).colorScheme.onSecondaryContainer,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
    return embedded ? Card(child: content) : SafeArea(child: content);
  }
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
