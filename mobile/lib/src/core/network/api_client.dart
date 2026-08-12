import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../storage/token_store.dart';
import 'api_exception.dart';

const _defaultApiUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000/api/v1',
);

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => const TokenStore(FlutterSecureStorage()),
);

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(tokenStoreProvider)),
);

class ApiClient {
  ApiClient(this._tokens)
    : _dio = Dio(
        BaseOptions(
          baseUrl: _defaultApiUrl,
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Accept': 'application/json'},
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final access = await _tokens.readAccess();
          if (access != null) {
            options.headers['Authorization'] = 'Bearer $access';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.requestOptions.extra['retried'] != true) {
            final refreshed = await _refresh();
            if (refreshed != null) {
              final options = error.requestOptions
                ..extra['retried'] = true
                ..headers['Authorization'] = 'Bearer $refreshed';
              try {
                return handler.resolve(await _dio.fetch(options));
              } on DioException catch (retryError) {
                return handler.next(retryError);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStore _tokens;

  Future<String?> _refresh() async {
    final refresh = await _tokens.readRefresh();
    if (refresh == null) return null;
    try {
      final response = await Dio(BaseOptions(baseUrl: _defaultApiUrl))
          .post<Map<String, dynamic>>(
            '/auth/refresh/',
            data: {'refresh': refresh},
          );
      final payload = response.data?['data'] as Map<String, dynamic>?;
      final access = payload?['access'] as String?;
      if (access == null) return null;
      await _tokens.save(
        access: access,
        refresh: payload?['refresh'] as String? ?? refresh,
      );
      return access;
    } on DioException {
      await _tokens.clear();
      return null;
    }
  }

  Future<Map<String, dynamic>> get(String path) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(path);
      return response.data ?? const {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: data);
      return response.data ?? const {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(path, data: data);
      return response.data ?? const {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete<void>(path);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ApiException _mapError(DioException error) {
    final body = error.response?.data;
    if (body is Map<String, dynamic>) {
      final apiError = body['error'];
      if (apiError is Map<String, dynamic>) {
        final fields = apiError['fields'] as Map<String, dynamic>?;
        final fieldMessage = _firstFieldMessage(fields);
        final apiMessage =
            apiError['message'] as String? ?? 'Unable to complete the request.';
        return ApiException(
          fieldMessage ?? apiMessage,
          code: apiError['code'] as String? ?? 'REQUEST_ERROR',
          fields: fields,
        );
      }
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return const ApiException(
        'You appear to be offline. Check your connection and try again.',
        code: 'OFFLINE',
      );
    }
    return const ApiException('Something went wrong. Please try again.');
  }

  String? _firstFieldMessage(dynamic value) {
    if (value is String && value.trim().isNotEmpty) return value;
    if (value is List) {
      for (final item in value) {
        final message = _firstFieldMessage(item);
        if (message != null) return message;
      }
    }
    if (value is Map) {
      for (final item in value.values) {
        final message = _firstFieldMessage(item);
        if (message != null) return message;
      }
    }
    return null;
  }
}
