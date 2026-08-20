import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { createClient } from "@supabase/supabase-js";
import { seedDemoData } from "../lib/seed";

// Load .env variables manually for CLI environment
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Clean quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    }
  }
}

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

async function main() {
  console.log("=== Wholesale MVP Demo Data Seeder ===");
  loadEnv();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.");
    process.exit(1);
  }

  // Parse origin to match next.js configuration
  let url = rawUrl;
  try {
    url = new URL(rawUrl).origin;
  } catch (e) {
    console.error("Error: Invalid NEXT_PUBLIC_SUPABASE_URL format.");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
    }
  });

  // Read credentials from env or prompt user
  let email = process.env.SEED_EMAIL || "";
  let password = process.env.SEED_PASSWORD || "";

  if (!email) {
    email = await askQuestion("Enter your Wholesale MVP login email: ");
  }
  if (!password) {
    password = await askQuestion("Enter your Wholesale MVP login password: ");
  }

  if (!email || !password) {
    console.error("Error: Email and password are required to seed data.");
    process.exit(1);
  }

  console.log(`Authenticating as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Authentication failed:", authError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error("Error: Could not retrieve authenticated user ID.");
    process.exit(1);
  }

  console.log("Authentication successful! User ID:", userId);
  
  try {
    await seedDemoData(supabase, userId);
    console.log("SUCCESS: Seeding completed successfully!");
    process.exit(0);
  } catch (seedError: any) {
    console.error("Error seeding data:", seedError.message || seedError);
    process.exit(1);
  }
}

main();
