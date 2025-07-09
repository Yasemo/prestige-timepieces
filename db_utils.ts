// db_utils.ts - Database utilities and management scripts
// Run with: deno run --allow-read --allow-write --allow-env db_utils.ts [command]

import { Database } from "@sqlite";
import { DatabaseHelper } from "./database/init.ts";

const DB_PATH = Deno.env.get("DATABASE_PATH") || "watches.db";

// Database management commands
class DatabaseManager {
  private db: Database;
  private helper: DatabaseHelper;

  constructor() {
    this.db = new Database(DB_PATH);
    this.helper = new DatabaseHelper(this.db);
  }

  close() {
    this.db.close();
  }

  // Backup database
  async backup(backupPath?: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultBackupPath = `backup_${timestamp}.db`;
    const targetPath = backupPath || defaultBackupPath;
    
    console.log(`📦 Creating backup: ${targetPath}`);
    
    try {
      await Deno.copyFile(DB_PATH, targetPath);
      console.log("✅ Backup created successfully");
    } catch (error) {
      console.error("❌ Backup failed:", error.message);
      throw error;
    }
  }

  // Restore database from backup
  async restore(backupPath: string): Promise<void> {
    console.log(`🔄 Restoring from backup: ${backupPath}`);
    
    try {
      // Verify backup file exists
      await Deno.stat(backupPath);
      
      // Close current database
      this.db.close();
      
      // Copy backup to main database
      await Deno.copyFile(backupPath, DB_PATH);
      
      // Reopen database
      this.db = new Database(DB_PATH);
      this.helper = new DatabaseHelper(this.db);
      
      console.log("✅ Database restored successfully");
    } catch (error) {
      console.error("❌ Restore failed:", error.message);
      throw error;
    }
  }

  // Export data to JSON
  exportToJson(outputPath?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultOutputPath = `export_${timestamp}.json`;
    const targetPath = outputPath || defaultOutputPath;
    
    console.log(`📄 Exporting data to: ${targetPath}`);
    
    try {
      const data = {
        watches: this.helper.selectAll("watches", "", []),
        inquiries: this.helper.selectAll("inquiries", "", []),
        sell_submissions: this.helper.selectAll("sell_submissions", "", []),
        admin_users: this.helper.selectAll("admin_users", "", []).map(user => ({
          ...user,
          password_hash: "[REDACTED]" // Don't export password hashes
        })),
        settings: this.helper.selectAll("settings", "", []),
        export_info: {
          timestamp: new Date().toISOString(),
          total_watches: this.helper.selectAll("watches", "", []).length,
          total_inquiries: this.helper.selectAll("inquiries", "", []).length
        }
      };
      
      Deno.writeTextFileSync(targetPath, JSON.stringify(data, null, 2));
      console.log("✅ Data exported successfully");
      console.log(`📊 Exported ${data.watches.length} watches, ${data.inquiries.length} inquiries`);
    } catch (error) {
      console.error("❌ Export failed:", error.message);
      throw error;
    }
  }

