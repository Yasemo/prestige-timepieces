// utils/constants.ts - Application constants

// Application metadata
export const APP_CONFIG = {
  NAME: "Prestige Timepieces",
  VERSION: "1.0.0",
  DESCRIPTION: "Luxury Watch Reseller Platform",
  AUTHOR: "Prestige Timepieces Team",
  WEBSITE: "https://prestigetimepieces.com",
  SUPPORT_EMAIL: "support@prestigetimepieces.com",
  CONTACT_EMAIL: "info@prestigetimepieces.com",
  PHONE: "+1-234-567-8900",
  ADDRESS: {
    street: "123 Luxury Avenue",
    city: "Beverly Hills",
    state: "CA",
    zip: "90210",
    country: "USA"
  }
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  FILE_NAME: "watches.db",
  MAX_CONNECTIONS: 10,
  BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  BACKUP_RETENTION_DAYS: 30,
  VACUUM_INTERVAL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_QUERY_RETRIES: 3
} as const;

// API configuration
export const API_CONFIG = {
  BASE_PATH: "/api",
  VERSION: "v1",
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false
  },
  CORS: {
    ALLOWED_ORIGINS: ["http://localhost:3000", "http://localhost:8000"],
    ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    ALLOWED_HEADERS: ["Content-Type", "Authorization"],
    CREDENTIALS: true
  }
} as const;

// Authentication constants
export const AUTH_CONFIG = {
  JWT_SECRET: Deno.env.get("JWT_SECRET") || "prestige-timepieces-secret-key",
  JWT_EXPIRES_IN: "24h",
  JWT_REFRESH_EXPIRES_IN: "7d",
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  PASSWORD_RESET_EXPIRES: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION_EXPIRES: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// Watch-related constants
export const WATCH_CONFIG = {
  SUPPORTED_BRANDS: [
    "A. Lange & Söhne",
    "Audemars Piguet",
    "Blancpain",
    "Breguet",
    "Breitling",
    "Cartier",
    "Chopard",
    "Citizen",
    "Frederique Constant",
    "Grand Seiko",
    "Hamilton",
    "Hublot",
    "IWC",
    "Jaeger-LeCoultre",
    "Longines",
    "Montblanc",
    "Omega",
    "Oris",
    "Panerai",
    "Patek Philippe",
    "Richard Mille",
    "Rolex",
    "Seiko",
    "TAG Heuer",
    "Tissot",
    "Tudor",
    "Vacheron Constantin",
    "Zenith"
  ],
  CONDITIONS: {
    NEW: "new",
    EXCELLENT: "excellent",
    VERY_GOOD: "very-good",
    GOOD: "good",
    FAIR: "fair"
  },
  STATUSES: {
    AVAILABLE: "available",
    SOLD: "sold",
    RESERVED: "reserved",
    DELETED: "deleted"
  },
  PRICE_RANGES: [
    { min: 0, max: 1000, label: "Under $1,000" },
    { min: 1000, max: 5000, label: "$1,000 - $5,000" },
    { min: 5000, max: 10000, label: "$5,000 - $10,000" },
    { min: 10000, max: 25000, label: "$10,000 - $25,000" },
    { min: 25000, max: 50000, label: "$25,000 - $50,000" },
    { min: 50000, max: 100000, label: "$50,000 - $100,000" },
    { min: 100000, max: Infinity, label: "Over $100,000" }
  ],
  CATEGORIES: [
    "Dress Watch",
    "Sports Watch",
    "Dive Watch",
    "Pilot Watch",
    "GMT Watch",
    "Chronograph",
    "Complications",
    "Vintage",
    "Limited Edition"
  ],
  COMPLICATIONS: [
    "Date",
    "Day-Date",
    "GMT",
    "Chronograph",
    "Perpetual Calendar",
    "Annual Calendar",
    "Moon Phase",
    "Power Reserve",
    "Minute Repeater",
    "Tourbillon",
    "World Time"
  ],
  MATERIALS: [
    "Stainless Steel",
    "Gold",
    "Rose Gold",
    "White Gold",
    "Platinum",
    "Titanium",
    "Ceramic",
    "Carbon Fiber",
    "Bronze",
    "Two-Tone"
  ],
  MOVEMENTS: [
    "Automatic",
    "Manual Wind",
    "Quartz",
    "Spring Drive",
    "Kinetic",
    "Solar"
  ]
} as const;

// File upload constants
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
  ],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ],
  UPLOAD_PATHS: {
    WATCHES: "/uploads/watches",
    CERTIFICATES: "/uploads/certificates",
    DOCUMENTS: "/uploads/documents",
    AVATARS: "/uploads/avatars"
  },
  IMAGE_SIZES: {
    THUMBNAIL: { width: 150, height: 150 },
    SMALL: { width: 300, height: 300 },
    MEDIUM: { width: 600, height: 600 },
    LARGE: { width: 1200, height: 1200 }
  }
} as const;

