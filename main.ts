// main.ts - Main server file
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
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
        
        // Handle image files
        if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const fileData = await Deno.readFile(filePath);
          const ext = filePath.split('.').pop()?.toLowerCase();
          
          switch (ext) {
            case 'jpg':
            case 'jpeg':
              ctx.response.type = "image/jpeg";
              break;
            case 'png':
              ctx.response.type = "image/png";
              break;
            case 'gif':
              ctx.response.type = "image/gif";
              break;
            case 'webp':
              ctx.response.type = "image/webp";
              break;
          }
          
          ctx.response.body = fileData;
          return;
        }
        
        // Handle text files
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

// File upload route
router.post("/api/admin/upload", authMiddleware, async (ctx) => {
  try {
    console.log("Upload endpoint hit");
    console.log("Content-Type:", ctx.request.headers.get("content-type"));
    
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "No body in request" };
      return;
    }
    
    const body = ctx.request.body({ type: "form-data" });
    const formData = await body.value.read();
    
    console.log("Form data structure:", {
      fields: formData.fields ? Object.keys(formData.fields) : [],
      files: formData.files ? formData.files.map((f: any) => ({ name: f.name, originalName: f.originalName, contentType: f.contentType })) : []
    });
    
    // Look for the file in the form data
    let file = null;
    
    // First check files array
    if (formData.files && formData.files.length > 0) {
      // Look for a file with name 'image' or just take the first one
      file = formData.files.find((f: any) => f.name === 'image') || formData.files[0];
      console.log("Found file in files array:", file.originalName || file.name);
    }
    
    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        error: "No image file found in upload",
        debug: {
          hasFiles: !!(formData.files && formData.files.length > 0),
          fileCount: formData.files?.length || 0,
          fieldKeys: formData.fields ? Object.keys(formData.fields) : []
        }
      };
      return;
    }
    
    console.log("Processing file:", {
      name: file.name,
      originalName: file.originalName,
      contentType: file.contentType,
      size: file.content?.length || 0
    });
    
    if (!file.content || file.content.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "File content is empty" };
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file.contentType || !allowedTypes.includes(file.contentType)) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        error: `Invalid file type: ${file.contentType || 'unknown'}. Only images are allowed: ${allowedTypes.join(', ')}` 
      };
      return;
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalName || file.name || 'image.jpg';
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `watch_${timestamp}.${extension}`;
    const filepath = `./static/images/watches/${filename}`;
    
    // Ensure directory exists
    try {
      await Deno.mkdir("./static/images/watches", { recursive: true });
    } catch {
      // Directory already exists
    }
    
    // Save file
    await Deno.writeFile(filepath, file.content);
    
    const imageUrl = `/static/images/watches/${filename}`;
    
    console.log(`Image uploaded successfully: ${filename} (${file.content.length} bytes)`);
    
    ctx.response.body = {
      success: true,
      imageUrl: imageUrl,
      filename: filename,
      size: file.content.length
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    console.error("Error stack:", error.stack);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "Failed to upload file",
      details: error?.message || "Unknown error"
    };
  }
});

// Routes
app.use(router.routes());
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
