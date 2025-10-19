import { categorizeEmailsBatch } from "./email-categorizer";
import { fetchLast30DaysMails } from "./mail";
import { indexEmail } from "./elastic-index"

async function runCategorizationPipeline() {
  try {
    console.log(" fetching last 30 days of emails...");
    const emails = await fetchLast30DaysMails();

    if (!emails.length){
      console.log("No emails found in the last 30 days")
    }

    console.log(`  -----Fetched ${emails.length} emails-----`);

    console.log("----- Categorizing emails using Gemini in batches----");
    const categorized = await categorizeEmailsBatch(emails); // batch size = 10
    console.log(` ------- Categorized ${categorized.length} emails ------- `);

    console.log("-------ndexing categorized emails into Elasticsearch----");
    await indexEmail(categorized);
    console.log("-----Done! All emails categorized and indexed successfully----");
  } catch (err) {
    console.error("Error in categorization pipeline:", err);
  }
}

runCategorizationPipeline().catch(err => console.error("Error:", err));
