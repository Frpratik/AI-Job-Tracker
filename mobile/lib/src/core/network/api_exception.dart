class ApiException implements Exception {
  const ApiException(this.message, {this.code = 'REQUEST_ERROR', this.fields});

  final String message;
  final String code;
  final Map<String, dynamic>? fields;

  @override
  String toString() => message;
}
