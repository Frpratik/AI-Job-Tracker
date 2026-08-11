import '../../../core/network/api_client.dart';
import '../../../core/storage/token_store.dart';

class AuthRepository {
  const AuthRepository(this._api, this._tokens);

  final ApiClient _api;
  final TokenStore _tokens;

  Future<Map<String, dynamic>?> restoreUser() async {
    if (await _tokens.readRefresh() == null) return null;
    final response = await _api.get('/auth/me/');
    return response['data'] as Map<String, dynamic>?;
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '/auth/login/',
      data: {'email': email, 'password': password},
    );
    return _persistSession(response);
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '/auth/register/',
      data: {
        'full_name': name,
        'email': email,
        'password': password,
        'confirm_password': password,
      },
    );
    return _persistSession(response);
  }

  Future<Map<String, dynamic>> _persistSession(
    Map<String, dynamic> response,
  ) async {
    final data = response['data'] as Map<String, dynamic>;
    final tokens = data['tokens'] as Map<String, dynamic>;
    await _tokens.save(
      access: tokens['access'] as String,
      refresh: tokens['refresh'] as String,
    );
    return data['user'] as Map<String, dynamic>;
  }

  Future<void> logout() async {
    final refresh = await _tokens.readRefresh();
    try {
      if (refresh != null) {
        await _api.post('/auth/logout/', data: {'refresh': refresh});
      }
    } finally {
      await _tokens.clear();
    }
  }

  Future<Map<String, dynamic>> completeOnboarding({
    required String targetRole,
    required List<String> locations,
    required String experienceLevel,
    required String workPreference,
  }) async {
    final response = await _api.patch(
      '/auth/me/',
      data: {
        'profile': {
          'target_role': targetRole,
          'preferred_locations': locations,
          'experience_level': experienceLevel,
          'work_preference': workPreference,
          'onboarding_completed': true,
        },
      },
    );
    return response['data'] as Map<String, dynamic>;
  }
}
