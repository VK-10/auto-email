
// // import { GoogleGenerativeAI } from "@google/generative-ai";
// import Groq from "groq-sdk"
// import dotenv from "dotenv";
// import PQueue from "p-queue";

// dotenv.config();

// const groq = new Groq({
//   apiKey : process.env.GROQ_API_KEY || ""
// });

// const MODEL_NAME = "moonshotai/kimi-k2-instruct";
// const BATCH_SIZE = 5;
// const DELAY_MS = 500;
// const MAX_RETRIES = 3;

// const queue = new PQueue({ interval: 60000, intervalCap: 100 }); // 50 requests/minute


// function sleep(ms: number) {
//   return new Promise((res) => setTimeout(res, ms));
// }

// // ---- Core categorization function ----
// async function categorizeEmailBatch(batch: any[]): Promise<any[]> {
//   const prompt = `
// You are an email categorization assistant.
// Categorize each email below into one of these categories:
// [Interested, Meeting Booked, Not Interested, Spam, Out of Office]

// Emails:
// ${batch
//   .map(
//     (e, i) =>
//       `${i + 1}. Subject: ${e.subject || "No Subject"} | From: ${e.from || "Unknown"} | Body: ${(e.body || "").substring(0, 200)}`
//   )
//   .join("\n")}

// Return the result in JSON array format like:
// [
//   {"subject": "...", "category": "Work"},
//   {"subject": "...", "category": "Promotions"}
// ]`;


//   let retries = 0;
//   while (retries < MAX_RETRIES) {
//     try {
//       const completion = await groq.chat.completions.create({
//         messages : [
//           {role : "system",
//           content: "You are an expert email classifier. response only with valid JSON array."
//         },
//         {
//           role : "user",
//           content: prompt
//         },
//       ],

//       model : MODEL_NAME,
//       temperature : 0.1,
//       max_tokens: 1000,
//       response_format: { type : "json_object"}
//       });

//       const text = completion.choices[0]?.message?.content || "{}";

//       // Groq returns JSON object, extract array
//       let categories;
//       try {
//         const parsed = JSON.parse(text);
//         // Handle both direct array and wrapped object
//         categories = Array.isArray(parsed) ? parsed : parsed.categories || [];
//       } catch {
//         // Fallback: try to extract array from text
//         const jsonStart = text.indexOf("[");
//         const jsonEnd = text.lastIndexOf("]");
//         if (jsonStart !== -1 && jsonEnd !== -1) {
//           const jsonStr = text.slice(jsonStart, jsonEnd + 1);
//           categories = JSON.parse(jsonStr);
//         } else {
//           throw new Error("Could not parse response");
//         }
//       }

//       // // Try to parse JSON safely
//       // const jsonStart = text.indexOf("[");
//       // const jsonEnd = text.lastIndexOf("]");
//       // const jsonStr = text.slice(jsonStart, jsonEnd + 1);
//       // const categories = JSON.parse(jsonStr);

//       // Merge results back into emails
//       return batch.map((e, idx) => ({
//         ...e,
//         category: categories[idx]?.category || "Uncategorized",
//       }));
//     } catch (err: any) {
//       if (err.message?.includes("429") || err.message?.includes("quota")) {
//         console.warn("Rate limit hit, retrying in 10s...");
//         retries++;
//         await sleep(10000);
//       } else {
//         console.error("Error categorizing batch:", err.message);
//         break;
//       }
//     }
//   }

//   // If retries failed, mark all uncategorized
//   return batch.map((e) => ({ ...e, category: "Uncategorized" }));
// }


// // Simple rule-based fallback
// function fallbackCategorize(email: any): string {
//   const text = `${email.subject || ""} ${email.body || ""}`.toLowerCase();
  
