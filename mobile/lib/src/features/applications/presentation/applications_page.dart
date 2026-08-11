import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../application/applications_controller.dart';
import 'widgets/application_card.dart';

class ApplicationsPage extends ConsumerStatefulWidget {
  const ApplicationsPage({super.key});

  @override
  ConsumerState<ApplicationsPage> createState() => _ApplicationsPageState();
}

class _ApplicationsPageState extends ConsumerState<ApplicationsPage> {
  final _search = TextEditingController();
  Timer? _debounce;
  String? _status;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _runSearch() {
    _debounce?.cancel();
    _debounce = Timer(
      const Duration(milliseconds: 350),
      () => ref
          .read(applicationsControllerProvider.notifier)
          .search(_search.text, status: _status),
    );
  }

  @override
  Widget build(BuildContext context) {
    final applications = ref.watch(applicationsControllerProvider);
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: ref.read(applicationsControllerProvider.notifier).refresh,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Applications',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                        ),
                        IconButton.filledTonal(
                          tooltip: 'Add application',
                          onPressed: () => context.push('/applications/new'),
                          icon: const Icon(Icons.add_rounded),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    TextField(
                      controller: _search,
                      onChanged: (_) => _runSearch(),
                      decoration: const InputDecoration(
                        hintText: 'Search company, role, location…',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _FilterChip(
                            label: 'All',
                            selected: _status == null,
                            onTap: () => _setStatus(null),
                          ),
                          _FilterChip(
                            label: 'Applied',
                            selected: _status == 'applied',
                            onTap: () => _setStatus('applied'),
                          ),
                          _FilterChip(
                            label: 'Interview',
                            selected: _status == 'technical_interview',
                            onTap: () => _setStatus('technical_interview'),
                          ),
                          _FilterChip(
                            label: 'Offer',
                            selected: _status == 'offer',
                            onTap: () => _setStatus('offer'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            applications.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => SliverFillRemaining(
                child: _StateMessage(
                  icon: Icons.cloud_off_outlined,
                  title: 'Could not load applications',
                  message: error.toString(),
                  action: () => ref.invalidate(applicationsControllerProvider),
                ),
              ),
              data: (items) => items.isEmpty
                  ? SliverFillRemaining(
                      child: _StateMessage(
                        icon: Icons.work_outline_rounded,
                        title: _search.text.isEmpty && _status == null
                            ? 'No applications yet'
                            : 'No matching applications',
                        message: _search.text.isEmpty && _status == null
                            ? 'Your job search starts here. Add the first role you want to track.'
                            : 'Try a different search or status filter.',
                        action: _search.text.isEmpty && _status == null
                            ? () => context.push('/applications/new')
                            : null,
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.md,
                        0,
                        AppSpacing.md,
                        100,
                      ),
                      sliver: SliverList.builder(
                        itemCount: items.length,
                        itemBuilder: (context, index) => ApplicationCard(
                          application: items[index],
                          onTap: () =>
                              context.push('/applications/${items[index].id}'),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _setStatus(String? value) {
    setState(() => _status = value);
    ref
        .read(applicationsControllerProvider.notifier)
        .search(_search.text, status: value);
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: AppSpacing.sm),
    child: ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    ),
  );
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback? action;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 44, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: AppSpacing.md),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(message, textAlign: TextAlign.center),
          if (action != null) ...[
            const SizedBox(height: AppSpacing.lg),
            FilledButton.tonal(
              onPressed: action,
              child: Text(
                title.startsWith('No ') ? 'Add application' : 'Try again',
              ),
            ),
          ],
        ],
      ),
    ),
  );
}
