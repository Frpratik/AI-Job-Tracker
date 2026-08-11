class JobApplication {
  const JobApplication({
    required this.id,
    required this.company,
    required this.title,
    required this.status,
    required this.statusLabel,
    required this.priority,
    required this.location,
    required this.workMode,
    required this.jobUrl,
    required this.source,
    required this.appliedDate,
    required this.updatedAt,
    required this.statusHistory,
    required this.notes,
  });

  final String id;
  final String company;
  final String title;
  final String status;
  final String statusLabel;
  final String priority;
  final String location;
  final String workMode;
  final String jobUrl;
  final String source;
  final DateTime? appliedDate;
  final DateTime? updatedAt;
  final List<Map<String, dynamic>> statusHistory;
  final List<Map<String, dynamic>> notes;

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    final job = json['job'] as Map<String, dynamic>? ?? const {};
    final company = job['company'] as Map<String, dynamic>? ?? const {};
    return JobApplication(
      id: json['id'] as String,
      company: company['name'] as String? ?? 'Unknown company',
      title: job['title'] as String? ?? 'Untitled role',
      status: json['status'] as String? ?? 'applied',
      statusLabel: json['status_label'] as String? ?? 'Applied',
      priority: json['priority'] as String? ?? 'medium',
      location: job['location'] as String? ?? '',
      workMode: job['work_mode'] as String? ?? 'unspecified',
      jobUrl: job['url'] as String? ?? '',
      source: json['source'] as String? ?? '',
      appliedDate: DateTime.tryParse(json['applied_date'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updated_at'] as String? ?? ''),
      statusHistory: List<Map<String, dynamic>>.from(
        json['status_history'] as List? ?? const [],
      ),
      notes: List<Map<String, dynamic>>.from(
        json['notes'] as List? ?? const [],
      ),
    );
  }
}

class DashboardData {
  const DashboardData({
    required this.total,
    required this.active,
    required this.interviews,
    required this.offers,
    required this.rejected,
    required this.funnel,
    required this.recent,
  });

  final int total;
  final int active;
  final int interviews;
  final int offers;
  final int rejected;
  final Map<String, int> funnel;
  final List<JobApplication> recent;

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
    total: json['total'] as int? ?? 0,
    active: json['active'] as int? ?? 0,
    interviews: json['interviews'] as int? ?? 0,
    offers: json['offers'] as int? ?? 0,
    rejected: json['rejected'] as int? ?? 0,
    funnel: (json['funnel'] as Map<String, dynamic>? ?? const {}).map(
      (key, value) => MapEntry(key, value as int),
    ),
    recent: (json['recent'] as List? ?? const [])
        .map((item) => JobApplication.fromJson(item as Map<String, dynamic>))
        .toList(),
  );
}
