import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../application/applications_controller.dart';
import '../data/applications_repository.dart';
import '../domain/job_application.dart';

class ApplicationDetailScreen extends ConsumerWidget {
  const ApplicationDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(applicationDetailProvider(id));
    return detail.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Text(error.toString(), textAlign: TextAlign.center),
        ),
      ),
      data: (application) => Scaffold(
        appBar: AppBar(
          actions: [
            IconButton(
              tooltip: 'Edit application',
              onPressed: () => context.push('/applications/$id/edit'),
              icon: const Icon(Icons.edit_outlined),
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'delete') _delete(context, ref, application);
              },
              itemBuilder: (_) => const [
                PopupMenuItem(
                  value: 'delete',
                  child: Text('Delete application'),
                ),
              ],
            ),
          ],
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              0,
              AppSpacing.lg,
              AppSpacing.xxl,
            ),
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  application.company.characters.first.toUpperCase(),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                application.company,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                application.title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton.tonalIcon(
                onPressed: () => _chooseStatus(context, ref, application),
                icon: const Icon(Icons.swap_vert_rounded),
                label: Text(application.statusLabel),
              ),
              const SizedBox(height: AppSpacing.lg),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    children: [
                      _Fact(
                        icon: Icons.location_on_outlined,
                        label: 'Location',
                        value: application.location.isEmpty
                            ? 'Not specified'
                            : application.location,
                      ),
                      const Divider(),
                      _Fact(
                        icon: Icons.work_outline_rounded,
                        label: 'Work mode',
                        value: _label(application.workMode),
                      ),
                      const Divider(),
                      _Fact(
                        icon: Icons.calendar_today_outlined,
                        label: 'Applied',
                        value: _date(application.appliedDate),
                      ),
                      const Divider(),
                      _Fact(
                        icon: Icons.explore_outlined,
                        label: 'Source',
                        value: application.source.isEmpty
                            ? 'Not specified'
                            : application.source,
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
                      'Tags',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _manageTags(context, ref, application),
                    icon: const Icon(Icons.sell_outlined),
                    label: const Text('Manage'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              if (application.tags.isEmpty)
                Text(
                  'Add tags such as Dream role, Referral, or Follow up.',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                )
              else
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: application.tags
                      .map(
                        (tag) => Chip(
                          avatar: const Icon(Icons.sell_outlined, size: 16),
                          label: Text(tag['name'] as String? ?? ''),
                        ),
                      )
                      .toList(),
                ),
              const SizedBox(height: AppSpacing.lg),
              Text('Timeline', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: AppSpacing.md),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: application.statusHistory.isEmpty
                      ? const Text('Status changes will appear here.')
                      : Column(
                          children: application.statusHistory
                              .map(
                                (entry) => _TimelineItem(
                                  label:
                                      entry['to_status_label'] as String? ??
                                      _label(
                                        entry['to_status'] as String? ?? '',
                                      ),
                                  date: DateTime.tryParse(
                                    entry['changed_at'] as String? ?? '',
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Notes',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _addNote(context, ref),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Add note'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              if (application.notes.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: Text(
                      'Capture interview questions, follow-up ideas, or anything worth remembering.',
                    ),
                  ),
                )
              else
                ...application.notes.map(
                  (note) => Card(
                    child: ListTile(
                      leading: Icon(
                        note['is_important'] == true
                            ? Icons.star_rounded
                            : Icons.notes_rounded,
                      ),
                      title: Text(note['body'] as String? ?? ''),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _chooseStatus(
    BuildContext context,
    WidgetRef ref,
    JobApplication application,
  ) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: _statuses.entries
              .map(
                (entry) => ListTile(
                  title: Text(entry.value),
                  trailing: entry.key == application.status
                      ? Icon(
                          Icons.check_circle_rounded,
                          color: Theme.of(context).colorScheme.primary,
                        )
                      : null,
                  onTap: () => Navigator.pop(context, entry.key),
                ),
              )
              .toList(),
        ),
      ),
    );
    if (selected == null || selected == application.status) return;
    await ref.read(applicationsRepositoryProvider).changeStatus(id, selected);
    ref.invalidate(applicationDetailProvider(id));
    await ref.read(applicationsControllerProvider.notifier).refresh();
  }

  Future<void> _addNote(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final note = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add note'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 5,
          decoration: const InputDecoration(
            hintText: 'What do you want to remember?',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save note'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (note == null || note.isEmpty) return;
    await ref.read(applicationsRepositoryProvider).addNote(id, note);
    ref.invalidate(applicationDetailProvider(id));
  }

  Future<void> _manageTags(
    BuildContext context,
    WidgetRef ref,
    JobApplication application,
  ) async {
    final repository = ref.read(applicationsRepositoryProvider);
    final available = await repository.tags();
    final selected = application.tags.map((tag) => tag['id'] as String).toSet();
    final name = TextEditingController();
    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.lg,
            0,
            AppSpacing.lg,
            MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Organize with tags',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.md),
              if (available.isEmpty)
                const Text('Create your first tag below.')
              else
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: available
                      .map(
                        (tag) => FilterChip(
                          label: Text(tag['name'] as String),
                          selected: selected.contains(tag['id']),
                          onSelected: (value) => setSheetState(() {
                            value
                                ? selected.add(tag['id'] as String)
                                : selected.remove(tag['id']);
                          }),
                        ),
                      )
                      .toList(),
                ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: name,
                      decoration: const InputDecoration(
                        hintText: 'New tag name',
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  IconButton.filledTonal(
                    tooltip: 'Create tag',
                    onPressed: () async {
                      final value = name.text.trim();
                      if (value.isEmpty) return;
                      final tag = await repository.createTag(value);
                      setSheetState(() {
                        available.add(tag);
                        selected.add(tag['id'] as String);
                        name.clear();
                      });
                    },
                    icon: const Icon(Icons.add_rounded),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton(
                onPressed: () async {
                  await repository.setTags(id, selected.toList());
                  ref.invalidate(applicationDetailProvider(id));
                  if (sheetContext.mounted) Navigator.pop(sheetContext);
                },
                child: const Text('Save tags'),
              ),
            ],
          ),
        ),
      ),
    );
    name.dispose();
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    JobApplication application,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete application?'),
        content: Text(
          '${application.company} · ${application.title} will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(applicationsRepositoryProvider).delete(id);
    await ref.read(applicationsControllerProvider.notifier).refresh();
    if (context.mounted) context.go('/home');
  }
}

class _Fact extends StatelessWidget {
  const _Fact({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: AppSpacing.md),
      Expanded(child: Text(label)),
      Flexible(
        child: Text(
          value,
          textAlign: TextAlign.right,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    ],
  );
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({required this.label, required this.date});
  final String label;
  final DateTime? date;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
    child: Row(
      children: [
        Icon(
          Icons.check_circle_rounded,
          color: Theme.of(context).colorScheme.primary,
          size: 20,
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        Text(
          _date(date),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    ),
  );
}

String _date(DateTime? date) {
  if (date == null) return 'Not set';
  final local = date.toLocal();
  return '${local.day}/${local.month}/${local.year}';
}

String _label(String value) => value
    .split('_')
    .map(
      (word) =>
          word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}',
    )
    .join(' ');

const _statuses = {
  'wishlist': 'Wishlist',
  'applied': 'Applied',
  'viewed': 'Application viewed',
  'recruiter_contacted': 'Recruiter contacted',
  'screening': 'Screening',
  'assessment': 'Assessment',
  'technical_interview': 'Technical interview',
  'hr_interview': 'HR interview',
  'final_interview': 'Final interview',
  'offer': 'Offer',
  'accepted': 'Accepted',
  'rejected': 'Rejected',
  'withdrawn': 'Withdrawn',
  'on_hold': 'On hold',
};