// External API constants
export const EXTERNAL_API_CONFIG = {
  WATCHCHARTS: {
    BASE_URL: "https://api.watchcharts.com/v3",
    RATE_LIMIT: 1000, // 1 second between requests
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000 // 2 seconds
  },
  WHATSAPP: {
    TWILIO: {
      BASE_URL: "https://api.twilio.com/2010-04-01",
      RATE_LIMIT: 1000, // 1 second between requests
      TIMEOUT: 15000 // 15 seconds
    },
    META: {
      BASE_URL: "https://graph.facebook.com/v18.0",
      RATE_LIMIT: 500, // 0.5 seconds between requests
      TIMEOUT: 15000 // 15 seconds
    }
  },
  EMAIL: {
    SENDGRID: {
      BASE_URL: "https://api.sendgrid.com/v3",
      TIMEOUT: 10000 // 10 seconds
    },
    MAILGUN: {
      BASE_URL: "https://api.mailgun.net/v3",
      TIMEOUT: 10000 // 10 seconds
    }
  }
} as const;

// Validation constants
export const VALIDATION_CONFIG = {
  WATCH: {
    BRAND_MAX_LENGTH: 100,
    MODEL_MAX_LENGTH: 100,
    REFERENCE_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 2000,
    ACCESSORIES_MAX_LENGTH: 500,
    MIN_YEAR: 1800,
    MAX_YEAR: new Date().getFullYear() + 1,
    MIN_PRICE: 1,
    MAX_PRICE: 10000000
  },
  USER: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 50,
    PHONE_MAX_LENGTH: 20
  },
  INQUIRY: {
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    MESSAGE_MAX_LENGTH: 2000,
    PHONE_MAX_LENGTH: 20
  },
  SELL_SUBMISSION: {
    BRAND_MAX_LENGTH: 100,
    MODEL_MAX_LENGTH: 100,
    REFERENCE_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 2000,
    ACCESSORIES_MAX_LENGTH: 500,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PHONE_MAX_LENGTH: 20
  }
} as const;

// Business rules constants
export const BUSINESS_CONFIG = {
  COMMISSION_RATE: 0.15, // 15% commission
  TAX_RATE: 0.08, // 8% tax rate
  SHIPPING_COST: 50, // $50 shipping
  FREE_SHIPPING_THRESHOLD: 5000, // Free shipping over $5,000
  RETURN_POLICY_DAYS: 30,
  WARRANTY_PERIOD_DAYS: 365,
  INSPECTION_PERIOD_DAYS: 7,
  PAYMENT_TERMS: {
    NET_30: 30,
    NET_15: 15,
    IMMEDIATE: 0
  },
  INQUIRY_RESPONSE_TIME: 24 * 60 * 60 * 1000, // 24 hours
  QUOTE_VALIDITY_DAYS: 7,
  RESERVATION_HOLD_DAYS: 3
} as const;

// Notification constants
export const NOTIFICATION_CONFIG = {
  TYPES: {
    EMAIL: "email",
    SMS: "sms",
    WHATSAPP: "whatsapp",
    PUSH: "push",
    IN_APP: "in_app"
  },
  PRIORITIES: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent"
  },
  CATEGORIES: {
    INQUIRY: "inquiry",
    SELL_SUBMISSION: "sell_submission",
    WATCH_SOLD: "watch_sold",
    SYSTEM_ALERT: "system_alert",
    MARKETING: "marketing"
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  BATCH_SIZE: 100
} as const;

// Search constants
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  SEARCH_OPERATORS: [
    "AND",
    "OR",
    "NOT",
    "CONTAINS",
    "STARTS_WITH",
    "ENDS_WITH",
    "EXACT"
  ],
  SEARCHABLE_FIELDS: {
    WATCHES: ["brand", "model", "reference", "description"],
    USERS: ["username", "email", "first_name", "last_name"],
    INQUIRIES: ["customer_name", "customer_email", "message"],
    SELL_SUBMISSIONS: ["customer_name", "customer_email", "brand", "model"]
  },
  SORT_FIELDS: {
    WATCHES: ["brand", "model", "price", "year", "condition", "created_at"],
    USERS: ["username", "email", "role", "created_at", "last_login"],
    INQUIRIES: ["customer_name", "created_at", "status"],
    SELL_SUBMISSIONS: ["customer_name", "created_at", "status", "estimated_value"]
  }
} as const;

