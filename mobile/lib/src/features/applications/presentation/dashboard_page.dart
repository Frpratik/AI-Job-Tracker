import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../../auth/application/auth_controller.dart';
import '../application/applications_controller.dart';
import 'widgets/application_card.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final name = (user?['full_name'] as String? ?? 'there').split(' ').first;
    final dashboard = ref.watch(dashboardProvider);
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async => ref.invalidate(dashboardProvider),
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
                IconButton.filledTonal(
                  tooltip: 'Add application',
                  onPressed: () => context.push('/applications/new'),
                  icon: const Icon(Icons.add_rounded),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            dashboard.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(AppSpacing.xxl),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => _ErrorCard(
                error: error.toString(),
                onRetry: () => ref.invalidate(dashboardProvider),
              ),
              data: (data) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: AppSpacing.md,
                    crossAxisSpacing: AppSpacing.md,
                    childAspectRatio: 1.65,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _Metric(
                        label: 'Total',
                        value: data.total,
                        icon: Icons.work_outline_rounded,
                      ),
                      _Metric(
                        label: 'Active',
                        value: data.active,
                        icon: Icons.track_changes_rounded,
                      ),
                      _Metric(
                        label: 'Interviews',
                        value: data.interviews,
                        icon: Icons.groups_outlined,
                      ),
                      _Metric(
                        label: 'Offers',
                        value: data.offers,
                        icon: Icons.celebration_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Card(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Row(
                        children: [
                          Icon(
                            Icons.lightbulb_outline_rounded,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Text(
                              data.total == 0
                                  ? 'Add your first application to start building momentum.'
                                  : '${data.active} active ${data.active == 1 ? 'application needs' : 'applications need'} your attention.',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Recent applications',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('See all'),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  if (data.recent.isEmpty)
                    const _EmptyDashboard()
                  else
                    ...data.recent.map(
                      (application) => ApplicationCard(
                        application: application,
                        onTap: () =>
                            context.push('/applications/${application.id}'),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value, required this.icon});
  final String label;
  final int value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$value', style: Theme.of(context).textTheme.headlineMedium),
              Text(
                label,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _EmptyDashboard extends StatelessWidget {
  const _EmptyDashboard();
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Icon(
            Icons.route_outlined,
            size: 40,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Your next opportunity starts here',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'Applications you add will appear here with their most important next step.',
          ),
        ],
      ),
    ),
  );
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          const Icon(Icons.cloud_off_outlined),
          const SizedBox(height: AppSpacing.sm),
          Text(error, textAlign: TextAlign.center),
          TextButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    ),
  );
}
