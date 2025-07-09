// main.ts - Main server file
import { Application, Router } from "@oak";
import { oakCors } from "@cors";
import { Database } from "@sqlite";
import { initializeDatabase } from "./database/init.ts";
import { watchRoutes } from "./routes/watches.ts";
import { inquiryRoutes } from "./routes/inquiries.ts";
import { authRoutes } from "./routes/auth.ts";
import { apiRoutes } from "./routes/api.ts";
import { authMiddleware } from "./middleware/auth.ts";

// Initialize database
const db = new Database("watches.db");
await initializeDatabase(db);

const app = new Application();
const router = new Router();

// Middleware
app.use(oakCors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Add database to context
app.use(async (ctx, next) => {
  ctx.state.db = db;
  await next();
});

// Static file serving
app.use(async (ctx, next) => {
  try {
    if (ctx.request.url.pathname === "/" || ctx.request.url.pathname === "/index.html") {
      const content = await Deno.readTextFile("./static/index.html");
      ctx.response.type = "text/html";
      ctx.response.body = content;
      return;
    }
    
    if (ctx.request.url.pathname === "/admin" || ctx.request.url.pathname === "/admin.html") {
      const content = await Deno.readTextFile("./static/admin.html");
      ctx.response.type = "text/html";
      ctx.response.body = content;
      return;
    }

    // Serve other static files
    if (ctx.request.url.pathname.startsWith("/static/")) {
      try {
        const filePath = `.${ctx.request.url.pathname}`;
        const content = await Deno.readTextFile(filePath);
        
        // Set content type based on extension
        if (filePath.endsWith(".css")) {
          ctx.response.type = "text/css";
        } else if (filePath.endsWith(".js")) {
          ctx.response.type = "application/javascript";
        }
        
        ctx.response.body = content;
        return;
      } catch {
        // File not found, continue to next middleware
      }
    }
  } catch {
    // Error reading file, continue to next middleware
  }
  
  await next();
});

// Routes
app.use(watchRoutes.routes());
app.use(inquiryRoutes.routes());
app.use(authRoutes.routes());
app.use(apiRoutes.routes());

// 404 handler
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = { error: "Not Found" };
});

// Error handling
app.addEventListener("error", (evt) => {
  console.error("Server error:", evt.error);
});

const PORT = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🏆 Prestige Timepieces Server running on http://localhost:${PORT}`);
console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
console.log(`🔧 API Docs: http://localhost:${PORT}/api/docs`);

await app.listen({ port: PORT });