//   if (text.includes("out of office") || text.includes("auto reply")) {
//     return "Out of Office";
//   }
//   if (text.includes("meeting") && (text.includes("confirmed") || text.includes("booked"))) {
//     return "Meeting Booked";
//   }
//   if (text.includes("not interested") || text.includes("unsubscribe")) {
//     return "Not Interested";
//   }
//   if (text.includes("interested") || text.includes("demo") || text.includes("pricing")) {
//     return "Interested";
//   }
//   if (text.includes("click here") || text.includes("limited time")) {
//     return "Spam";
//   }
  
//   return "Uncategorized";
// }


// // ---- Public Function ----
// // ---- Public Function ----
// export async function categorizeEmailsBatch(emails: any[]): Promise<any[]> {
//   const categorized: any[] = [];

//   for (let i = 0; i < emails.length; i += BATCH_SIZE) {
//     const batch = emails.slice(i, i + BATCH_SIZE);

//     await queue.add(async () => {
//       console.log(`Categorizing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(emails.length / BATCH_SIZE)}`);
//       const processed = await categorizeEmailBatch(batch);
//       categorized.push(...processed);
//       await sleep(DELAY_MS);
//     });
//   }

//   await queue.onIdle();
//   console.log(`✅ Categorized ${categorized.length} emails`);
//   return categorized;
// }

// // Optional: Single email categorization for testing
// export async function categorizeSingleEmail(email: any): Promise<any> {
//   const result = await categorizeEmailBatch([email]);
//   return result[0];
// }

import Groq from "groq-sdk";
import dotenv from "dotenv";
import PQueue from "p-queue";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const MODEL_NAME = "moonshotai/kimi-k2-instruct"; // Latest model
const BATCH_SIZE = 5;
const DELAY_MS = 500;
const MAX_RETRIES = 2; // Reduced retries, faster fallback

const queue = new PQueue({ interval: 60000, intervalCap: 100 });

type EmailCategory = 
  | "Interested" 
  | "Meeting Booked" 
  | "Not Interested" 
  | "Spam" 
  | "Out of Office";

interface Email {
  subject?: string;
  body?: string;
  from?: string;
}

interface CategorizedEmail extends Email {
  category: EmailCategory | "Uncategorized";
  method: "AI" | "Rules"; // Track which method was used
  confidence?: number;
}

// ==================== RULE-BASED FALLBACK ====================
const patterns = {
  "Out of Office": [
    /out of office/i,
    /away from/i,
    /on vacation/i,
    /auto[\s-]?reply/i,
    /automatic reply/i,
    /currently unavailable/i,
    /will be back/i,
    /away until/i,
    /i am away/i
  ],
  "Meeting Booked": [
    /meeting confirmed/i,
    /calendar invite/i,
    /accepted.*invite/i,
    /booked/i,
    /scheduled/i,
    /see you on/i,
    /meeting link/i,
    /zoom link/i,
    /confirmed.*meeting/i,
    /looking forward to our/i
  ],
  "Not Interested": [
    /not interested/i,
    /no thank/i,
    /unsubscribe/i,
    /remove me/i,
    /don'?t contact/i,
    /not a fit/i,
    /not the right time/i,
    /pass on this/i,
    /no longer interested/i
  ],
  "Spam": [
    /click here now/i,
    /limited time offer/i,
    /act now/i,
    /congratulations you won/i,
    /verify your account/i,
    /urgent action required/i,
    /account suspended/i,
    /winner/i,
    /lottery/i,
    /free money/i,
    /cryptocurrency/i
  ],
  "Interested": [
    /interested/i,
    /tell me more/i,
    /learn more/i,
    /pricing/i,
    /demo/i,
    /trial/i,
    /how does.*work/i,
    /can you/i,
    /would like to know/i,
    /more information/i,
    /discuss/i,
    /schedule.*call/i,
    /available.*talk/i,
    /let'?s connect/i
  ]
};

