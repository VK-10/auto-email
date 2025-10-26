// test-notification.ts
import { notifyInterestedEmail } from "./notifications.js"
import dotenv from "dotenv";

dotenv.config();

const testEmail = {
  from: "john.doe@example.com",
  subject: "Very interested in your product",
  body: "I saw your demo and I'm impressed. Can we discuss pricing?",
  category: "Interested",
  timestamp: new Date()
};

console.log("🧪 Testing Slack notification...\n");
await notifyInterestedEmail(testEmail);
console.log("\n✅ Test complete!");