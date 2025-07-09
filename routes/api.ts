// routes/api.ts - External API integration routes
import { Router } from "@oak";
import { Database } from "@sqlite";
import { DatabaseHelper } from "../database/init.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { searchWatchCharts, getWatchInfo } from "../services/watchcharts.ts";
import { sendWhatsAppMessage } from "../services/whatsapp.ts";

export const apiRoutes = new Router();

// API Documentation endpoint
apiRoutes.get("/api/docs", (ctx) => {
  ctx.response.body = {
    title: "Prestige Timepieces API Documentation",
    version: "1.0.0",
    description: "RESTful API for luxury watch reseller platform",
    endpoints: {
      public: {
        "GET /api/watches": "Get all available watches",
        "GET /api/watches/:id": "Get specific watch details",
        "GET /api/watches/brand/:brand": "Get watches by brand",
        "GET /api/watches/search": "Search watches with filters",
        "POST /api/inquiries": "Submit watch inquiry",
        "POST /api/sell": "Submit sell request"
      },
      admin: {
        "POST /api/auth/login": "Admin login",
        "GET /api/auth/me": "Get current user info",
        "POST /api/auth/logout": "Admin logout",
        "GET /api/admin/watches": "Get all watches (admin view)",
        "POST /api/admin/watches": "Create new watch",
        "PUT /api/admin/watches/:id": "Update watch",
        "DELETE /api/admin/watches/:id": "Delete watch",
        "GET /api/admin/stats": "Get inventory statistics",
        "GET /api/admin/inquiries": "Get all inquiries",
        "PUT /api/admin/inquiries/:id": "Update inquiry",
        "GET /api/admin/sell-submissions": "Get sell submissions"
      },
      integrations: {
        "POST /api/watchcharts/search": "Search WatchCharts database",
        "GET /api/watchcharts/watch/:uuid": "Get watch info from WatchCharts",
        "POST /api/whatsapp/send": "Send WhatsApp message",
        "GET /api/settings": "Get system settings",
        "PUT /api/settings": "Update system settings"
      }
    },
    authentication: {
      type: "Bearer Token (JWT)",
      header: "Authorization: Bearer <token>",
      login: "POST /api/auth/login with username/password"
    }
  };
});

// WatchCharts API Integration

// Search WatchCharts database (admin only)
apiRoutes.post("/api/watchcharts/search", authMiddleware, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.brand || !body.reference) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Brand and reference are required"
      };
      return;
    }
    
    const results = await searchWatchCharts(body.brand, body.reference);
    
    ctx.response.body = {
      success: true,
      data: results,
      source: "WatchCharts API"
    };
  } catch (error) {
    console.error("WatchCharts search error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "WatchCharts search failed",
      details: error.message
    };
  }
});

// Get watch info from WatchCharts by UUID (admin only)
apiRoutes.get("/api/watchcharts/watch/:uuid", authMiddleware, async (ctx) => {
  try {
    const uuid = ctx.params.uuid;
    
    if (!uuid) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "UUID is required"
      };
      return;
    }
    
    const watchInfo = await getWatchInfo(uuid);
    
    ctx.response.body = {
      success: true,
      data: watchInfo,
      source: "WatchCharts API"
    };
  } catch (error) {
    console.error("WatchCharts get watch error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to get watch info from WatchCharts",
      details: error.message
    };
  }
});

// WhatsApp API Integration

// Send WhatsApp message (admin only)
apiRoutes.post("/api/whatsapp/send", authMiddleware, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.to || !body.message) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Recipient (to) and message are required"
      };
      return;
    }
    
    const result = await sendWhatsAppMessage(body.to, body.message);
    
    ctx.response.body = {
      success: true,
      data: result,
      message: "WhatsApp message sent successfully"
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to send WhatsApp message",
      details: error.message
    };
  }
});

// Settings Management

// Get system settings (admin only)
apiRoutes.get("/api/settings", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const settings = helper.selectAll("settings", "", []);
    
    // Convert to key-value object
    const settingsObj: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsObj[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });
    
    ctx.response.body = {
      success: true,
      data: settingsObj
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch settings",
      details: error.message
    };
  }
});

// Update system settings (admin only)
apiRoutes.put("/api/settings", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    const updatedSettings: string[] = [];
    
    for (const [key, value] of Object.entries(body)) {
      // Check if setting exists
      const existingSetting = helper.selectOne("settings", "key = ?", [key]);
      
      if (existingSetting) {
        // Update existing setting
        helper.update("settings", { value: value as string }, "key = ?", [key]);
        updatedSettings.push(key);
      } else {
        // Create new setting
        helper.insert("settings", {
          key: key,
          value: value as string,
          description: `User-defined setting: ${key}`
        });
        updatedSettings.push(key);
      }
    }
    
    ctx.response.body = {
      success: true,
      message: `Updated ${updatedSettings.length} setting(s)`,
      updated: updatedSettings
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update settings",
      details: error.message
    };
  }
});

// Get API key status (admin only)
apiRoutes.get("/api/keys/status", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const apiKeys = helper.selectAll("api_keys", "is_active = ?", [true]);
    
    const status: Record<string, any> = {
      watchcharts: {
        configured: false,
        active: false,
        last_used: null
      },
      whatsapp: {
        configured: false,
        active: false,
        last_used: null
      }
    };
    
    apiKeys.forEach((key: any) => {
      if (key.service === "watchcharts") {
        status.watchcharts.configured = true;
        status.watchcharts.active = key.is_active;
      } else if (key.service === "whatsapp") {
        status.whatsapp.configured = true;
        status.whatsapp.active = key.is_active;
      }
    });
    
    ctx.response.body = {
      success: true,
      data: status
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch API key status",
      details: error.message
    };
  }
});

// Update API keys (admin only)
apiRoutes.post("/api/keys", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.service || !body.key_name || !body.key_value) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Service, key_name, and key_value are required"
      };
      return;
    }
    
    // Deactivate existing keys for this service
    helper.update("api_keys", { is_active: false }, "service = ?", [body.service]);
    
    // Add new key
    const keyId = helper.insert("api_keys", {
      service: body.service,
      key_name: body.key_name,
      key_value: body.key_value,
      is_active: true
    });
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: `API key for ${body.service} updated successfully`,
      data: { id: keyId }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update API key",
      details: error.message
    };
  }
});

// Health check endpoint
apiRoutes.get("/api/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: "connected",
      watchcharts: "configured", // You can check actual API status here
      whatsapp: "configured"
    }
  };
});

// Test endpoint for WhatsApp (admin only)
apiRoutes.post("/api/test/whatsapp", authMiddleware, async (ctx) => {
  try {
    const testMessage = `🧪 Test message from Prestige Timepieces Admin Panel
    
Timestamp: ${new Date().toISOString()}
User: ${ctx.state.user.username}

This is a test to verify WhatsApp integration is working correctly.`;

    const result = await sendWhatsAppMessage("+1234567890", testMessage); // Use admin number
    
    ctx.response.body = {
      success: true,
      message: "Test WhatsApp message sent successfully",
      data: result
    };
  } catch (error) {
    console.error("WhatsApp test error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "WhatsApp test failed",
      details: error.message
    };
  }
});
