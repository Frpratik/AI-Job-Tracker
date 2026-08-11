import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../application/applications_controller.dart';
import '../data/applications_repository.dart';
import '../domain/job_application.dart';

class ApplicationFormScreen extends ConsumerStatefulWidget {
  const ApplicationFormScreen({super.key, this.initial});
  final JobApplication? initial;

  @override
  ConsumerState<ApplicationFormScreen> createState() =>
      _ApplicationFormScreenState();
}

class _ApplicationFormScreenState extends ConsumerState<ApplicationFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _company;
  late final TextEditingController _title;
  late final TextEditingController _location;
  late final TextEditingController _url;
  late final TextEditingController _source;
  late String _status;
  late String _priority;
  late String _workMode;
  bool _submitting = false;
  String? _error;

  bool get _editing => widget.initial != null;

  @override
  void initState() {
    super.initState();
    final item = widget.initial;
    _company = TextEditingController(text: item?.company);
    _title = TextEditingController(text: item?.title);
    _location = TextEditingController(text: item?.location);
    _url = TextEditingController(text: item?.jobUrl);
    _source = TextEditingController(text: item?.source);
    _status = item?.status ?? 'applied';
    _priority = item?.priority ?? 'medium';
    _workMode = item?.workMode ?? 'unspecified';
  }

  @override
  void dispose() {
    _company.dispose();
    _title.dispose();
    _location.dispose();
    _url.dispose();
    _source.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final repository = ref.read(applicationsRepositoryProvider);
      final item = _editing
          ? await repository.update(
              widget.initial!.id,
              company: _company.text.trim(),
              title: _title.text.trim(),
              location: _location.text.trim(),
              url: _url.text.trim(),
              source: _source.text.trim(),
              status: _status,
              priority: _priority,
              workMode: _workMode,
            )
          : await repository.create(
              company: _company.text.trim(),
              title: _title.text.trim(),
              location: _location.text.trim(),
              url: _url.text.trim(),
              source: _source.text.trim(),
              status: _status,
              priority: _priority,
              workMode: _workMode,
            );
      await ref.read(applicationsControllerProvider.notifier).refresh();
      ref.invalidate(applicationDetailProvider(item.id));
      if (mounted) context.pushReplacement('/applications/${item.id}');
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(_editing ? 'Edit application' : 'Add application'),
    ),
    body: SafeArea(
      child: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            Text('Opportunity', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _company,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Company name',
                prefixIcon: Icon(Icons.business_outlined),
              ),
              validator: _required,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _title,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Job title',
                prefixIcon: Icon(Icons.work_outline_rounded),
              ),
              validator: _required,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _location,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Location',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: _workMode,
              decoration: const InputDecoration(labelText: 'Work mode'),
              items: const [
                DropdownMenuItem(
                  value: 'unspecified',
                  child: Text('Not specified'),
                ),
                DropdownMenuItem(value: 'remote', child: Text('Remote')),
                DropdownMenuItem(value: 'hybrid', child: Text('Hybrid')),
                DropdownMenuItem(value: 'onsite', child: Text('On-site')),
              ],
              onChanged: (value) => _workMode = value!,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _url,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Job URL',
                prefixIcon: Icon(Icons.link_rounded),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) return null;
                final uri = Uri.tryParse(value);
                return uri != null && uri.hasScheme && uri.host.isNotEmpty
                    ? null
                    : 'Enter a complete URL.';
              },
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Tracking', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _statuses.entries
                  .map(
                    (entry) => DropdownMenuItem(
                      value: entry.key,
                      child: Text(entry.value),
                    ),
                  )
                  .toList(),
              onChanged: (value) => _status = value!,
            ),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: const [
                DropdownMenuItem(value: 'low', child: Text('Low')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'high', child: Text('High')),
              ],
              onChanged: (value) => _priority = value!,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _source,
              decoration: const InputDecoration(
                labelText: 'Source',
                hintText: 'LinkedIn, referral, company website…',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Semantics(
                liveRegion: true,
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox.square(
                      dimension: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_editing ? 'Save changes' : 'Add application'),
            ),
          ],
        ),
      ),
    ),
  );

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'This field is required.' : null;
}

class EditApplicationScreen extends ConsumerWidget {
  const EditApplicationScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(applicationDetailProvider(id))
      .when(
        loading: () =>
            const Scaffold(body: Center(child: CircularProgressIndicator())),
        error: (error, _) => Scaffold(
          appBar: AppBar(),
          body: Center(child: Text(error.toString())),
        ),
        data: (item) => ApplicationFormScreen(initial: item),
      );
}

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
