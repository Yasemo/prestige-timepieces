// routes/inquiries.ts - Customer inquiry and sell submission routes
import { Router } from "@oak";
import { Database } from "@sqlite";
import { DatabaseHelper } from "../database/init.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { sendWhatsAppNotification } from "../services/whatsapp.ts";

export const inquiryRoutes = new Router();

// Submit inquiry for a specific watch (public)
inquiryRoutes.post("/api/inquiries", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Validate required fields
    const required = ["customer_name", "customer_email", "message"];
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
    
    // Validate watch_id if provided
    if (body.watch_id) {
      const watch = helper.selectOne("watches", "id = ? AND status = ?", [body.watch_id, "available"]);
      if (!watch) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Invalid watch ID or watch not available"
        };
        return;
      }
    }
    
    // Prepare inquiry data
    const inquiryData = {
      watch_id: body.watch_id || null,
      type: "inquiry",
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone || null,
      message: body.message,
      status: "pending"
    };
    
    const inquiryId = helper.insert("inquiries", inquiryData);
    
    // Send WhatsApp notification to admin
    try {
      let watchInfo = "";
      if (body.watch_id) {
        const watch = helper.selectOne("watches", "id = ?", [body.watch_id]);
        watchInfo = `\n\nWatch: ${watch.brand} ${watch.model} (${watch.reference}) - $${watch.price.toLocaleString()}`;
      }
      
      const message = `🔔 New Watch Inquiry #${inquiryId}
      
Customer: ${body.customer_name}
Email: ${body.customer_email}
Phone: ${body.customer_phone || 'Not provided'}${watchInfo}

Message: ${body.message}

Reply to this customer promptly!`;

      await sendWhatsAppNotification(message);
    } catch (whatsappError) {
      console.error("WhatsApp notification failed:", whatsappError);
      // Don't fail the request if WhatsApp fails
    }
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "Inquiry submitted successfully. We'll contact you within 24 hours!",
      data: { id: inquiryId, ...inquiryData }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to submit inquiry",
      details: error.message
    };
  }
});

// Submit sell request (public)
inquiryRoutes.post("/api/sell", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Validate required fields
    const required = ["brand", "model", "condition", "customer_name", "customer_email", "customer_phone"];
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
    
    // Prepare sell submission data
    const submissionData = {
      brand: body.brand,
      model: body.model,
      reference: body.reference || null,
      year: body.year || null,
      condition: body.condition,
      accessories: body.accessories || null,
      description: body.description || null,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      status: "pending"
    };
    
    const submissionId = helper.insert("sell_submissions", submissionData);
    
    // Send WhatsApp notification to admin
    try {
      const message = `💰 New Sell Submission #${submissionId}
      
Watch Details:
- Brand: ${body.brand}
- Model: ${body.model}
- Reference: ${body.reference || 'Not specified'}
- Year: ${body.year || 'Not specified'}
- Condition: ${body.condition}
- Accessories: ${body.accessories || 'Not specified'}

Customer: ${body.customer_name}
Email: ${body.customer_email}
Phone: ${body.customer_phone}

${body.description ? `Description: ${body.description}` : ''}

Provide quote and contact customer!`;

      await sendWhatsAppNotification(message);
    } catch (whatsappError) {
      console.error("WhatsApp notification failed:", whatsappError);
    }
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "Sell request submitted successfully. We'll provide a quote within 24 hours!",
      data: { id: submissionId, ...submissionData }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to submit sell request",
      details: error.message
    };
  }
});

// Admin routes (require authentication)

// Get all inquiries (admin only)
inquiryRoutes.get("/api/admin/inquiries", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const url = new URL(ctx.request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (status) {
      whereClause = "WHERE i.status = ?";
      params.push(status);
    }
    
    const query = `
      SELECT 
        i.*,
        w.brand || ' ' || w.model || ' (' || w.reference || ')' as watch_details,
        w.price as watch_price
      FROM inquiries i
      LEFT JOIN watches w ON i.watch_id = w.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const inquiries = db.prepare(query).all(params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM inquiries i ${whereClause}`;
    const countParams = status ? [status] : [];
    const totalResult = db.prepare(countQuery).get(countParams) as { total: number };
    
    ctx.response.body = {
      success: true,
      data: inquiries,
      pagination: {
        total: totalResult.total,
        limit,
        offset,
        hasMore: offset + limit < totalResult.total
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch inquiries",
      details: error.message
    };
  }
});

