// test-notifications-debug.ts
import { notifyInterestedEmail } from "./notifications.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the correct location
const envPath = path.join(__dirname, '.env');
console.log("📁 Looking for .env at:", envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env:", result.error);
} else {
  console.log("✅ .env loaded successfully");
}

// Debug: Check what environment variables are loaded
console.log("\n🔍 Environment Variables Check:");
console.log("SLACK_WEBHOOK_URL exists:", !!process.env.SLACK_WEBHOOK_URL);
console.log("SLACK_WEBHOOK_URL starts with 'https':", process.env.SLACK_WEBHOOK_URL?.startsWith('https'));
console.log("SLACK_WEBHOOK_URL length:", process.env.SLACK_WEBHOOK_URL?.length || 0);

if (process.env.SLACK_WEBHOOK_URL) {
  // Only show first and last 20 characters for security
  const url = process.env.SLACK_WEBHOOK_URL;
  const masked = url.substring(0, 20) + "..." + url.substring(url.length - 20);
  console.log("SLACK_WEBHOOK_URL (masked):", masked);
}

console.log("\nWEBHOOK_URL exists:", !!process.env.WEBHOOK_URL);

console.log("\n🧪 Testing Slack notification...\n");

const testEmail = {
  from: "john.doe@example.com",
  subject: "Very interested in your product",
  body: "I saw your demo and I'm impressed. Can we discuss pricing?",
  category: "Interested",
  timestamp: new Date()
};

await notifyInterestedEmail(testEmail);

console.log("\n✅ Test complete!");