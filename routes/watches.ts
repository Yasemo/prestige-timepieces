// routes/watches.ts - Watch management routes
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Database } from "@sqlite";
import { DatabaseHelper } from "../database/init.ts";
import { authMiddleware } from "../middleware/auth.ts";

export const watchRoutes = new Router();

// Get all watches (public)
watchRoutes.get("/api/watches", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const watches = helper.selectAll("watches", "status = ?", ["available"]);
    
    ctx.response.body = {
      success: true,
      data: watches,
      count: watches.length
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch watches",
      details: error.message
    };
  }
});

// Get single watch (public)
watchRoutes.get("/api/watches/:id", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid watch ID" };
      return;
    }
    
    const watch = helper.selectOne("watches", "id = ? AND status = ?", [id, "available"]);
    
    if (!watch) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Watch not found" };
      return;
    }
    
    ctx.response.body = {
      success: true,
      data: watch
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch watch",
      details: error.message
    };
  }
});

// Get watches by brand (public)
watchRoutes.get("/api/watches/brand/:brand", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const brand = ctx.params.brand;
    
    const watches = helper.selectAll("watches", "LOWER(brand) = LOWER(?) AND status = ?", [brand, "available"]);
    
    ctx.response.body = {
      success: true,
      data: watches,
      count: watches.length
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch watches by brand",
      details: error.message
    };
  }
});

// Search watches (public)
watchRoutes.get("/api/watches/search", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const url = new URL(ctx.request.url);
    const query = url.searchParams.get("q");
    const brand = url.searchParams.get("brand");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const condition = url.searchParams.get("condition");
    
    let whereClause = "status = 'available'";
    const params: any[] = [];
    
    if (query) {
      whereClause += " AND (LOWER(brand) LIKE ? OR LOWER(model) LIKE ? OR LOWER(reference) LIKE ?)";
      const searchTerm = `%${query.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (brand) {
      whereClause += " AND LOWER(brand) = LOWER(?)";
      params.push(brand);
    }
    
    if (minPrice) {
      whereClause += " AND price >= ?";
      params.push(parseInt(minPrice));
    }
    
    if (maxPrice) {
      whereClause += " AND price <= ?";
      params.push(parseInt(maxPrice));
    }
    
    if (condition) {
      whereClause += " AND LOWER(condition) = LOWER(?)";
      params.push(condition);
    }
    
    const helper = new DatabaseHelper(db);
    const watches = helper.selectAll("watches", whereClause, params);
    
    ctx.response.body = {
      success: true,
      data: watches,
      count: watches.length,
      filters: { query, brand, minPrice, maxPrice, condition }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Search failed",
      details: error.message
    };
  }
});

// Admin routes (require authentication)

// Get all watches for admin (includes sold/removed)
watchRoutes.get("/api/admin/watches", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const watches = helper.selectAll("watches", "", []);
    const stats = helper.getStats();
    
    ctx.response.body = {
      success: true,
      data: watches,
      stats: stats,
      count: watches.length
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch admin watches",
      details: error.message
    };
  }
});

// Create new watch (admin only)
watchRoutes.post("/api/admin/watches", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Validate required fields
    const required = ["brand", "model", "reference", "condition", "price"];
    for (const field of required) {
      if (!body[field]) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: `Missing required field: ${field}`
        };
        return;
      }
    }
    
    // Prepare watch data
    const watchData = {
      brand: body.brand,
      model: body.model,
      reference: body.reference,
      year: body.year || null,
      condition: body.condition,
      price: parseInt(body.price),
      market_price: body.market_price ? parseInt(body.market_price) : null,
      description: body.description || "",
      image: body.image || "⌚",
      accessories: body.accessories || "",
      watch_charts_uuid: body.watch_charts_uuid || null,
      status: body.status || "available"
    };
    
    const watchId = helper.insert("watches", watchData);
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "Watch created successfully",
      data: { id: watchId, ...watchData }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to create watch",
      details: error.message
    };
  }
});

// Update watch (admin only)
watchRoutes.put("/api/admin/watches/:id", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid watch ID" };
      return;
    }
    
    // Check if watch exists
    const existingWatch = helper.selectOne("watches", "id = ?", [id]);
    if (!existingWatch) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Watch not found" };
      return;
    }
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Prepare update data (only include provided fields)
    const updateData: Record<string, any> = {};
    
    if (body.brand) updateData.brand = body.brand;
    if (body.model) updateData.model = body.model;
    if (body.reference) updateData.reference = body.reference;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.condition) updateData.condition = body.condition;
    if (body.price !== undefined) updateData.price = parseInt(body.price);
    if (body.market_price !== undefined) updateData.market_price = body.market_price ? parseInt(body.market_price) : null;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image) updateData.image = body.image;
    if (body.accessories !== undefined) updateData.accessories = body.accessories;
    if (body.watch_charts_uuid !== undefined) updateData.watch_charts_uuid = body.watch_charts_uuid;
    if (body.status) updateData.status = body.status;
    
    const success = helper.update("watches", updateData, "id = ?", [id]);
    
    if (success) {
      const updatedWatch = helper.selectOne("watches", "id = ?", [id]);
      ctx.response.body = {
        success: true,
        message: "Watch updated successfully",
        data: updatedWatch
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Failed to update watch"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update watch",
      details: error.message
    };
  }
});

// Delete watch (admin only)
watchRoutes.delete("/api/admin/watches/:id", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid watch ID" };
      return;
    }
    
    // Check if watch exists
    const existingWatch = helper.selectOne("watches", "id = ?", [id]);
    if (!existingWatch) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Watch not found" };
      return;
    }
    
    // Soft delete by updating status (preserve data for history)
    const success = helper.update("watches", { status: "deleted" }, "id = ?", [id]);
    
    if (success) {
      ctx.response.body = {
        success: true,
        message: "Watch deleted successfully"
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Failed to delete watch"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to delete watch",
      details: error.message
    };
  }
});

// Get inventory statistics (admin only)
watchRoutes.get("/api/admin/stats", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const stats = helper.getStats();
    
    // Additional detailed stats
    const brandStats = db.prepare(`
      SELECT brand, COUNT(*) as count, AVG(price) as avg_price, SUM(price) as total_value
      FROM watches 
      WHERE status = 'available'
      GROUP BY brand
      ORDER BY count DESC
    `).all();
    
    const conditionStats = db.prepare(`
      SELECT condition, COUNT(*) as count
      FROM watches 
      WHERE status = 'available'
      GROUP BY condition
    `).all();
    
    const recentActivity = db.prepare(`
      SELECT 'watch_added' as type, brand || ' ' || model as description, created_at
      FROM watches 
      WHERE created_at > datetime('now', '-30 days')
      UNION ALL
      SELECT 'inquiry' as type, 'Inquiry for ' || w.brand || ' ' || w.model as description, i.created_at
      FROM inquiries i
      LEFT JOIN watches w ON i.watch_id = w.id
      WHERE i.created_at > datetime('now', '-30 days')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    ctx.response.body = {
      success: true,
      data: {
        overview: stats,
        brandBreakdown: brandStats,
        conditionBreakdown: conditionStats,
        recentActivity: recentActivity
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch statistics",
      details: error.message
    };
  }
});
