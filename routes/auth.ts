// routes/auth.ts - Authentication routes
import { Router } from "@oak";
import { Database } from "@sqlite";
import { DatabaseHelper } from "../database/init.ts";
import { create, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

export const authRoutes = new Router();

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "prestige-timepieces-secret-key-2024";
const JWT_ALG = "HS256";

// Login endpoint
authRoutes.post("/api/auth/login", async (ctx) => {
  try {
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.username || !body.password) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Username and password are required"
      };
      return;
    }
    
    // Find user
    const user = helper.selectOne("admin_users", "username = ?", [body.username]);
    
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "Invalid credentials"
      };
      return;
    }
    
    // Verify password (simple base64 check for demo - use bcrypt in production)
    const expectedHash = btoa(body.password);
    if (user.password_hash !== expectedHash) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "Invalid credentials"
      };
      return;
    }
    
    // Update last login
    helper.update("admin_users", { last_login: new Date().toISOString() }, "id = ?", [user.id]);
    
    // Create JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = await create({ alg: JWT_ALG, typ: "JWT" }, payload, JWT_SECRET);
    
    ctx.response.body = {
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        }
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Login failed",
      details: error.message
    };
  }
});

// Logout endpoint (client-side token removal, but we can log it)
authRoutes.post("/api/auth/logout", async (ctx) => {
  try {
    // In a more sophisticated system, you might maintain a blacklist of tokens
    // For now, we'll just log the logout
    console.log("User logged out at", new Date().toISOString());
    
    ctx.response.body = {
      success: true,
      message: "Logout successful"
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Logout failed",
      details: error.message
    };
  }
});

// Get current user info
authRoutes.get("/api/auth/me", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "No valid token provided"
      };
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, JWT_SECRET, JWT_ALG);
    
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const user = helper.selectOne("admin_users", "id = ?", [payload.sub]);
    
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "User not found"
      };
      return;
    }
    
    ctx.response.body = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login
      }
    };
  } catch (error) {
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      error: "Invalid token",
      details: error.message
    };
  }
});

// Change password
authRoutes.post("/api/auth/change-password", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: "Authentication required" };
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, JWT_SECRET, JWT_ALG);
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.currentPassword || !body.newPassword) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Current password and new password are required"
      };
      return;
    }
    
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const user = helper.selectOne("admin_users", "id = ?", [payload.sub]);
    
    // Verify current password
    const currentHash = btoa(body.currentPassword);
    if (user.password_hash !== currentHash) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Current password is incorrect"
      };
      return;
    }
    
    // Update password
    const newHash = btoa(body.newPassword);
    const success = helper.update("admin_users", { password_hash: newHash }, "id = ?", [user.id]);
    
    if (success) {
      ctx.response.body = {
        success: true,
        message: "Password changed successfully"
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Failed to change password"
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Password change failed",
      details: error.message
    };
  }
});

// Create new admin user (super admin only)
authRoutes.post("/api/auth/create-user", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: "Authentication required" };
      return;
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, JWT_SECRET, JWT_ALG);
    
    const db = ctx.state.db as Database;
    const helper = new DatabaseHelper(db);
    
    const currentUser = helper.selectOne("admin_users", "id = ?", [payload.sub]);
    
    // Check if current user has permission (in this demo, all admins can create users)
    if (currentUser.role !== "admin") {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "Insufficient permissions"
      };
      return;
    }
    
    const body = await ctx.request.body({ type: "json" }).value;
    
    if (!body.username || !body.password || !body.email) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Username, password, and email are required"
      };
      return;
    }
    
    // Check if username or email already exists
    const existingUser = helper.selectOne("admin_users", "username = ? OR email = ?", [body.username, body.email]);
    if (existingUser) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Username or email already exists"
      };
      return;
    }
    
    // Create new user
    const userData = {
      username: body.username,
      password_hash: btoa(body.password),
      email: body.email,
      role: body.role || "admin"
    };
    
    const userId = helper.insert("admin_users", userData);
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "User created successfully",
      data: {
        id: userId,
        username: userData.username,
        email: userData.email,
        role: userData.role
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "User creation failed",
      details: error.message
    };
  }
});
