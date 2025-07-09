// types/watch.ts - Watch-related TypeScript types

export interface Watch {
  id?: number;
  brand: string;
  model: string;
  reference: string;
  year?: number;
  condition: WatchCondition;
  price: number;
  market_price?: number;
  description?: string;
  image?: string;
  accessories?: string;
  watch_charts_uuid?: string;
  status?: WatchStatus;
  created_at?: string;
  updated_at?: string;
}

export type WatchCondition = 
  | "new" 
  | "excellent" 
  | "very-good" 
  | "good" 
  | "fair";

export type WatchStatus = 
  | "available" 
  | "sold" 
  | "reserved" 
  | "deleted";

export interface WatchSearchFilters {
  q?: string; // Search query
  brand?: string;
  model?: string;
  reference?: string;
  condition?: WatchCondition;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  status?: WatchStatus;
  sortBy?: WatchSortField;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export type WatchSortField = 
  | "price" 
  | "year" 
  | "brand" 
  | "model" 
  | "created_at" 
  | "updated_at";

export interface WatchStatistics {
  totalWatches: number;
  totalValue: number;
  avgPrice: number;
  recentInquiries: number;
  brandBreakdown: BrandStats[];
  conditionBreakdown: ConditionStats[];
  priceRanges: PriceRangeStats[];
}

export interface BrandStats {
  brand: string;
  count: number;
  avg_price: number;
  total_value: number;
  percentage: number;
}

export interface ConditionStats {
  condition: WatchCondition;
  count: number;
  avg_price: number;
  percentage: number;
}

export interface PriceRangeStats {
  range: string;
  min_price: number;
  max_price: number;
  count: number;
  percentage: number;
}

// WatchCharts API related types
export interface WatchChartsWatch {
  uuid: string;
  brand: string;
  model: string;
  reference: string;
  marketPrice: number;
  description?: string;
  image_url?: string;
  specifications?: WatchSpecifications;
  case_material?: string;
  movement?: string;
  case_size?: string;
  water_resistance?: string;
  power_reserve?: string;
  complications?: string[];
  dial_color?: string;
  bezel_material?: string;
  bracelet_material?: string;
  production_years?: {
    start: number;
    end?: number;
  };
  discontinued?: boolean;
  retail_price?: number;
  popularity_score?: number;
}

export interface WatchSpecifications {
  case_material: string;
  case_size: string;
  case_thickness?: string;
  dial_color: string;
  movement: string;
  movement_type: "automatic" | "manual" | "quartz";
  power_reserve?: string;
  water_resistance: string;
  crystal: string;
  bezel?: string;
  bracelet_material: string;
  clasp_type?: string;
  complications?: string[];
  functions?: string[];
  caliber?: string;
  jewels?: number;
  frequency?: string;
}

export interface WatchChartsSearchParams {
  brand_name: string;
  reference: string;
  model?: string;
}

export interface WatchChartsPriceHistory {
  date: string;
  price: number;
  source?: string;
}

export interface WatchMarketData {
  current_price: number;
  price_change_24h?: number;
  price_change_7d?: number;
  price_change_30d?: number;
  price_history: WatchChartsPriceHistory[];
  market_trends?: {
    trend: "up" | "down" | "stable";
    confidence: number;
    prediction_30d?: number;
  };
}

// Form submission types
export interface WatchFormData {
  brand: string;
  model: string;
  reference: string;
  year?: number;
  condition: WatchCondition;
  price: number;
  market_price?: number;
  description?: string;
  image?: string;
  accessories?: string;
  watch_charts_uuid?: string;
}

export interface WatchUpdateData extends Partial<WatchFormData> {
  status?: WatchStatus;
}

// Validation schemas
export interface WatchValidationRules {
  brand: {
    required: true;
    minLength: 1;
    maxLength: 100;
  };
  model: {
    required: true;
    minLength: 1;
    maxLength: 100;
  };
  reference: {
    required: true;
    minLength: 1;
    maxLength: 50;
  };
  year: {
    min: 1800;
    max: number; // Current year + 1
  };
  condition: {
    required: true;
    enum: WatchCondition[];
  };
  price: {
    required: true;
    min: 1;
    max: 10000000;
  };
  description: {
    maxLength: 2000;
  };
  accessories: {
    maxLength: 500;
  };
}

// Display and formatting helpers
export interface WatchDisplayOptions {
  showMarketPrice?: boolean;
  showCondition?: boolean;
  showYear?: boolean;
  showAccessories?: boolean;
  showDescription?: boolean;
  priceFormat?: "USD" | "EUR" | "GBP";
  compact?: boolean;
}

export interface WatchGridOptions {
  columns?: number;
  sortBy?: WatchSortField;
  sortOrder?: "asc" | "desc";
  showFilters?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
}

// Export utility type for creating new watches
export type CreateWatchData = Omit<Watch, 'id' | 'created_at' | 'updated_at' | 'status'>;
export type UpdateWatchData = Partial<CreateWatchData> & { status?: WatchStatus };

// Brand and model constants
export const SUPPORTED_BRANDS = [
  "Rolex",
  "Patek Philippe",
  "Audemars Piguet",
  "Omega",
  "Cartier",
  "Breitling",
  "TAG Heuer",
  "Vacheron Constantin", 
  "IWC",
  "Jaeger-LeCoultre",
  "Panerai",
  "Tudor",
  "Grand Seiko",
  "Seiko",
  "Citizen",
  "Tissot",
  "Longines",
  "Chopard",
  "Hublot",
  "Richard Mille"
] as const;

export type SupportedBrand = typeof SUPPORTED_BRANDS[number];

export const WATCH_CONDITIONS: Record<WatchCondition, string> = {
  "new": "New/Unworn",
  "excellent": "Excellent",
  "very-good": "Very Good", 
  "good": "Good",
  "fair": "Fair"
} as const;

export const WATCH_STATUSES: Record<WatchStatus, string> = {
  "available": "Available",
  "sold": "Sold",
  "reserved": "Reserved",
  "deleted": "Deleted"
} as const;