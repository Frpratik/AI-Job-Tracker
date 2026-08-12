const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiError extends Error {
  code: string;
  fields?: Record<string, any>;
  statusCode: number;

  constructor(message: string, code = 'REQUEST_ERROR', fields?: Record<string, any>, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.statusCode = statusCode;
  }
}

export const tokenStorage = {
  getAccess: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jobtracker_access_token');
  },
  getRefresh: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jobtracker_refresh_token');
  },
  setTokens: (access: string, refresh?: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('jobtracker_access_token', access);
    if (refresh) localStorage.setItem('jobtracker_refresh_token', refresh);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('jobtracker_access_token');
    localStorage.removeItem('jobtracker_refresh_token');
  },
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }

    const payload = await res.json();
    const data = payload?.data || {};
    const newAccess = data.access;
    if (newAccess) {
      tokenStorage.setTokens(newAccess, data.refresh || refresh);
      return newAccess;
    }
    return null;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  let access = tokenStorage.getAccess();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError('Unable to connect to the backend server. Please verify the API is running.', 'NETWORK_ERROR');
  }

  // Handle 401 Unauthorized -> try refresh once
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      try {
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch {
        throw new ApiError('Network error on retry', 'NETWORK_ERROR');
      }
    } else {
      tokenStorage.clear();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
      throw new ApiError('Session expired. Please sign in again.', 'UNAUTHORIZED', undefined, 401);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`Server responded with status ${response.status}`, 'HTTP_ERROR', undefined, response.status);
    }
    return {} as T;
  }

  if (!response.ok || data.success === false) {
    const errObj = data?.error;
    let message = 'An unexpected error occurred.';
    let code = 'ERROR';
    let fields: Record<string, any> | undefined;

    if (typeof errObj === 'string') {
      message = errObj;
    } else if (errObj && typeof errObj === 'object') {
      code = errObj.code || 'REQUEST_ERROR';
      fields = errObj.fields;
      if (fields && Object.keys(fields).length > 0) {
        const firstKey = Object.keys(fields)[0];
        const firstVal = fields[firstKey];
        message = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      } else {
        message = errObj.message || 'Unable to process request.';
      }
    } else if (data?.message) {
      message = data.message;
    }

    throw new ApiError(message, code, fields, response.status);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
