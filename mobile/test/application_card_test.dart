import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jobtracker/src/features/applications/domain/job_application.dart';
import 'package:jobtracker/src/features/applications/presentation/widgets/application_card.dart';

void main() {
  testWidgets('application card presents role, company, location, and status', (
    tester,
  ) async {
    final application = JobApplication(
      id: '1',
      company: 'OpenAI',
      title: 'Backend Engineer',
      status: 'screening',
      statusLabel: 'Screening',
      priority: 'high',
      location: 'Remote',
      workMode: 'remote',
      jobUrl: 'https://example.com/job',
      source: 'Referral',
      appliedDate: DateTime(2026, 8, 12),
      updatedAt: DateTime(2026, 8, 12),
      statusHistory: const [],
      notes: const [],
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ApplicationCard(application: application)),
      ),
    );

    expect(find.text('Backend Engineer'), findsOneWidget);
    expect(find.text('OpenAI · Remote'), findsOneWidget);
    expect(find.text('Screening'), findsOneWidget);
  });
}