function fallbackCategorize(email: Email): CategorizedEmail {
  const text = `${email.subject || ""} ${email.body || ""}`.toLowerCase();
  
  // Check each category
  for (const [category, regexList] of Object.entries(patterns)) {
    let matchCount = 0;
    for (const regex of regexList) {
      if (regex.test(text)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      const confidence = Math.min(0.6 + (matchCount * 0.15), 0.95);
      return {
        ...email,
        category: category as EmailCategory,
        method: "Rules",
        confidence
      };
    }
  }
  
  return {
    ...email,
    category: "Uncategorized",
    method: "Rules",
    confidence: 0.3
  };
}

// ==================== AI CATEGORIZATION ====================
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function categorizeEmailBatchWithAI(batch: Email[]): Promise<CategorizedEmail[]> {
  const prompt = `Categorize each email into ONE of these categories:
[Interested, Meeting Booked, Not Interested, Spam, Out of Office]

Emails:
${batch
  .map(
    (e, i) =>
      `${i + 1}. Subject: ${e.subject || "No Subject"} | From: ${e.from || "Unknown"} | Body: ${(e.body || "").substring(0, 200)}`
  )
  .join("\n")}

Return ONLY a JSON array:
[
  {"subject": "...", "category": "Interested"},
  {"subject": "...", "category": "Spam"}
]`;

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert email classifier. Respond ONLY with valid JSON array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: MODEL_NAME,
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || "{}";
      
      let categories;
      try {
        const parsed = JSON.parse(text);
        categories = Array.isArray(parsed) ? parsed : parsed.categories || parsed.emails || [];
      } catch {
        const jsonStart = text.indexOf("[");
        const jsonEnd = text.lastIndexOf("]");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          categories = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse response");
        }
      }

      // Success! Return AI-categorized results
      return batch.map((e, idx) => ({
        ...e,
        category: categories[idx]?.category || "Uncategorized",
        method: "AI" as const,
        confidence: 0.9
      }));
      
    } catch (err: any) {
      retries++;
      
      if (err.message?.includes("429") || err.message?.includes("rate")) {
        console.warn(`⚠️  Rate limit hit (attempt ${retries}/${MAX_RETRIES}), waiting...`);
        await sleep(3000);
      } else if (err.message?.includes("decommissioned") || err.message?.includes("model")) {
        console.error(`❌ Model error: ${err.message}`);
        console.log("🔄 Switching to rule-based fallback...");
        break; // Don't retry on model errors
      } else {
        console.error(`⚠️  AI error (attempt ${retries}/${MAX_RETRIES}):`, err.message);
        if (retries < MAX_RETRIES) {
          await sleep(2000);
        }
      }
    }
  }

  // AI failed, use rule-based fallback
  console.log("🔄 Using rule-based categorization for this batch");
  return batch.map(email => fallbackCategorize(email));
}

// ==================== MAIN BATCH FUNCTION ====================
export async function categorizeEmailsBatch(emails: Email[]): Promise<CategorizedEmail[]> {
  console.log(`📧 Starting categorization for ${emails.length} emails...`);
  
  const categorized: CategorizedEmail[] = [];
  let aiCount = 0;
  let ruleCount = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    await queue.add(async () => {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(emails.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches}...`);
      
      const processed = await categorizeEmailBatchWithAI(batch);
      
      // Count methods used
      processed.forEach(email => {
        if (email.method === "AI") aiCount++;
        else ruleCount++;
      });
      
      categorized.push(...processed);
      await sleep(DELAY_MS);
    });
  }

  await queue.onIdle();
  
  // Statistics
  const stats: Record<string, number> = {};
  categorized.forEach(e => {
    stats[e.category] = (stats[e.category] || 0) + 1;
  });
  
  console.log(`\n✅ Categorization complete!`);
  console.log(`📊 Methods used: ${aiCount} AI, ${ruleCount} Rules`);
  console.log(`📈 Category distribution:`, stats);
  
  return categorized;
}

// ==================== SINGLE EMAIL FUNCTION ====================
export async function categorizeSingleEmail(email: Email): Promise<CategorizedEmail> {
  try {
    const result = await categorizeEmailBatchWithAI([email]);
    return result[0];
  } catch {
    return fallbackCategorize(email);
  }
}