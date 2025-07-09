// types/user.ts - User and authentication related types

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  // Additional profile fields
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  email_verified?: boolean;
  is_active?: boolean;
}

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface UserProfile extends Omit<User, 'password_hash'> {
  full_name?: string;
  permissions: UserPermission[];
  preferences: UserPreferences;
}

export interface UserPermission {
  resource: string;
  actions: UserAction[];
}

export type UserAction = 
  | "create" 
  | "read" 
  | "update" 
  | "delete" 
  | "list" 
  | "export" 
  | "import";

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: {
    new_inquiries: boolean;
    new_sell_submissions: boolean;
    watch_sold: boolean;
    low_inventory: boolean;
    system_alerts: boolean;
  };
  whatsapp: {
    new_inquiries: boolean;
    new_sell_submissions: boolean;
    urgent_alerts: boolean;
  };
  in_app: {
    all_notifications: boolean;
    sound_enabled: boolean;
    desktop_notifications: boolean;
  };
}

export interface DashboardPreferences {
  default_view: "grid" | "table";
  items_per_page: 10 | 25 | 50 | 100;
  auto_refresh: boolean;
  refresh_interval: number; // seconds
  visible_columns: string[];
  default_sort: {
    field: string;
    order: "asc" | "desc";
  };
}

// Authentication types
export interface AuthToken {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface JWTPayload {
  sub: number; // User ID
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  iss?: string; // Issuer
  aud?: string; // Audience
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Session types
export interface UserSession {
  id: string;
  user_id: number;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface SessionInfo {
  current: UserSession;
  active_sessions: UserSession[];
  total_sessions: number;
}

// User activity types
export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export type ActivityAction = 
  | "login" 
  | "logout" 
  | "create_watch" 
  | "update_watch" 
  | "delete_watch" 
  | "view_watch" 
  | "create_inquiry" 
  | "update_inquiry" 
  | "export_data" 
  | "import_data" 
  | "change_password" 
  | "update_settings";

// Role and permission definitions
export const USER_ROLES: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager", 
  staff: "Staff Member",
  viewer: "Viewer"
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  admin: [
    { resource: "watches", actions: ["create", "read", "update", "delete", "list", "export", "import"] },
    { resource: "inquiries", actions: ["create", "read", "update", "delete", "list", "export"] },
    { resource: "sell_submissions", actions: ["create", "read", "update", "delete", "list", "export"] },
    { resource: "users", actions: ["create", "read", "update", "delete", "list"] },
    { resource: "settings", actions: ["read", "update"] },
    { resource: "analytics", actions: ["read"] },
    { resource: "integrations", actions: ["read", "update"] }
  ],
  manager: [
    { resource: "watches", actions: ["create", "read", "update", "list", "export"] },
    { resource: "inquiries", actions: ["create", "read", "update", "list", "export"] },
    { resource: "sell_submissions", actions: ["create", "read", "update", "list", "export"] },
    { resource: "analytics", actions: ["read"] }
  ],
  staff: [
    { resource: "watches", actions: ["create", "read", "update", "list"] },
    { resource: "inquiries", actions: ["create", "read", "update", "list"] },
    { resource: "sell_submissions", actions: ["create", "read", "update", "list"] }
  ],
  viewer: [
    { resource: "watches", actions: ["read", "list"] },
    { resource: "inquiries", actions: ["read", "list"] },
    { resource: "sell_submissions", actions: ["read", "list"] }
  ]
} as const;

// User validation rules
export interface UserValidationRules {
  username: {
    required: true;
    minLength: 3;
    maxLength: 50;
    pattern: /^[a-zA-Z0-9_]+$/;
  };
  email: {
    required: true;
    maxLength: 255;
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  };
  password: {
    required: true;
    minLength: 8;
    maxLength: 128;
    requireUppercase: true;
    requireLowercase: true;
    requireNumbers: true;
    requireSpecialChars: true;
  };
  first_name: {
    maxLength: 50;
    pattern: /^[a-zA-Z\s]+$/;
  };
  last_name: {
    maxLength: 50;
    pattern: /^[a-zA-Z\s]+$/;
  };
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/;
    maxLength: 20;
  };
}

// User creation and update types
export type CreateUserData = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'>;
export type UpdateUserData = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash'>>;
export type PublicUserData = Omit<User, 'password_hash' | 'email'>;

// User search and filtering
export interface UserSearchFilters {
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
  search?: string; // Search in username, email, first_name, last_name
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
}

// Team and organization types
export interface Team {
  id: number;
  name: string;
  description?: string;
  members: TeamMember[];
  permissions: UserPermission[];
  created_at: string;
  updated_at?: string;
}

export interface TeamMember {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  joined_at: string;
}

// Audit and compliance types
export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface SecurityEvent {
  id: number;
  user_id?: number;
  event_type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ip_address: string;
  user_agent?: string;
  additional_data?: Record<string, any>;
  timestamp: string;
}

export type SecurityEventType = 
  | "login_success"
  | "login_failure"
  | "password_change"
  | "account_locked"
  | "suspicious_activity"
  | "unauthorized_access"
  | "data_export"
  | "permission_change";

// Default values and constants
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "auto",
  language: "en",
  timezone: "UTC",
  notifications: {
    email: {
      new_inquiries: true,
      new_sell_submissions: true,
      watch_sold: true,
      low_inventory: true,
      system_alerts: true
    },
    whatsapp: {
      new_inquiries: true,
      new_sell_submissions: true,
      urgent_alerts: true
    },
    in_app: {
      all_notifications: true,
      sound_enabled: true,
      desktop_notifications: true
    }
  },
  dashboard: {
    default_view: "grid",
    items_per_page: 25,
    auto_refresh: false,
    refresh_interval: 300,
    visible_columns: ["brand", "model", "price", "condition", "created_at"],
    default_sort: {
      field: "created_at",
      order: "desc"
    }
  }
};

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?"
} as const;

export const SESSION_DURATION = {
  default: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  remember_me: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  max_sessions: 5 // Maximum concurrent sessions per user
} as const;