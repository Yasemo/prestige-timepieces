// utils/formatting.ts - Data formatting utilities

import { Watch, WatchCondition, WatchStatus, WATCH_CONDITIONS, WATCH_STATUSES } from "../types/watch.ts";
import { User, UserRole, USER_ROLES } from "../types/user.ts";

// Currency formatting options
export interface CurrencyOptions {
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD";
  locale: string;
  showSymbol: boolean;
  showCode: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const DEFAULT_CURRENCY_OPTIONS: CurrencyOptions = {
  currency: "USD",
  locale: "en-US",
  showSymbol: true,
  showCode: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
};

// Date formatting options
export interface DateOptions {
  format: "short" | "medium" | "long" | "full" | "relative" | "iso";
  locale: string;
  timezone?: string;
  includeTime?: boolean;
}

export const DEFAULT_DATE_OPTIONS: DateOptions = {
  format: "medium",
  locale: "en-US",
  includeTime: false
};

// Currency formatting
export function formatCurrency(
  amount: number,
  options: Partial<CurrencyOptions> = {}
): string {
  const opts = { ...DEFAULT_CURRENCY_OPTIONS, ...options };
  
  try {
    const formatter = new Intl.NumberFormat(opts.locale, {
      style: "currency",
      currency: opts.currency,
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits
    });
    
    let formatted = formatter.format(amount);
    
    // Add currency code if requested
    if (opts.showCode && !opts.showSymbol) {
      formatted = `${amount.toLocaleString(opts.locale)} ${opts.currency}`;
    } else if (opts.showCode && opts.showSymbol) {
      formatted = `${formatted} ${opts.currency}`;
    }
    
    return formatted;
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `$${amount.toLocaleString()}`;
  }
}

// Format price with appropriate precision
export function formatPrice(price: number, currency: string = "USD"): string {
  if (price >= 1000000) {
    return formatCurrency(price / 1000000, { currency: currency as any }) + "M";
  } else if (price >= 1000) {
    return formatCurrency(price / 1000, { currency: currency as any }) + "K";
  }
  return formatCurrency(price, { currency: currency as any });
}

// Format price range
export function formatPriceRange(minPrice: number, maxPrice: number, currency: string = "USD"): string {
  const min = formatCurrency(minPrice, { currency: currency as any });
  const max = formatCurrency(maxPrice, { currency: currency as any });
  return `${min} - ${max}`;
}

// Date formatting
export function formatDate(
  date: string | Date,
  options: Partial<DateOptions> = {}
): string {
  const opts = { ...DEFAULT_DATE_OPTIONS, ...options };
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  
  try {
    switch (opts.format) {
      case "relative":
        return formatRelativeDate(dateObj);
      case "iso":
        return dateObj.toISOString();
      case "short":
        return dateObj.toLocaleDateString(opts.locale, { 
          year: "numeric", 
          month: "short", 
          day: "numeric",
          ...(opts.includeTime && { 
            hour: "numeric", 
            minute: "numeric" 
          })
        });
      case "medium":
        return dateObj.toLocaleDateString(opts.locale, { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          ...(opts.includeTime && { 
            hour: "numeric", 
            minute: "numeric" 
          })
        });
      case "long":
        return dateObj.toLocaleDateString(opts.locale, { 
          weekday: "long",
          year: "numeric", 
          month: "long", 
          day: "numeric",
          ...(opts.includeTime && { 
            hour: "numeric", 
            minute: "numeric",
            second: "numeric"
          })
        });
      case "full":
        return dateObj.toLocaleDateString(opts.locale, { 
          weekday: "long",
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "numeric", 
          minute: "numeric",
          second: "numeric",
          timeZoneName: "short"
        });
      default:
        return dateObj.toLocaleDateString(opts.locale);
    }
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateObj.toLocaleDateString();
  }
}

// Format relative date (e.g., "2 hours ago", "yesterday")
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }
}

// Watch-specific formatting
export function formatWatchTitle(watch: Watch): string {
  return `${watch.brand} ${watch.model}`;
}

export function formatWatchFullTitle(watch: Watch): string {
  const year = watch.year ? ` (${watch.year})` : '';
  return `${watch.brand} ${watch.model} ${watch.reference}${year}`;
}

export function formatWatchCondition(condition: WatchCondition): string {
  return WATCH_CONDITIONS[condition] || condition;
}

export function formatWatchStatus(status: WatchStatus): string {
  return WATCH_STATUSES[status] || status;
}

export function formatWatchSummary(watch: Watch): string {
  const condition = formatWatchCondition(watch.condition);
  const price = formatCurrency(watch.price);
  const year = watch.year ? ` ${watch.year}` : '';
  
  return `${watch.brand} ${watch.model}${year} - ${condition} - ${price}`;
}

// User formatting
export function formatUserName(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  } else if (user.first_name) {
    return user.first_name;
  } else if (user.last_name) {
    return user.last_name;
  }
  return user.username;
}

export function formatUserRole(role: UserRole): string {
  return USER_ROLES[role] || role;
}

export function formatUserSummary(user: User): string {
  const name = formatUserName(user);
  const role = formatUserRole(user.role);
  return `${name} (${role})`;
}

// Text formatting utilities
export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  if (!text) return text;
  return text.replace(/\w\S*/g, (word) => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

export function formatSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Number formatting
export function formatNumber(
  num: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {}
): string {
  const opts = {
    locale: "en-US",
    useGrouping: true,
    ...options
  };
  
  return num.toLocaleString(opts.locale, {
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits,
    useGrouping: opts.useGrouping
  });
}

export function formatPercentage(
  value: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const opts = {
    locale: "en-US",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat(opts.locale, {
    style: "percent",
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits
  }).format(value / 100);
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Duration formatting
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Phone number formatting
export function formatPhoneNumber(phone: string, format: "national" | "international" = "national"): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === "international") {
    // Format as +1 (555) 123-4567
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  } else {
    // Format as (555) 123-4567
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }
  
  return phone; // Return original if formatting fails
}

// Address formatting
export function formatAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): string {
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip) parts.push(address.zip);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
}

// Search highlighting
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Color utilities for status badges
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Watch statuses
    available: "#28a745",
    sold: "#dc3545",
    reserved: "#ffc107",
    deleted: "#6c757d",
    
    // Inquiry statuses
    pending: "#ffc107",
    responded: "#17a2b8",
    completed: "#28a745",
    closed: "#6c757d",
    
    // Sell submission statuses
    quoted: "#17a2b8",
    accepted: "#28a745",
    rejected: "#dc3545",
    
    // General statuses
    active: "#28a745",
    inactive: "#6c757d",
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8"
  };
  
  return statusColors[status.toLowerCase()] || "#6c757d";
}

// Data sanitization for display
export function sanitizeForDisplay(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// URL formatting
export function formatUrl(url: string): string {
  if (!url) return '';
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

// Export utility functions
export const formatters = {
  currency: formatCurrency,
  price: formatPrice,
  priceRange: formatPriceRange,
  date: formatDate,
  relativeDate: formatRelativeDate,
  watchTitle: formatWatchTitle,
  watchFullTitle: formatWatchFullTitle,
  watchCondition: formatWatchCondition,
  watchStatus: formatWatchStatus,
  watchSummary: formatWatchSummary,
  userName: formatUserName,
  userRole: formatUserRole,
  userSummary: formatUserSummary,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  formatSlug,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatDuration,
  formatPhoneNumber,
  formatAddress,
  highlightSearchTerm,
  getStatusColor,
  sanitizeForDisplay,
  formatUrl
};