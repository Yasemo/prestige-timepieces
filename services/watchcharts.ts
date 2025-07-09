// services/watchcharts.ts - WatchCharts API integration service
const WATCHCHARTS_API_BASE = "https://api.watchcharts.com/v3";
const WATCHCHARTS_API_KEY = Deno.env.get("WATCHCHARTS_API_KEY") || "";

// Rate limiting for WatchCharts API (max 1 request per second)
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second

async function makeWatchChartsRequest(endpoint: string, params?: Record<string, string>) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  // Build URL
  const url = new URL(`${WATCHCHARTS_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Check if API key is configured
  if (!WATCHCHARTS_API_KEY) {
    console.warn("WatchCharts API key not configured, using mock data");
    return generateMockWatchChartsResponse(endpoint, params);
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": WATCHCHARTS_API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "Prestige-Timepieces/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`WatchCharts API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("WatchCharts API request failed:", error);
    
    // Fallback to mock data if API fails
    console.log("Falling back to mock data");
    return generateMockWatchChartsResponse(endpoint, params);
  }
}

export async function searchWatchCharts(brandName: string, reference: string) {
  console.log(`Searching WatchCharts for ${brandName} ${reference}`);
  
  try {
    const response = await makeWatchChartsRequest("/search/watch", {
      brand_name: brandName.toLowerCase(),
      reference: reference
    });

    // Transform response to our expected format
    if (Array.isArray(response)) {
      return response.map(watch => ({
        uuid: watch.uuid || watch.id,
        brand: watch.brand || brandName,
        model: watch.model || watch.name,
        reference: watch.reference || reference,
        marketPrice: watch.market_price || watch.price || watch.current_price,
        description: watch.description || `${watch.brand} ${watch.model}`,
        image_url: watch.image_url,
        specifications: watch.specifications,
        case_material: watch.case_material,
        movement: watch.movement,
        case_size: watch.case_size
      }));
    } else if (response.results) {
      return response.results.map((watch: any) => ({
        uuid: watch.uuid || watch.id,
        brand: watch.brand || brandName,
        model: watch.model || watch.name,
        reference: watch.reference || reference,
        marketPrice: watch.market_price || watch.price || watch.current_price,
        description: watch.description || `${watch.brand} ${watch.model}`,
        image_url: watch.image_url,
        specifications: watch.specifications,
        case_material: watch.case_material,
        movement: watch.movement,
        case_size: watch.case_size
      }));
    } else {
      // Single result
      return [{
        uuid: response.uuid || response.id,
        brand: response.brand || brandName,
        model: response.model || response.name,
        reference: response.reference || reference,
        marketPrice: response.market_price || response.price || response.current_price,
        description: response.description || `${response.brand} ${response.model}`,
        image_url: response.image_url,
        specifications: response.specifications,
        case_material: response.case_material,
        movement: response.movement,
        case_size: response.case_size
      }];
    }
  } catch (error) {
    console.error("WatchCharts search failed:", error);
    throw new Error(`WatchCharts search failed: ${error.message}`);
  }
}

export async function getWatchInfo(uuid: string) {
  console.log(`Getting WatchCharts info for UUID: ${uuid}`);
  
  try {
    const response = await makeWatchChartsRequest(`/watch/info`, { uuid });

    return {
      uuid: response.uuid || uuid,
      brand: response.brand,
      model: response.model,
      reference: response.reference,
      marketPrice: response.market_price || response.current_price,
      priceHistory: response.price_history,
      specifications: response.specifications,
      case_material: response.case_material,
      movement: response.movement,
      case_size: response.case_size,
      water_resistance: response.water_resistance,
      power_reserve: response.power_reserve,
      complications: response.complications,
      dial_color: response.dial_color,
      bezel_material: response.bezel_material,
      bracelet_material: response.bracelet_material,
      image_urls: response.image_urls,
      description: response.description,
      production_years: response.production_years,
      discontinued: response.discontinued,
      retail_price: response.retail_price,
      market_trends: response.market_trends,
      popularity_score: response.popularity_score
    };
  } catch (error) {
    console.error("WatchCharts get info failed:", error);
    throw new Error(`WatchCharts get info failed: ${error.message}`);
  }
}

