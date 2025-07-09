// utils/validation.ts - Input validation utilities

import { WatchCondition, WatchStatus, SUPPORTED_BRANDS } from "../types/watch.ts";
import { UserRole, PASSWORD_REQUIREMENTS } from "../types/user.ts";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  errors: string[];
}

export interface ValidationOptions {
  stripWhitespace?: boolean;
  allowEmpty?: boolean;
  customMessages?: Record<string, string>;
}

// Base validation functions
export function validateRequired(value: any, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateString(
  value: string, 
  fieldName: string, 
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  
  if (!options.allowEmpty && (!value || value.trim() === '')) {
    errors.push(`${fieldName} cannot be empty`);
    return { isValid: false, errors };
  }
  
  if (value && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { isValid: false, errors };
  }
  
  if (options.minLength && value.length < options.minLength) {
    errors.push(`${fieldName} must be at least ${options.minLength} characters long`);
  }
  
  if (options.maxLength && value.length > options.maxLength) {
    errors.push(`${fieldName} cannot exceed ${options.maxLength} characters`);
  }
  
  if (options.pattern && !options.pattern.test(value)) {
    errors.push(`${fieldName} format is invalid`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNumber(
  value: number, 
  fieldName: string, 
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }
  
  if (options.positive && value <= 0) {
    errors.push(`${fieldName} must be positive`);
  }
  
  if (options.min !== undefined && value < options.min) {
    errors.push(`${fieldName} must be at least ${options.min}`);
  }
  
  if (options.max !== undefined && value > options.max) {
    errors.push(`${fieldName} cannot exceed ${options.max}`);
  }
  
  if (options.integer && !Number.isInteger(value)) {
    errors.push(`${fieldName} must be an integer`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email: string, fieldName: string = "Email"): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim() === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push(`${fieldName} format is invalid`);
  }
  
  if (email.length > 255) {
    errors.push(`${fieldName} cannot exceed 255 characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePhoneNumber(phone: string, fieldName: string = "Phone"): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim() === '') {
    return { isValid: true, errors }; // Phone is optional
  }
  
  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    errors.push(`${fieldName} must be at least 10 digits`);
  }
  
  if (cleaned.length > 15) {
    errors.push(`${fieldName} cannot exceed 15 digits`);
  }
  
  // Basic phone number pattern (international format)
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    errors.push(`${fieldName} format is invalid`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePassword(password: string, fieldName: string = "Password"): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!password) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`${fieldName} must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`${fieldName} cannot exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(`${fieldName} must contain at least one uppercase letter`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(`${fieldName} must contain at least one lowercase letter`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push(`${fieldName} must contain at least one number`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push(`${fieldName} must contain at least one special character`);
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    warnings.push(`${fieldName} appears to be a common password. Consider using a stronger password.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Watch-specific validation functions
export function validateWatch(watchData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Brand validation
  const brandResult = validateString(watchData.brand, "Brand", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...brandResult.errors);
  
  // Check if brand is supported
  if (watchData.brand && !SUPPORTED_BRANDS.includes(watchData.brand)) {
    warnings.push(`Brand "${watchData.brand}" is not in the supported brands list`);
  }
  
  // Model validation
  const modelResult = validateString(watchData.model, "Model", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...modelResult.errors);
  
  // Reference validation
  const referenceResult = validateString(watchData.reference, "Reference", {
    minLength: 1,
    maxLength: 50
  });
  errors.push(...referenceResult.errors);
  
  // Year validation
  if (watchData.year) {
    const currentYear = new Date().getFullYear();
    const yearResult = validateNumber(watchData.year, "Year", {
      min: 1800,
      max: currentYear + 1,
      integer: true
    });
    errors.push(...yearResult.errors);
  }
  
  // Condition validation
  if (!watchData.condition) {
    errors.push("Condition is required");
  } else {
    const validConditions: WatchCondition[] = ["new", "excellent", "very-good", "good", "fair"];
    if (!validConditions.includes(watchData.condition)) {
      errors.push("Condition must be one of: " + validConditions.join(", "));
    }
  }
  
  // Price validation
  const priceResult = validateNumber(watchData.price, "Price", {
    min: 1,
    max: 10000000,
    positive: true
  });
  errors.push(...priceResult.errors);
  
  // Market price validation (optional)
  if (watchData.market_price) {
    const marketPriceResult = validateNumber(watchData.market_price, "Market Price", {
      min: 1,
      max: 10000000,
      positive: true
    });
    errors.push(...marketPriceResult.errors);
  }
  
  // Description validation (optional)
  if (watchData.description) {
    const descriptionResult = validateString(watchData.description, "Description", {
      maxLength: 2000,
      allowEmpty: true
    });
    errors.push(...descriptionResult.errors);
  }
  
  // Accessories validation (optional)
  if (watchData.accessories) {
    const accessoriesResult = validateString(watchData.accessories, "Accessories", {
      maxLength: 500,
      allowEmpty: true
    });
    errors.push(...accessoriesResult.errors);
  }
  
  // Status validation (optional)
  if (watchData.status) {
    const validStatuses: WatchStatus[] = ["available", "sold", "reserved", "deleted"];
    if (!validStatuses.includes(watchData.status)) {
      errors.push("Status must be one of: " + validStatuses.join(", "));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// User validation functions
export function validateUser(userData: any): ValidationResult {
  const errors: string[] = [];
  
  // Username validation
  const usernameResult = validateString(userData.username, "Username", {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  });
  errors.push(...usernameResult.errors);
  
  // Email validation
  const emailResult = validateEmail(userData.email, "Email");
  errors.push(...emailResult.errors);
  
  // Password validation (if provided)
  if (userData.password) {
    const passwordResult = validatePassword(userData.password, "Password");
    errors.push(...passwordResult.errors);
  }
  
  // Role validation
  if (userData.role) {
    const validRoles: UserRole[] = ["admin", "manager", "staff", "viewer"];
    if (!validRoles.includes(userData.role)) {
      errors.push("Role must be one of: " + validRoles.join(", "));
    }
  }
  
  // Optional fields
  if (userData.first_name) {
    const firstNameResult = validateString(userData.first_name, "First Name", {
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
      allowEmpty: true
    });
    errors.push(...firstNameResult.errors);
  }
  
  if (userData.last_name) {
    const lastNameResult = validateString(userData.last_name, "Last Name", {
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
      allowEmpty: true
    });
    errors.push(...lastNameResult.errors);
  }
  
  if (userData.phone) {
    const phoneResult = validatePhoneNumber(userData.phone, "Phone");
    errors.push(...phoneResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Inquiry validation
export function validateInquiry(inquiryData: any): ValidationResult {
  const errors: string[] = [];
  
  // Customer name validation
  const nameResult = validateString(inquiryData.customer_name, "Customer Name", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...nameResult.errors);
  
  // Customer email validation
  const emailResult = validateEmail(inquiryData.customer_email, "Customer Email");
  errors.push(...emailResult.errors);
  
  // Customer phone validation (optional)
  if (inquiryData.customer_phone) {
    const phoneResult = validatePhoneNumber(inquiryData.customer_phone, "Customer Phone");
    errors.push(...phoneResult.errors);
  }
  
  // Message validation
  const messageResult = validateString(inquiryData.message, "Message", {
    minLength: 1,
    maxLength: 2000
  });
  errors.push(...messageResult.errors);
  
  // Watch ID validation (optional)
  if (inquiryData.watch_id) {
    const watchIdResult = validateNumber(inquiryData.watch_id, "Watch ID", {
      min: 1,
      integer: true,
      positive: true
    });
    errors.push(...watchIdResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sell submission validation
export function validateSellSubmission(submissionData: any): ValidationResult {
  const errors: string[] = [];
  
  // Brand validation
  const brandResult = validateString(submissionData.brand, "Brand", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...brandResult.errors);
  
  // Model validation
  const modelResult = validateString(submissionData.model, "Model", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...modelResult.errors);
  
  // Reference validation (optional)
  if (submissionData.reference) {
    const referenceResult = validateString(submissionData.reference, "Reference", {
      maxLength: 50,
      allowEmpty: true
    });
    errors.push(...referenceResult.errors);
  }
  
  // Year validation (optional)
  if (submissionData.year) {
    const currentYear = new Date().getFullYear();
    const yearResult = validateNumber(submissionData.year, "Year", {
      min: 1800,
      max: currentYear + 1,
      integer: true
    });
    errors.push(...yearResult.errors);
  }
  
  // Condition validation
  const conditionResult = validateString(submissionData.condition, "Condition", {
    minLength: 1,
    maxLength: 50
  });
  errors.push(...conditionResult.errors);
  
  // Customer info validation
  const nameResult = validateString(submissionData.customer_name, "Customer Name", {
    minLength: 1,
    maxLength: 100
  });
  errors.push(...nameResult.errors);
  
  const emailResult = validateEmail(submissionData.customer_email, "Customer Email");
  errors.push(...emailResult.errors);
  
  const phoneResult = validatePhoneNumber(submissionData.customer_phone, "Customer Phone");
  errors.push(...phoneResult.errors);
  
  // Optional fields
  if (submissionData.description) {
    const descriptionResult = validateString(submissionData.description, "Description", {
      maxLength: 2000,
      allowEmpty: true
    });
    errors.push(...descriptionResult.errors);
  }
  
  if (submissionData.accessories) {
    const accessoriesResult = validateString(submissionData.accessories, "Accessories", {
      maxLength: 500,
      allowEmpty: true
    });
    errors.push(...accessoriesResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility functions
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing (assume US +1)
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

export function validateAndSanitize(data: any, validator: (data: any) => ValidationResult): {
  isValid: boolean;
  errors: string[];
  sanitizedData: any;
} {
  // Sanitize string fields
  const sanitizedData = { ...data };
  
  for (const [key, value] of Object.entries(sanitizedData)) {
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeInput(value);
    }
  }
  
  // Validate sanitized data
  const validationResult = validator(sanitizedData);
  
  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    sanitizedData
  };
}

// Batch validation
export function validateBatch<T>(
  items: T[], 
  validator: (item: T) => ValidationResult
): {
  isValid: boolean;
  results: Array<{ index: number; item: T; isValid: boolean; errors: string[] }>;
  totalErrors: number;
} {
  const results = items.map((item, index) => {
    const validation = validator(item);
    return {
      index,
      item,
      isValid: validation.isValid,
      errors: validation.errors
    };
  });
  
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  
  return {
    isValid: totalErrors === 0,
    results,
    totalErrors
  };
}

// Export all validation functions
export {
  validateWatch,
  validateUser, 
  validateInquiry,
  validateSellSubmission
};