// Cache constants
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
  },
  KEYS: {
    WATCHES: "watches",
    WATCH_STATS: "watch_stats",
    BRANDS: "brands",
    SETTINGS: "settings",
    API_KEYS: "api_keys",
    USER_SESSIONS: "user_sessions"
  },
  MAX_SIZE: 1000, // Maximum number of cached items
  CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  
  // System errors
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  INVALID_OPERATION: "INVALID_OPERATION"
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
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
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  INQUIRY_CONFIRMATION: {
    SUBJECT: "Thank you for your inquiry - Prestige Timepieces",
    TEMPLATE_ID: "inquiry_confirmation"
  },
  SELL_SUBMISSION_CONFIRMATION: {
    SUBJECT: "Watch submission received - Prestige Timepieces",
    TEMPLATE_ID: "sell_submission_confirmation"
  },
  QUOTE_PROVIDED: {
    SUBJECT: "Your watch quote is ready - Prestige Timepieces",
    TEMPLATE_ID: "quote_provided"
  },
  WATCH_SOLD_NOTIFICATION: {
    SUBJECT: "Great news! Your watch has been sold",
    TEMPLATE_ID: "watch_sold_notification"
  },
  WELCOME: {
    SUBJECT: "Welcome to Prestige Timepieces",
    TEMPLATE_ID: "welcome"
  },
  PASSWORD_RESET: {
    SUBJECT: "Reset your password - Prestige Timepieces",
    TEMPLATE_ID: "password_reset"
  }
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  WATCH_REFERENCE: /^[A-Z0-9\-\.]+$/i,
  URL: /^https?:\/\/[^\s]+$/,
  SLUG: /^[a-z0-9-]+$/,
  COLOR_HEX: /^#[0-9A-F]{6}$/i,
  CURRENCY: /^\$?[\d,]+\.?\d*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const;

// Default values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 25,
    OFFSET: 0
  },
  SORT: {
    FIELD: "created_at",
    ORDER: "desc"
  },
  CURRENCY: "USD",
  LOCALE: "en-US",
  TIMEZONE: "UTC",
  THEME: "light",
  LANGUAGE: "en",
  WATCH_IMAGE: "⌚",
  USER_AVATAR: "👤"
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  WATCHCHARTS_INTEGRATION: true,
  WHATSAPP_INTEGRATION: true,
  EMAIL_NOTIFICATIONS: true,
  ADVANCED_SEARCH: true,
  BATCH_OPERATIONS: true,
  ANALYTICS: true,
  EXPORT_DATA: true,
  IMPORT_DATA: true,
  FILE_UPLOADS: true,
  CACHING: true,
  RATE_LIMITING: true,
  AUDIT_LOGGING: true
} as const;

// Environment-specific constants
export const ENV_CONFIG = {
  DEVELOPMENT: {
    LOG_LEVEL: "debug",
    CACHE_ENABLED: false,
    RATE_LIMIT_ENABLED: false,
    MOCK_EXTERNAL_APIS: true
  },
  PRODUCTION: {
    LOG_LEVEL: "info",
    CACHE_ENABLED: true,
    RATE_LIMIT_ENABLED: true,
    MOCK_EXTERNAL_APIS: false
  },
  TEST: {
    LOG_LEVEL: "warn",
    CACHE_ENABLED: false,
    RATE_LIMIT_ENABLED: false,
    MOCK_EXTERNAL_APIS: true
  }
} as const;

// Export all constants
export {
  APP_CONFIG,
  DATABASE_CONFIG,
  API_CONFIG,
  AUTH_CONFIG,
  WATCH_CONFIG,
  FILE_CONFIG,
  EXTERNAL_API_CONFIG,
  VALIDATION_CONFIG,
  BUSINESS_CONFIG,
  NOTIFICATION_CONFIG,
  SEARCH_CONFIG,
  CACHE_CONFIG,
  ERROR_CODES,
  HTTP_STATUS,
  EMAIL_TEMPLATES,
  REGEX_PATTERNS,
  DEFAULTS,
  FEATURE_FLAGS,
  ENV_CONFIG
};