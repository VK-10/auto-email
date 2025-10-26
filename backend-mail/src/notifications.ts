import dotenv from "dotenv";

dotenv.config();

interface Email {
  subject?: string;
  body?: string;
  from?: string;
  category?: string;
  timestamp?: Date;
}

interface NotificationResult {
  success: boolean;
  service: "Slack" | "Webhook";
  error?: string;
}

// ==================== SLACK NOTIFICATION ====================
async function sendSlackNotification(email: Email): Promise<NotificationResult> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

   console.log(`\n Checking Slack configuration...`);
  console.log(`   SLACK_WEBHOOK_URL exists: ${!!slackWebhookUrl}`);
  
  if (!slackWebhookUrl) {
    console.warn("⚠️  SLACK_WEBHOOK_URL not configured");
    return { success: false, service: "Slack", error: "Webhook URL not configured" };
  }

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎯 New Interested Lead!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*From:*\n${email.from || "Unknown"}`
          },
          {
            type: "mrkdwn",
            text: `*Subject:*\n${email.subject || "No Subject"}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Email Preview:*\n${(email.body || "").substring(0, 200)}${(email.body?.length || 0) > 200 ? "..." : ""}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📅 ${new Date().toLocaleString()}`
          }
        ]
      },
      {
        type: "divider"
      }
    ]
  };

  try {
    console.log(`----Sending Slack notification---`);
    const response = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    console.log("✅ Slack notification sent successfully");
    return { success: true, service: "Slack" };
    
  } catch (error: any) {
    console.error("❌ Failed to send Slack notification:", error.message);
    return { 
      success: false, 
      service: "Slack", 
      error: error.message 
    };
  }
}

// ==================== WEBHOOK TRIGGER ====================
async function triggerWebhook(email: Email): Promise<NotificationResult> {
  const webhookUrl = process.env.WEBHOOK_URL || "https://webhook.site/unique-id";
  
  const payload = {
    event: "interested_email",
    timestamp: new Date().toISOString(),
    email: {
      from: email.from,
      subject: email.subject,
      body: email.body,
      category: email.category,
      receivedAt: email.timestamp || new Date()
    },
    metadata: {
      source: "email-categorization-system",
      priority: "high"
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EmailCategorizationBot/1.0"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    console.log("✅ Webhook triggered successfully");
    return { success: true, service: "Webhook" };
    
  } catch (error: any) {
    console.error("❌ Failed to trigger webhook:", error.message);
    return { 
      success: false, 
      service: "Webhook", 
      error: error.message 
    };
  }
}

// ==================== MAIN NOTIFICATION FUNCTION ====================
export async function notifyInterestedEmail(email: Email): Promise<void> {
  console.log(`\n📨 Processing interested email from: ${email.from}`);
  
  // Send notifications in parallel for speed
  const [slackResult, webhookResult] = await Promise.allSettled([
    sendSlackNotification(email),
    triggerWebhook(email)
  ]);

  // Log results
  if (slackResult.status === "fulfilled" && slackResult.value.success) {
    console.log("  ✓ Slack notification sent");
  } else {
    console.log("  ✗ Slack notification failed");
  }

  if (webhookResult.status === "fulfilled" && webhookResult.value.success) {
    console.log("  ✓ Webhook triggered");
  } else {
    console.log("  ✗ Webhook failed");
  }
}

// ==================== BATCH PROCESSING ====================
export async function processInterestedEmails(emails: Email[]): Promise<void> {
  const interestedEmails = emails.filter(
    email => email.category === "Interested"
  );

  if (interestedEmails.length === 0) {
    console.log("ℹ️  No interested emails to notify");
    return;
  }

  console.log(`\n🎯 Found ${interestedEmails.length} interested email(s)`);
  console.log("📤 Sending notifications...\n");

  for (const email of interestedEmails) {
    await notifyInterestedEmail(email);
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n✅ All notifications processed");
}