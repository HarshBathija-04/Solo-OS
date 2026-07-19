import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Thrown when the API returns `{ok: false, error}` or a transport failure.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

const _defaultBaseUrl = 'https://arise-os.onrender.com'; // Deployed backend.

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _defaultBaseUrl,
);

/// Dio client for the Arise OS Express API.
///
/// - Attaches the Supabase access token as a Bearer header on every request.
/// - Unwraps the `{ok: true, ...data}` envelope; throws [ApiException] on
///   `{ok: false, error}` or transport errors.
class ApiClient {
  ApiClient({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: apiBaseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 20),
            )) {
    // Queued so concurrent requests wait for a single token refresh instead
    // of racing each other.
    _dio.interceptors.add(QueuedInterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _freshToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Stale token slipped through (e.g. cold start with a restored but
        // expired session): force-refresh once and replay the request.
        if (error.response?.statusCode == 401 &&
            error.requestOptions.extra['retried'] != true) {
          final token = await _freshToken(force: true);
          if (token != null) {
            final opts = error.requestOptions
              ..headers['Authorization'] = 'Bearer $token'
              ..extra['retried'] = true;
            try {
              return handler.resolve(await _dio.fetch<dynamic>(opts));
            } on DioException catch (e) {
              return handler.next(e);
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  final Dio _dio;

  /// Returns a non-expired access token, refreshing the session if needed.
  /// Falls back to the current (possibly stale) token if refresh fails, e.g.
  /// while offline — the request will then fail with a normal network error.
  Future<String?> _freshToken({bool force = false}) async {
    final auth = Supabase.instance.client.auth;
    final session = auth.currentSession;
    if (session == null) return null;
    if (force || session.isExpired) {
      try {
        final res = await auth.refreshSession();
        return res.session?.accessToken ?? session.accessToken;
      } catch (_) {
        return session.accessToken;
      }
    }
    return session.accessToken;
  }

  Future<Map<String, dynamic>> get(String path,
      {Map<String, dynamic>? query}) async {
    return _request(() => _dio.get<dynamic>(path, queryParameters: query));
  }

  Future<Map<String, dynamic>> post(String path, {Object? body}) async {
    return _request(() => _dio.post<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> put(String path, {Object? body}) async {
    return _request(() => _dio.put<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> patch(String path, {Object? body}) async {
    return _request(() => _dio.patch<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> delete(String path) async {
    return _request(() => _dio.delete<dynamic>(path));
  }

  Future<Map<String, dynamic>> _request(
      Future<Response<dynamic>> Function() send) async {
    Response<dynamic> res;
    try {
      res = await send();
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map<String, dynamic> && data['error'] != null) {
        throw ApiException(data['error'].toString(),
            statusCode: e.response?.statusCode);
      }
      throw ApiException(
        e.message ?? 'Network error — is the API reachable?',
        statusCode: e.response?.statusCode,
      );
    }
    return _unwrap(res);
  }

  Map<String, dynamic> _unwrap(Response<dynamic> res) {
    final data = res.data;
    if (data is! Map<String, dynamic>) {
      throw ApiException('Unexpected response shape',
          statusCode: res.statusCode);
    }
    if (data['ok'] == true) return data;
    throw ApiException(
      (data['error'] ?? 'Unknown API error').toString(),
      statusCode: res.statusCode,
    );
  }
}
