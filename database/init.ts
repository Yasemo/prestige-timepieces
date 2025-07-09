// database/init.ts - Database initialization and schema
import { Database } from "https://deno.land/x/sqlite3@0.12.0/mod.ts";

export async function initializeDatabase(db: Database) {
  console.log("🗄️ Initializing database...");

  // Create watches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS watches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      reference TEXT NOT NULL,
      year INTEGER,
      condition TEXT NOT NULL,
      price INTEGER NOT NULL,
      market_price INTEGER,
      description TEXT,
      image TEXT DEFAULT '⌚',
      image_url TEXT,
      accessories TEXT,
      watch_charts_uuid TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add image_url column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE watches ADD COLUMN image_url TEXT`);
  } catch {
    // Column already exists or other error, ignore
  }

  // Create inquiries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watch_id INTEGER,
      type TEXT NOT NULL DEFAULT 'inquiry',
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (watch_id) REFERENCES watches (id)
    )
  `);

  // Create sell_submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sell_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      reference TEXT,
      year INTEGER,
      condition TEXT NOT NULL,
      accessories TEXT,
      description TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      estimated_value INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin_users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'admin',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create API keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      key_name TEXT NOT NULL,
      key_value TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample data if tables are empty
  const watchCount = db.prepare("SELECT COUNT(*) as count FROM watches").get() as { count: number };
  
  if (watchCount.count === 0) {
    console.log("📦 Inserting sample data...");
    
    // Sample watches
    const insertWatch = db.prepare(`
      INSERT INTO watches (brand, model, reference, year, condition, price, market_price, description, image, accessories)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertWatch.run("Rolex", "Submariner Date", "116610LN", 2019, "Excellent", 12500, 13200, 
      "Classic black bezel Submariner in excellent condition with box and papers.", "⌚", "Box, papers, warranty card");
    
    insertWatch.run("Omega", "Speedmaster Professional", "311.30.42.30.01.005", 2020, "Very Good", 4200, 4500,
      "The iconic Moonwatch with hesalite crystal and manual wind movement.", "🌙", "Box, papers");
    
    insertWatch.run("Patek Philippe", "Calatrava", "5196P", 2018, "Excellent", 28500, 30000,
      "Platinum dress watch with small seconds and leather strap.", "👑", "Full set");
    
    insertWatch.run("Audemars Piguet", "Royal Oak", "15400ST", 2017, "Good", 22000, 24000,
      "Iconic octagonal bezel sports watch in stainless steel.", "💎", "Box only");

    // Default admin user (password: admin123)
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password_hash, email)
      VALUES (?, ?, ?)
    `);
    
    // Simple hash for demo - in production use proper bcrypt
    const simpleHash = btoa("admin123"); // Base64 encoding for demo
    insertAdmin.run("admin", simpleHash, "admin@prestigetimepieces.com");

    // Default settings
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value, description)
      VALUES (?, ?, ?)
    `);
    
    insertSetting.run("whatsapp_number", "+1234567890", "WhatsApp Business number");
    insertSetting.run("company_name", "Prestige Timepieces", "Company name");
    insertSetting.run("company_email", "info@prestigetimepieces.com", "Company email");
    insertSetting.run("watchcharts_api_enabled", "false", "WatchCharts API integration status");
  }

  console.log("✅ Database initialized successfully");
}

// Database helper functions
export class DatabaseHelper {
  constructor(private db: Database) {}

  // Generic query methods
  selectAll(table: string, where?: string, params?: any[]): any[] {
    let query = `SELECT * FROM ${table}`;
    if (where) {
      query += ` WHERE ${where}`;
    }
    return this.db.prepare(query).all(params || []);
  }

  selectOne(table: string, where: string, params: any[]): any {
    const query = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    return this.db.prepare(query).get(params);
  }

  insert(table: string, data: Record<string, any>): number {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    this.db.prepare(query).run(values);
    return this.db.lastInsertRowId;
  }

  update(table: string, data: Record<string, any>, where: string, whereParams: any[]): boolean {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${where}`;
    const changes = this.db.prepare(query).run([...values, ...whereParams]);
    return changes > 0;
  }

  delete(table: string, where: string, params: any[]): boolean {
    const query = `DELETE FROM ${table} WHERE ${where}`;
    const changes = this.db.prepare(query).run(params);
    return changes > 0;
  }

  // Utility methods
  getStats() {
    const stats = {
      totalWatches: this.db.prepare("SELECT COUNT(*) as count FROM watches WHERE status = 'available'").get() as { count: number },
      totalValue: this.db.prepare("SELECT SUM(price) as total FROM watches WHERE status = 'available'").get() as { total: number },
      avgPrice: this.db.prepare("SELECT AVG(price) as avg FROM watches WHERE status = 'available'").get() as { avg: number },
      recentInquiries: this.db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE created_at > datetime('now', '-7 days')").get() as { count: number }
    };

    return {
      totalWatches: stats.totalWatches.count,
      totalValue: stats.totalValue.total || 0,
      avgPrice: Math.round(stats.avgPrice.avg || 0),
      recentInquiries: stats.recentInquiries.count
    };
  }
}
