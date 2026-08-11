import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jobtracker/src/features/onboarding/presentation/welcome_screen.dart';

void main() {
  testWidgets(
    'welcome screen explains the product and exposes both auth paths',
    (tester) async {
      await tester.pumpWidget(const MaterialApp(home: WelcomeScreen()));

      expect(find.text('Your job search,\norganized.'), findsOneWidget);
      expect(find.text('Get started'), findsOneWidget);
      expect(find.text('I already have an account'), findsOneWidget);
    },
  );
}
