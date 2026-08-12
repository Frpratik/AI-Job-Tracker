import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/applications_repository.dart';
import '../domain/job_application.dart';
import '../../auth/application/auth_controller.dart';

final applicationsControllerProvider =
    AsyncNotifierProvider<ApplicationsController, List<JobApplication>>(
      ApplicationsController.new,
    );

class ApplicationsController extends AsyncNotifier<List<JobApplication>> {
  @override
  Future<List<JobApplication>> build() {
    ref.watch(
      authControllerProvider.select((state) => state.user?['id'] as String?),
    );
    return ref.watch(applicationsRepositoryProvider).list();
  }

  Future<void> search(String query, {String? status}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref
          .read(applicationsRepositoryProvider)
          .list(search: query, status: status),
    );
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(
      () => ref.read(applicationsRepositoryProvider).list(),
    );
    ref.invalidate(dashboardProvider);
  }
}

final dashboardProvider = FutureProvider<DashboardData>((ref) {
  ref.watch(
    authControllerProvider.select((state) => state.user?['id'] as String?),
  );
  return ref.watch(applicationsRepositoryProvider).dashboard();
});

final applicationDetailProvider = FutureProvider.family<JobApplication, String>(
  (ref, id) {
    ref.watch(
      authControllerProvider.select((state) => state.user?['id'] as String?),
    );
    return ref.watch(applicationsRepositoryProvider).get(id);
  },
);