// Mock data generator for development/fallback
function generateMockWatchChartsResponse(endpoint: string, params?: Record<string, string>) {
  const brandName = params?.brand_name || "rolex";
  const reference = params?.reference || "116610LN";
  
  // Mock database of watch information
  const mockWatches: Record<string, any> = {
    "rolex": {
      "116610LN": {
        uuid: "mock-uuid-rolex-116610ln",
        brand: "Rolex",
        model: "Submariner Date",
        reference: "116610LN",
        marketPrice: 13200,
        case_material: "Oystersteel",
        movement: "Automatic (Cal. 3135)",
        case_size: "40mm",
        water_resistance: "300m",
        dial_color: "Black",
        bezel_material: "Unidirectional rotating black Cerachrom",
        bracelet_material: "Oystersteel Oyster bracelet"
      },
      "126610LN": {
        uuid: "mock-uuid-rolex-126610ln",
        brand: "Rolex",
        model: "Submariner Date",
        reference: "126610LN",
        marketPrice: 14500,
        case_material: "Oystersteel",
        movement: "Automatic (Cal. 3235)",
        case_size: "41mm",
        water_resistance: "300m",
        dial_color: "Black",
        bezel_material: "Unidirectional rotating black Cerachrom",
        bracelet_material: "Oystersteel Oyster bracelet"
      },
      "116500LN": {
        uuid: "mock-uuid-rolex-116500ln",
        brand: "Rolex",
        model: "Cosmograph Daytona",
        reference: "116500LN",
        marketPrice: 28500,
        case_material: "Oystersteel",
        movement: "Automatic (Cal. 4130)",
        case_size: "40mm",
        water_resistance: "100m",
        dial_color: "White",
        bezel_material: "Black Cerachrom",
        bracelet_material: "Oystersteel Oyster bracelet"
      }
    },
    "omega": {
      "311.30.42.30.01.005": {
        uuid: "mock-uuid-omega-speedmaster",
        brand: "Omega",
        model: "Speedmaster Professional Moonwatch",
        reference: "311.30.42.30.01.005",
        marketPrice: 4500,
        case_material: "Stainless Steel",
        movement: "Manual Wind (Cal. 1861)",
        case_size: "42mm",
        water_resistance: "50m",
        dial_color: "Black",
        bezel_material: "Black aluminum",
        bracelet_material: "Stainless steel bracelet"
      }
    },
    "patek-philippe": {
      "5196P": {
        uuid: "mock-uuid-patek-5196p",
        brand: "Patek Philippe",
        model: "Calatrava",
        reference: "5196P",
        marketPrice: 30000,
        case_material: "Platinum",
        movement: "Manual Wind (Cal. 215 PS)",
        case_size: "37mm",
        water_resistance: "30m",
        dial_color: "Silver",
        bezel_material: "Platinum",
        bracelet_material: "Leather strap"
      }
    },
    "audemars-piguet": {
      "15400ST": {
        uuid: "mock-uuid-ap-15400st",
        brand: "Audemars Piguet",
        model: "Royal Oak",
        reference: "15400ST",
        marketPrice: 24000,
        case_material: "Stainless Steel",
        movement: "Automatic (Cal. 3120)",
        case_size: "41mm",
        water_resistance: "50m",
        dial_color: "Blue",
        bezel_material: "Stainless steel octagonal",
        bracelet_material: "Stainless steel bracelet"
      }
    }
  };

  // Find matching watch
  const brandWatches = mockWatches[brandName.toLowerCase()];
  if (!brandWatches) {
    return [];
  }

  const watch = brandWatches[reference];
  if (!watch) {
    // Generate a generic response
    return [{
      uuid: `mock-uuid-${brandName}-${reference}`,
      brand: brandName.charAt(0).toUpperCase() + brandName.slice(1),
      model: "Unknown Model",
      reference: reference,
      marketPrice: Math.floor(Math.random() * 50000) + 5000,
      case_material: "Stainless Steel",
      movement: "Automatic",
      case_size: "40mm",
      description: `${brandName} ${reference}`
    }];
  }

  // Add common mock data
  const mockResponse = {
    ...watch,
    description: `${watch.brand} ${watch.model} ${watch.reference}`,
    specifications: {
      case_material: watch.case_material,
      movement: watch.movement,
      case_size: watch.case_size,
      water_resistance: watch.water_resistance,
      dial_color: watch.dial_color,
      bezel_material: watch.bezel_material,
      bracelet_material: watch.bracelet_material
    },
    price_history: [
      { date: "2024-01-01", price: watch.marketPrice * 0.9 },
      { date: "2024-06-01", price: watch.marketPrice * 0.95 },
      { date: "2024-12-01", price: watch.marketPrice }
    ],
    production_years: { start: 2010, end: null },
    discontinued: false,
    retail_price: watch.marketPrice * 0.7,
    popularity_score: Math.floor(Math.random() * 100) + 1
  };

  if (endpoint.includes("/watch/info")) {
    return mockResponse;
  } else {
    return [mockResponse];
  }
}

// Utility function to get supported brands
export function getSupportedBrands() {
  return [
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
    "Citizen"
  ];
}

// Utility function to validate brand name
export function isValidBrand(brand: string): boolean {
  const supportedBrands = getSupportedBrands();
  return supportedBrands.some(supportedBrand => 
    supportedBrand.toLowerCase() === brand.toLowerCase()
  );
}