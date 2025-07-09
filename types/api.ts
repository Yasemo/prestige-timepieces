// types/api.ts - API response and request types

import { Watch, WatchStatistics } from "./watch.ts";
import { User } from "./user.ts";

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
  timestamp?: string;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  totalPages?: number;
  hasMore: boolean;
  hasPrevious?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
  count: number;
}

// Watch API responses
export interface WatchListResponse extends PaginatedResponse<Watch> {}

export interface WatchResponse extends ApiResponse<Watch> {}

export interface WatchStatsResponse extends ApiResponse<WatchStatistics> {}

// Authentication API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends ApiResponse<{
  token: string;
  user: Omit<User, 'password_hash'>;
}> {}

export interface AuthUserResponse extends ApiResponse<Omit<User, 'password_hash'>> {}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Inquiry API types
export interface InquiryRequest {
  watch_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  message: string;
}

export interface Inquiry {
  id: number;
  watch_id?: number;
  type: "inquiry" | "general";
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at?: string;
  // Joined data from watch table
  watch_details?: string;
  watch_price?: number;
}

export type InquiryStatus = "pending" | "responded" | "completed" | "closed";

export interface InquiryResponse extends ApiResponse<Inquiry> {}

export interface InquiryListResponse extends PaginatedResponse<Inquiry> {}

export interface UpdateInquiryRequest {
  status?: InquiryStatus;
  notes?: string;
}

// Sell submission API types
export interface SellSubmissionRequest {
  brand: string;
  model: string;
  reference?: string;
  year?: number;
  condition: string;
  accessories?: string;
  description?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface SellSubmission {
  id: number;
  brand: string;
  model: string;
  reference?: string;
  year?: number;
  condition: string;
  accessories?: string;
  description?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: SellSubmissionStatus;
  estimated_value?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type SellSubmissionStatus = "pending" | "quoted" | "accepted" | "completed" | "rejected";

export interface SellSubmissionResponse extends ApiResponse<SellSubmission> {}

export interface SellSubmissionListResponse extends PaginatedResponse<SellSubmission> {}

export interface UpdateSellSubmissionRequest {
  status?: SellSubmissionStatus;
  estimated_value?: number;
  notes?: string;
}

// External API integration types
export interface WatchChartsSearchRequest {
  brand: string;
  reference: string;
  model?: string;
}

export interface WatchChartsSearchResponse extends ApiResponse<any[]> {
  source: "WatchCharts API";
}

export interface WhatsAppSendRequest {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface WhatsAppSendResponse extends ApiResponse<{
  messageId: string;
  status: string;
  timestamp: string;
  provider: string;
}> {}

// Settings API types
export interface SystemSettings {
  [key: string]: {
    value: string;
    description?: string;
    updated_at?: string;
  };
}

export interface SettingsResponse extends ApiResponse<SystemSettings> {}

export interface UpdateSettingsRequest {
  [key: string]: string;
}

// API key management types
export interface ApiKeyStatus {
  watchcharts: {
    configured: boolean;
    active: boolean;
    last_used?: string;
  };
  whatsapp: {
    configured: boolean;
    active: boolean;
    last_used?: string;
  };
}

export interface ApiKeyStatusResponse extends ApiResponse<ApiKeyStatus> {}

export interface AddApiKeyRequest {
  service: "watchcharts" | "whatsapp";
  key_name: string;
  key_value: string;
}

// Health check types
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    database: "connected" | "disconnected";
    watchcharts: "configured" | "not-configured" | "error";
    whatsapp: "configured" | "not-configured" | "error";
  };
  uptime?: number;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface ValidationError extends ApiError {
  code: "VALIDATION_ERROR";
  fields: {
    [fieldName: string]: string[];
  };
}

export interface AuthenticationError extends ApiError {
  code: "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "TOKEN_EXPIRED";
}

export interface NotFoundError extends ApiError {
  code: "NOT_FOUND";
  resource: string;
  id?: string | number;
}

export interface RateLimitError extends ApiError {
  code: "RATE_LIMIT_EXCEEDED";
  limit: number;
  resetTime: string;
}

// Request context types (for middleware)
export interface RequestContext {
  user?: User;
  tokenPayload?: any;
  requestId: string;
  startTime: number;
  ip: string;
  userAgent?: string;
}

// Bulk operation types
export interface BulkOperationResult<T> {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
}

export interface BulkWatchUpdateRequest {
  watchIds: number[];
  updates: Partial<Watch>;
}

export interface BulkWatchUpdateResponse extends ApiResponse<BulkOperationResult<number>> {}

// Search and filter types
export interface SearchRequest {
  q?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  pagination?: PaginationParams;
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  query: string;
  filters: Record<string, any>;
  executionTime: number;
}

// Analytics types
export interface AnalyticsData {
  timeframe: "day" | "week" | "month" | "year";
  metrics: {
    totalViews: number;
    uniqueVisitors: number;
    inquiries: number;
    conversions: number;
    topWatches: Array<{
      watchId: number;
      brand: string;
      model: string;
      views: number;
      inquiries: number;
    }>;
    topBrands: Array<{
      brand: string;
      views: number;
      inquiries: number;
      avgPrice: number;
    }>;
  };
}

export interface AnalyticsResponse extends ApiResponse<AnalyticsData> {}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export interface WhatsAppWebhookEvent extends WebhookEvent {
  type: "whatsapp.message.received" | "whatsapp.message.status";
  source: "whatsapp";
  data: {
    from: string;
    to: string;
    messageId: string;
    content?: string;
    status?: string;
  };
}

// File upload types
export interface FileUploadRequest {
  file: File;
  category: "watch-image" | "document" | "certificate";
  watchId?: number;
}

export interface FileUploadResponse extends ApiResponse<{
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}> {}

// Export types for external consumption
export type {
  ApiResponse,
  PaginationParams,
  PaginationInfo,
  PaginatedResponse,
  RequestContext,
  ApiError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError
};

// HTTP status code constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// API endpoint constants
export const API_ENDPOINTS = {
  // Public endpoints
  WATCHES: "/api/watches",
  WATCH_DETAIL: "/api/watches/:id",
  WATCH_SEARCH: "/api/watches/search",
  INQUIRIES: "/api/inquiries",
  SELL_SUBMISSIONS: "/api/sell",
  
  // Auth endpoints
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  ME: "/api/auth/me",
  CHANGE_PASSWORD: "/api/auth/change-password",
  
  // Admin endpoints
  ADMIN_WATCHES: "/api/admin/watches",
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_INQUIRIES: "/api/admin/inquiries",
  ADMIN_SELL_SUBMISSIONS: "/api/admin/sell-submissions",
  
  // Integration endpoints
  WATCHCHARTS_SEARCH: "/api/watchcharts/search",
  WHATSAPP_SEND: "/api/whatsapp/send",
  SETTINGS: "/api/settings",
  API_KEYS: "/api/keys",
  
  // Utility endpoints
  HEALTH: "/api/health",
  DOCS: "/api/docs"
} as const;