import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/job_application.dart';

final applicationsRepositoryProvider = Provider<ApplicationsRepository>(
  (ref) => ApplicationsRepository(ref.watch(apiClientProvider)),
);

class ApplicationsRepository {
  const ApplicationsRepository(this._api);

  final ApiClient _api;

  Future<List<JobApplication>> list({
    String search = '',
    String? status,
  }) async {
    final query = <String>[];
    if (search.trim().isNotEmpty) {
      query.add('search=${Uri.encodeQueryComponent(search.trim())}');
    }
    if (status != null && status.isNotEmpty) {
      query.add('status=${Uri.encodeQueryComponent(status)}');
    }
    final response = await _api.get(
      '/applications/${query.isEmpty ? '' : '?${query.join('&')}'}',
    );
    final data = response['data'] as Map<String, dynamic>;
    return (data['results'] as List)
        .map((item) => JobApplication.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<JobApplication> get(String id) async {
    final response = await _api.get('/applications/$id/');
    return JobApplication.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<DashboardData> dashboard() async {
    final response = await _api.get('/dashboard/');
    return DashboardData.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<JobApplication> create({
    required String company,
    required String title,
    required String location,
    required String url,
    required String source,
    required String status,
    required String priority,
    required String workMode,
  }) async {
    final today = DateTime.now();
    final date =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final response = await _api.post(
      '/applications/',
      data: {
        'job': {
          'company': {'name': company},
          'title': title,
          'location': location,
          'url': url,
          'work_mode': workMode,
          'employment_type': 'full_time',
          'salary_currency': 'USD',
        },
        'status': status,
        'applied_date': status == 'wishlist' ? null : date,
        'source': source,
        'priority': priority,
      },
    );
    return JobApplication.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<JobApplication> changeStatus(String id, String status) async {
    final response = await _api.patch(
      '/applications/$id/status/',
      data: {'status': status},
    );
    return JobApplication.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<JobApplication> update(
    String id, {
    required String company,
    required String title,
    required String location,
    required String url,
    required String source,
    required String status,
    required String priority,
    required String workMode,
  }) async {
    final response = await _api.patch(
      '/applications/$id/',
      data: {
        'job': {
          'company': {'name': company},
          'title': title,
          'location': location,
          'url': url,
          'work_mode': workMode,
        },
        'status': status,
        'source': source,
        'priority': priority,
      },
    );
    return JobApplication.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> addNote(String id, String body, {bool important = false}) async {
    await _api.post(
      '/applications/$id/notes/',
      data: {'body': body, 'is_important': important},
    );
  }

  Future<void> delete(String id) async => _api.delete('/applications/$id/');
}
