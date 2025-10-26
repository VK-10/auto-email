import dotenv from "dotenv";
dotenv.config();

async function testSlack() {
  console.log("\n=================================");
  console.log("Testing Slack Configuration");
  console.log("=================================\n");
  
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  console.log("1. Checking environment variables:");
  console.log("   SLACK_WEBHOOK_URL exists:", !!webhookUrl);
  console.log("   SLACK_WEBHOOK_URL length:", webhookUrl?.length || 0);
  
  if (webhookUrl) {
    console.log("   First 40 chars:", webhookUrl.substring(0, 40) + "...");
    console.log("   Starts with correct URL:", webhookUrl.startsWith("https://hooks.slack.com/"));
  }
  
  if (!webhookUrl) {
    console.error("\nSLACK_WEBHOOK_URL not found in .env file");
    console.log("\nTo fix this:");
    console.log("   1. Create/edit .env file in backend-mail/");
    console.log("   2. Add: SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL");
    return;
  }
  
  if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
    console.error("\nInvalid webhook URL format");
    return;
  }
  
  console.log("\n2. Sending test message to Slack...");
  
  const message = {
    text: "someone messeged you about the interested position"
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });
    
    const text = await response.text();
    
    console.log("\n3. Response from Slack:");
    console.log("   Status code:", response.status);
    console.log("   Response body:", text);
    
    if (response.ok && text === "ok") {
      console.log("\nSUCCESS! Check your Slack channel.");
    } else {
      console.error("\nFAILED! Slack returned an error.");
    }
    
  } catch (error) {
    console.error("\nERROR:", error.message);
  }
  
  console.log("\n=================================\n");
}

testSlack().catch(console.error);
