import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_tokens.dart';
import '../../auth/application/auth_controller.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  static const _roles = [
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Data Analyst',
    'DevOps Engineer',
    'Other',
  ];
  static const _experience = {
    'entry': 'Entry level',
    'mid': 'Mid level',
    'senior': 'Senior',
    'lead': 'Lead / Manager',
  };
  static const _work = {
    'remote': 'Remote',
    'hybrid': 'Hybrid',
    'onsite': 'On-site',
    'any': 'Any',
  };

  final _locations = TextEditingController();
  String? _role;
  String? _experienceLevel;
  String? _workPreference;

  @override
  void dispose() {
    _locations.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_role == null || _experienceLevel == null || _workPreference == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete each preference to continue.')),
      );
      return;
    }
    final locations = _locations.text
        .split(',')
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList();
    await ref
        .read(authControllerProvider.notifier)
        .completeOnboarding(
          targetRole: _role!,
          locations: locations,
          experienceLevel: _experienceLevel!,
          workPreference: _workPreference!,
        );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Your search preferences')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            Text(
              'Make JobTracker yours',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'These preferences help organize your search. You can change them later.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            const _SectionLabel('Target role'),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: _roles
                  .map(
                    (role) => ChoiceChip(
                      label: Text(role),
                      selected: _role == role,
                      onSelected: (_) => setState(() => _role = role),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionLabel('Preferred locations'),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _locations,
              decoration: const InputDecoration(
                hintText: 'Bengaluru, Pune, Remote',
                helperText: 'Separate multiple locations with commas.',
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionLabel('Experience level'),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: _experience.entries
                  .map(
                    (entry) => ChoiceChip(
                      label: Text(entry.value),
                      selected: _experienceLevel == entry.key,
                      onSelected: (_) =>
                          setState(() => _experienceLevel = entry.key),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionLabel('Work preference'),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              children: _work.entries
                  .map(
                    (entry) => ChoiceChip(
                      label: Text(entry.value),
                      selected: _workPreference == entry.key,
                      onSelected: (_) =>
                          setState(() => _workPreference = entry.key),
                    ),
                  )
                  .toList(),
            ),
            if (auth.error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Semantics(
                liveRegion: true,
                child: Text(
                  auth.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: auth.isSubmitting ? null : _submit,
              child: auth.isSubmitting
                  ? const SizedBox.square(
                      dimension: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Finish setup'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) =>
      Text(text, style: Theme.of(context).textTheme.titleMedium);
}