  // Import data from JSON
  importFromJson(jsonPath: string): void {
    console.log(`📥 Importing data from: ${jsonPath}`);
    
    try {
      const content = Deno.readTextFileSync(jsonPath);
      const data = JSON.parse(content);
      
      let imported = 0;
      
      // Import watches
      if (data.watches && Array.isArray(data.watches)) {
        for (const watch of data.watches) {
          try {
            delete watch.id; // Let database assign new ID
            this.helper.insert("watches", watch);
            imported++;
          } catch (error) {
            console.warn(`⚠️ Failed to import watch: ${error.message}`);
          }
        }
      }
      
      // Import inquiries
      if (data.inquiries && Array.isArray(data.inquiries)) {
        for (const inquiry of data.inquiries) {
          try {
            delete inquiry.id;
            this.helper.insert("inquiries", inquiry);
            imported++;
          } catch (error) {
            console.warn(`⚠️ Failed to import inquiry: ${error.message}`);
          }
        }
      }
      
      // Import sell submissions
      if (data.sell_submissions && Array.isArray(data.sell_submissions)) {
        for (const submission of data.sell_submissions) {
          try {
            delete submission.id;
            this.helper.insert("sell_submissions", submission);
            imported++;
          } catch (error) {
            console.warn(`⚠️ Failed to import sell submission: ${error.message}`);
          }
        }
      }
      
      // Import settings
      if (data.settings && Array.isArray(data.settings)) {
        for (const setting of data.settings) {
          try {
            // Update existing or insert new
            const existing = this.helper.selectOne("settings", "key = ?", [setting.key]);
            if (existing) {
              this.helper.update("settings", { value: setting.value }, "key = ?", [setting.key]);
            } else {
              this.helper.insert("settings", setting);
            }
            imported++;
          } catch (error) {
            console.warn(`⚠️ Failed to import setting: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Import completed: ${imported} records imported`);
    } catch (error) {
      console.error("❌ Import failed:", error.message);
      throw error;
    }
  }

  // Show database statistics
  showStats(): void {
    console.log("📊 Database Statistics");
    console.log("=" .repeat(40));
    
    const stats = this.helper.getStats();
    
    console.log(`Watches: ${stats.totalWatches}`);
    console.log(`Total Value: $${stats.totalValue.toLocaleString()}`);
    console.log(`Average Price: $${stats.avgPrice.toLocaleString()}`);
    console.log(`Recent Inquiries: ${stats.recentInquiries}`);
    
    // Additional stats
    const totalInquiries = this.helper.selectAll("inquiries", "", []).length;
    const totalSellSubmissions = this.helper.selectAll("sell_submissions", "", []).length;
    const totalAdminUsers = this.helper.selectAll("admin_users", "", []).length;
    
    console.log(`Total Inquiries: ${totalInquiries}`);
    console.log(`Sell Submissions: ${totalSellSubmissions}`);
    console.log(`Admin Users: ${totalAdminUsers}`);
    
    // Brand breakdown
    const brandStats = this.db.prepare(`
      SELECT brand, COUNT(*) as count, AVG(price) as avg_price
      FROM watches 
      WHERE status = 'available'
      GROUP BY brand
      ORDER BY count DESC
    `).all();
    
    console.log("\n🏷️ Brand Breakdown:");
    brandStats.forEach((brand: any) => {
      console.log(`  ${brand.brand}: ${brand.count} watches (avg: $${Math.round(brand.avg_price).toLocaleString()})`);
    });
  }

  // Clean up old data
  cleanup(daysOld: number = 90): void {
    console.log(`🧹 Cleaning up data older than ${daysOld} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffStr = cutoffDate.toISOString();
    
    try {
      // Delete old inquiries with status 'completed' or 'closed'
      const oldInquiries = this.db.prepare(`
        DELETE FROM inquiries 
        WHERE status IN ('completed', 'closed') 
        AND created_at < ?
      `).run(cutoffStr);
      
      // Delete old sell submissions with status 'completed' or 'rejected'
      const oldSubmissions = this.db.prepare(`
        DELETE FROM sell_submissions 
        WHERE status IN ('completed', 'rejected') 
        AND created_at < ?
      `).run(cutoffStr);
      
      console.log(`✅ Cleaned up ${oldInquiries.changes} old inquiries`);
      console.log(`✅ Cleaned up ${oldSubmissions.changes} old sell submissions`);
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
      throw error;
    }
  }

  // Vacuum database (optimize storage)
  vacuum(): void {
    console.log("🔧 Optimizing database...");
    
    try {
      this.db.exec("VACUUM");
      console.log("✅ Database optimized successfully");
    } catch (error) {
      console.error("❌ Vacuum failed:", error.message);
      throw error;
    }
  }

  // Check database integrity
  checkIntegrity(): boolean {
    console.log("🔍 Checking database integrity...");
    
    try {
      const result = this.db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
      
      if (result.integrity_check === "ok") {
        console.log("✅ Database integrity check passed");
        return true;
      } else {
        console.error("❌ Database integrity issues found:", result.integrity_check);
        return false;
      }
    } catch (error) {
      console.error("❌ Integrity check failed:", error.message);
      return false;
    }
  }

  // Reset database (WARNING: Deletes all data)
  reset(): void {
    console.log("⚠️ RESETTING DATABASE - THIS WILL DELETE ALL DATA!");
    
    try {
      // Drop all tables
      this.db.exec("DROP TABLE IF EXISTS watches");
      this.db.exec("DROP TABLE IF EXISTS inquiries");
      this.db.exec("DROP TABLE IF EXISTS sell_submissions");
      this.db.exec("DROP TABLE IF EXISTS admin_users");
      this.db.exec("DROP TABLE IF EXISTS api_keys");
      this.db.exec("DROP TABLE IF EXISTS settings");
      
      console.log("✅ Database reset completed");
      console.log("🔄 Please restart the server to reinitialize the database");
    } catch (error) {
      console.error("❌ Reset failed:", error.message);
      throw error;
    }
  }

  // Add sample data for testing
  addSampleData(): void {
    console.log("📦 Adding sample data...");
    
    try {
      // Sample watches
      const sampleWatches = [
        {
          brand: "Cartier",
          model: "Santos",
          reference: "WSSA0009",
          year: 2022,
          condition: "Excellent",
          price: 7200,
          market_price: 7800,
          description: "Cartier Santos Large model in stainless steel with blue leather strap",
          image: "💎",
          accessories: "Box, papers, warranty"
        },
        {
          brand: "Tudor",
          model: "Black Bay 58",
          reference: "M79030N-0001",
          year: 2021,
          condition: "Very Good",
          price: 3200,
          market_price: 3500,
          description: "Tudor Black Bay 58 Navy Blue with fabric strap",
          image: "⌚",
          accessories: "Box, papers"
        },
        {
          brand: "Grand Seiko",
          model: "Snowflake",
          reference: "SBGA211",
          year: 2020,
          condition: "Excellent",
          price: 4800,
          market_price: 5200,
          description: "Grand Seiko Spring Drive with iconic Snowflake dial",
          image: "❄️",
          accessories: "Full set"
        }
      ];
      
      let added = 0;
      for (const watch of sampleWatches) {
        this.helper.insert("watches", watch);
        added++;
      }
      
      console.log(`✅ Added ${added} sample watches`);
    } catch (error) {
      console.error("❌ Failed to add sample data:", error.message);
      throw error;
    }
  }

  // Show table schemas
  showSchema(): void {
    console.log("📋 Database Schema");
    console.log("=" .repeat(40));
    
    const tables = ["watches", "inquiries", "sell_submissions", "admin_users", "api_keys", "settings"];
    
    for (const table of tables) {
      try {
        const schema = this.db.prepare(`PRAGMA table_info(${table})`).all();
        console.log(`\n🏷️ Table: ${table}`);
        schema.forEach((column: any) => {
          const nullable = column.notnull ? "NOT NULL" : "NULL";
          const defaultVal = column.dflt_value ? ` DEFAULT ${column.dflt_value}` : "";
          console.log(`  ${column.name}: ${column.type} ${nullable}${defaultVal}`);
        });
      } catch (error) {
        console.log(`⚠️ Table ${table} not found`);
      }
    }
  }
}

// Command line interface
async function main() {
  const args = Deno.args;
  const command = args[0];
  
  if (!command) {
    console.log("🏆 Prestige Timepieces Database Utilities");
    console.log("\nAvailable commands:");
    console.log("  backup [path]           - Create database backup");
    console.log("  restore <path>          - Restore from backup");
    console.log("  export [path]           - Export data to JSON");
    console.log("  import <path>           - Import data from JSON");
    console.log("  stats                   - Show database statistics");
    console.log("  cleanup [days]          - Clean up old data (default: 90 days)");
    console.log("  vacuum                  - Optimize database storage");
    console.log("  integrity               - Check database integrity");
    console.log("  schema                  - Show table schemas");
    console.log("  sample                  - Add sample data");
    console.log("  reset                   - Reset database (WARNING: deletes all data)");
    console.log("\nExamples:");
    console.log("  deno run --allow-read --allow-write --allow-env db_utils.ts stats");
    console.log("  deno run --allow-read --allow-write --allow-env db_utils.ts backup my_backup.db");
    console.log("  deno run --allow-read --allow-write --allow-env db_utils.ts export watches_export.json");
    return;
  }
  
  const dbManager = new DatabaseManager();
  
  try {
    switch (command) {
      case "backup":
        await dbManager.backup(args[1]);
        break;
      
      case "restore":
        if (!args[1]) {
          console.error("❌ Please provide backup file path");
          Deno.exit(1);
        }
        await dbManager.restore(args[1]);
        break;
      
      case "export":
        dbManager.exportToJson(args[1]);
        break;
      
      case "import":
        if (!args[1]) {
          console.error("❌ Please provide JSON file path");
          Deno.exit(1);
        }
        dbManager.importFromJson(args[1]);
        break;
      
      case "stats":
        dbManager.showStats();
        break;
      
      case "cleanup":
        const days = args[1] ? parseInt(args[1]) : 90;
        dbManager.cleanup(days);
        break;
      
      case "vacuum":
        dbManager.vacuum();
        break;
      
      case "integrity":
        const isHealthy = dbManager.checkIntegrity();
        if (!isHealthy) {
          Deno.exit(1);
        }
        break;
      
      case "schema":
        dbManager.showSchema();
        break;
      
      case "sample":
        dbManager.addSampleData();
        break;
      
      case "reset":
        console.log("⚠️ This will permanently delete ALL data!");
        console.log("Are you sure? Type 'yes' to confirm:");
        
        const confirmation = prompt("Confirm reset:");
        if (confirmation === "yes") {
          dbManager.reset();
        } else {
          console.log("❌ Reset cancelled");
        }
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        Deno.exit(1);
    }
  } finally {
    dbManager.close();
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  await main();
}

export { DatabaseManager };