// Get all sell submissions (admin only)
inquiryRoutes.get("/api/admin/sell-submissions", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const url = new URL(ctx.request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (status) {
      whereClause = "WHERE status = ?";
      params.push(status);
    }
    
    whereClause += whereClause ? " ORDER BY created_at DESC" : "ORDER BY created_at DESC";
    whereClause += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const submissions = helper.selectAll("sell_submissions", whereClause.replace("ORDER BY created_at DESC LIMIT ? OFFSET ?", ""), params.slice(0, -2));
    
    // Apply limit and offset manually for this example
    const paginatedSubmissions = submissions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);
    
    ctx.response.body = {
      success: true,
      data: paginatedSubmissions,
      pagination: {
        total: submissions.length,
        limit,
        offset,
        hasMore: offset + limit < submissions.length
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch sell submissions",
      details: error.message
    };
  }
});

// Update inquiry status (admin only)
inquiryRoutes.put("/api/admin/inquiries/:id", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid inquiry ID" };
      return;
    }
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Check if inquiry exists
    const existingInquiry = helper.selectOne("inquiries", "id = ?", [id]);
    if (!existingInquiry) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Inquiry not found" };
      return;
    }
    
    const updateData: Record<string, any> = {};
    
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    const success = helper.update("inquiries", updateData, "id = ?", [id]);
    
    if (success) {
      const updatedInquiry = helper.selectOne("inquiries", "id = ?", [id]);
      ctx.response.body = {
        success: true,
        message: "Inquiry updated successfully",
        data: updatedInquiry
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Failed to update inquiry"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update inquiry",
      details: error.message
    };
  }
});

// Update sell submission (admin only)
inquiryRoutes.put("/api/admin/sell-submissions/:id", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid submission ID" };
      return;
    }
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Check if submission exists
    const existingSubmission = helper.selectOne("sell_submissions", "id = ?", [id]);
    if (!existingSubmission) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: "Submission not found" };
      return;
    }
    
    const updateData: Record<string, any> = {};
    
    if (body.status) updateData.status = body.status;
    if (body.estimated_value !== undefined) updateData.estimated_value = body.estimated_value;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    const success = helper.update("sell_submissions", updateData, "id = ?", [id]);
    
    if (success) {
      const updatedSubmission = helper.selectOne("sell_submissions", "id = ?", [id]);
      
      // Send WhatsApp notification if status changed to quoted
      if (body.status === "quoted" && body.estimated_value) {
        try {
          const message = `💰 Quote Update #${id}
          
${existingSubmission.customer_name}, we've reviewed your ${existingSubmission.brand} ${existingSubmission.model} and our offer is:

💵 $${parseInt(body.estimated_value).toLocaleString()}

${body.notes ? `Notes: ${body.notes}` : ''}

Please let us know if you'd like to proceed!`;

          await sendWhatsAppNotification(message);
        } catch (whatsappError) {
          console.error("WhatsApp notification failed:", whatsappError);
        }
      }
      
      ctx.response.body = {
        success: true,
        message: "Submission updated successfully",
        data: updatedSubmission
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Failed to update submission"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to update submission",
      details: error.message
    };
  }
});

// Delete inquiry (admin only)
inquiryRoutes.delete("/api/admin/inquiries/:id", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid inquiry ID" };
      return;
    }
    
    const success = helper.delete("inquiries", "id = ?", [id]);
    
    if (success) {
      ctx.response.body = {
        success: true,
        message: "Inquiry deleted successfully"
      };
    } else {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "Inquiry not found"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to delete inquiry",
      details: error.message
    };
  }
});

// Get inquiry statistics (admin only)
inquiryRoutes.get("/api/admin/inquiry-stats", authMiddleware, async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    
    const stats = {
      totalInquiries: db.prepare("SELECT COUNT(*) as count FROM inquiries").get() as { count: number },
      pendingInquiries: db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'").get() as { count: number },
      totalSellSubmissions: db.prepare("SELECT COUNT(*) as count FROM sell_submissions").get() as { count: number },
      pendingSellSubmissions: db.prepare("SELECT COUNT(*) as count FROM sell_submissions WHERE status = 'pending'").get() as { count: number },
      recentInquiries: db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE created_at > datetime('now', '-7 days')").get() as { count: number },
      recentSellSubmissions: db.prepare("SELECT COUNT(*) as count FROM sell_submissions WHERE created_at > datetime('now', '-7 days')").get() as { count: number }
    };
    
    ctx.response.body = {
      success: true,
      data: {
        total: stats.totalInquiries.count + stats.totalSellSubmissions.count,
        inquiries: {
          total: stats.totalInquiries.count,
          pending: stats.pendingInquiries.count,
          recent: stats.recentInquiries.count
        },
        sellSubmissions: {
          total: stats.totalSellSubmissions.count,
          pending: stats.pendingSellSubmissions.count,
          recent: stats.recentSellSubmissions.count
        }
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to fetch inquiry statistics",
      details: error.message
    };
  }
});
