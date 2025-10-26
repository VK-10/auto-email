// src/idle.ts
import Imap from "node-imap";
import { getAccessToken } from "./oauth";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import { indexEmail } from "./elastic-index";
import { fetchEmails } from "./utils/fetch-mails";
import { categorizeEmailsBatch } from "./email-categorizer";
import { processInterestedEmails } from "./notifications.js";

dotenv.config();

const categoryQueue : any[] = [];
const BATCH_SIZE = 10;
let isProcessingQueue = false; // Global variable to prevent overlapping processing

// New function to process the queue in a batch
async function processCategoryQueue() {
  if (categoryQueue.length === 0) return;

  const batch = categoryQueue.splice(0, BATCH_SIZE);
  console.log(`  [Idle Mode] Processing batch of ${batch.length} emails for categorization.`);
  
  try {
    const categorized = await categorizeEmailsBatch(batch);
    
    // Index the emails *with* the new category data (Elasticsearch will update existing docs)
    await indexEmail(categorized, true); // The 'true' flag tells indexEmail to perform an update

    //interested emails
    console.log(`  [Idle Mode] Checking for interested emails to notify...`);
    await processInterestedEmails(categorized);
    
  } catch (err: any) {
    if (err.message.includes("429")) {
        console.warn("  [Idle Mode] Gemini rate limit hit, retrying batch in 10s...");
    } else {
        console.error("  [Idle Mode] Error during batch categorization:", err.message);
    }
    // Put failed batch back to try again later
    categoryQueue.unshift(...batch);
  } finally {
    // Re-trigger after a delay to ensure all emails are processed
    setTimeout(triggerQueueProcessing, 5000);
  }
}



// Function to trigger queue processing
function triggerQueueProcessing() { // ADD THIS FUNCTION
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    processCategoryQueue().finally(() => {
        isProcessingQueue = false;
        // Re-check in case new emails arrived while processing
        if (categoryQueue.length > 0) {
            setTimeout(triggerQueueProcessing, 5000); // Check again in 5 seconds
        }
    });
}
 
// Event emitter to push new emails to frontend
export const mailEmitter = new EventEmitter();

let lastUID: number = 0; // track last fetched UID

export async function startIdleConnection() {
  const accessToken = await getAccessToken();

  const xoauth2 = Buffer.from(
    `user=${process.env.GMAIL_USER}\u0001auth=Bearer ${accessToken}\u0001\u0001`
  ).toString("base64");

  const imap = new Imap({
    user: process.env.GMAIL_USER || "",
    xoauth2,
    password: process.env.GMAIL_PASSWORD || "",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 30000,
  });

  // Open INBOX and fetch last 30 days initially
  imap.once("ready", () =>{
    imap.openBox("INBOX", true, async (err) => {
      if (err) throw err;

      console.log(" -----INBOX opened ------");

      // Initial fetch
      const initialEmails = await fetchEmails(imap, 30);
      for (const email of initialEmails) {
        mailEmitter.emit("email", email);
        await indexEmail(email); // index the email immediately (without category)
        categoryQueue.push(email); // add to the queue for bath categorization
        triggerQueueProcessing(); // trigger processing
        if (email.uid > lastUID) lastUID = email.uid;
      };

      //watching for new mails
      imap.on("mail", async (numNewMsgs) => {
        console.log(`---${numNewMsgs} new email(s) arrived----`);
        const newEmails = await fetchEmails(imap, 30, lastUID);
        for (const email of newEmails) {
          mailEmitter.emit("email", email);
          await indexEmail(email); // index without category first
          categoryQueue.push(email); // add to queue for AI categorization
          if (email.uid > lastUID) lastUID = email.uid;
        }
        // Trigger categorization for new emails
        if (newEmails.length > 0) {
          triggerQueueProcessing();
        }
      });
    });
  });


  imap.once("error", (err) => console.error("IMAP error:", err));
  imap.once("end", () => {
    console.log("IMAP connection ended, reconnecting...");
    setTimeout(() => startIdleConnection(), 5000); // reconnect after 5s
  });

  imap.connect();
}
