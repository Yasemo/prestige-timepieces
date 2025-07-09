// middleware/auth.ts - Authentication middleware
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { verify, create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { DatabaseHelper } from "../database/init.ts";

const JWT_SECRET_STRING = Deno.env.get("JWT_SECRET") || "prestige-timepieces-secret-key-2024";
const JWT_ALG = "HS256";

// Create crypto key from string
const encoder = new TextEncoder();
const keyData = encoder.encode(JWT_SECRET_STRING);
const JWT_SECRET = await crypto.subtle.importKey(
  "raw",
  keyData,
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

export async function authMiddleware(ctx: Context, next: Next) {
  try {
    // Get token from Authorization header
    const authHeader = ctx.request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "Authentication required. Please provide a valid Bearer token."
      };
      return;
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Handle simple admin token for demo purposes
    if (token === "admin-token") {
      // Get default admin user from database
      const db = ctx.state.db;
      const helper = new DatabaseHelper(db);
      const user = helper.selectOne("admin_users", "username = ?", ["admin"]);
      
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Admin user not found."
        };
        return;
      }
      
      // Add user info to context
      ctx.state.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      // Continue to next middleware
      await next();
      return;
    }
    
    try {
      // Verify JWT token
      const payload = await verify(token, JWT_SECRET);
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "Token has expired. Please login again."
        };
        return;
      }
      
      // Get user from database to ensure they still exist and are active
      const db = ctx.state.db;
      const helper = new DatabaseHelper(db);
      const user = helper.selectOne("admin_users", "id = ?", [payload.sub]);
      
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "User not found. Please login again."
        };
        return;
      }
      
      // Add user info to context for use in subsequent middleware/handlers
      ctx.state.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      // Add token payload to context
      ctx.state.tokenPayload = payload;
      
      // Continue to next middleware
      await next();
      
    } catch (jwtError: any) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "Invalid token. Please login again.",
        details: jwtError?.message || "JWT verification failed"
      };
      return;
    }
    
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Authentication error",
      details: error?.message || "Unknown error"
    };
  }
}

// Optional middleware for role-based access control
export function requireRole(requiredRole: string) {
  return async (ctx: Context, next: Next) => {
    // This middleware should be used after authMiddleware
    if (!ctx.state.user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "Authentication required"
      };
      return;
    }
    
    if (ctx.state.user.role !== requiredRole && ctx.state.user.role !== "super_admin") {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: `Access denied. Required role: ${requiredRole}`
      };
      return;
    }
    
    await next();
  };
}

// Utility function to generate JWT token
export async function generateToken(user: any): Promise<string> {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const { create } = await import("https://deno.land/x/djwt@v3.0.1/mod.ts");
  return await create({ alg: JWT_ALG, typ: "JWT" }, payload, JWT_SECRET);
}

// Utility function to verify token (for use outside middleware)
export async function verifyToken(token: string): Promise<any> {
  try {
    return await verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
}
