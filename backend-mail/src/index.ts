import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import { fetchLast30DaysMails } from "./mail";
import { mailEmitter, startIdleConnection } from "./idle-mode";
import { searchEmails, getFolders, getAccounts, getEmailStats } from "./elastic-index";
// import { emailCategorizer} from "./email-categorizer.ts";
type EmailCategory = "Interested" |  "Meeting Booked" |  "Not Interested" |  "Spam" | "Out of Office";
import { categorizeEmailsBatch} from "./email-categorizer.js";
import { WebSocketServer } from "ws";
import { processInterestedEmails, notifyInterestedEmail } from "./notifications.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

app.use(bodyParser.json());
// app.use(cors());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(morgan("dev"));

const wss = new WebSocketServer({ port: 8081 }); // separate WS port

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  // Send new emails in real-time
  const handler = (email: any) => ws.send(JSON.stringify(email));
  mailEmitter.on("email", handler);

  ws.on("close", () => {
    mailEmitter.off("email", handler);
    console.log("WebSocket client disconnected");
  });
});
// Sample route
app.get("/mails", async (req, res) => {
  try {
    const mails = await fetchLast30DaysMails();
    res.json({mails});
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// 🔍 Search emails with advanced filtering
app.get("/search", async (req, res) => {
  try {
    const {
      q: query,
      query: queryAlt, // Support both 'q' and 'query' parameters
      folder,
      account,
      from,
      to,
      dateFrom,
      dateTo,
      isRead,
      isImportant,
      hasAttachments,
      labels,
      aiCategory,
      size = "20",
      page = "0"
    } = req.query;

    const searchOptions = {
      query: (query || queryAlt) as string,
      folder: folder as string,
      account: account as string,
      from: from as string,
      to: to as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      isRead: isRead ? isRead === "true" : undefined,
      isImportant: isImportant ? isImportant === "true" : undefined,
      hasAttachments: hasAttachments ? hasAttachments === "true" : undefined,
      labels: labels ? (labels as string).split(",") : undefined,
      aiCategory: aiCategory as EmailCategory,
      size: parseInt(size as string),
      fromIndex: parseInt(page as string) * parseInt(size as string)
    };

    const result = await searchEmails(searchOptions);
    res.json(result);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

// Get all folders
app.get("/folders", async (req, res) => {
  try {
    const folders = await getFolders();
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get folders" });
  }
});

// Get all accounts
app.get("/accounts", async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json({ accounts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get accounts" });
  }
});

// Get email statistics
app.get("/stats", async (req, res) => {
  try {
    const stats = await getEmailStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get stats" });
  }
});

app.post("/categorize/batch", async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "Emails array is required" });
    }

    const categorizedEmails = await categorizeEmailsBatch(emails);
    // const stats = categorizeEmailsBatch.getCategoryStats(categorizations);

    res.json({
      total : categorizedEmails.length,
      categorizedEmails
    })

    await processInterestedEmails(categorizedEmails);
    
  } catch (err) {
    console.error("Batch categorization error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Batch categorization failed" });
  }
});

// Get AI category statistics
app.get("/ai-stats", async (req, res) => {
  try {
    const result = await searchEmails({ size: 1000 }); // Get more emails for stats
    const categorizations = result.emails.map(email => ({
      email,
      result: {
        category: email.aiCategory || "Uncategorized",
        confidence: email.aiConfidence || 0,
        reasoning: email.aiReasoning ? email.aiReasoning.split("; ") : []
      }
    }));
    
    const stats = categorizeEmailsBatch(categorizations);
    res.json(stats);
  } catch (err) {
    console.error("AI stats error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get AI stats" });
  }
});

// 🤖 Get available AI categories
app.get("/ai-categories", async (req, res) => {
  try {
    const categories: EmailCategory[] = [
      "Interested",
      "Meeting Booked", 
      "Not Interested", 
      "Spam", 
      "Out of Office"
    ];
    
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get categories" });
  }
});



// Start IMAP IDLE connection
startIdleConnection();



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
