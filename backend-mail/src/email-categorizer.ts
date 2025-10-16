import { GoogleGenerativeAI } from "@google/generative-ai"
import { esClient } from "./elastic-search.ts";

export type EmailCategory = 
| "WORK"
| "PERSONAL"
| "PROMOTIONS"
| "SOCIAL"
| "UPDATES"
| "SPAM"
| "FINANCE"
| "OTHERS";

interface categorizationResult {
    category : EmailCategory;
    confidence: number;
    reasoning: string[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model : "gemini-2.5-flash"});

export async function categorize(email : {
    from : string;
    to: string;
    subject: string;
    body? : string;
}) : Promise <categorizationResult> {
    const prompt = `
    You are an intelligent email classifier.
Classify the following email into one of these categories:
[Work, Personal, Promotions, Finance, Social, Updates, Spam, Other].

Be concise and structured:
- Give the most likely category.
- Provide a confidence level between 0 and 1.
- List short reasoning points.

Email:
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Body: ${email.body || "(no body)"}

Return strictly in JSON:
{
  "category": "<one of the categories>",
  "confidence": <float>,
  "reasoning": ["point1", "point2", ...]
}
    `;


    const result = await model.generateContent(prompt);
    const text = result.response?.text();

    try {

        const parsed = JSON.parse(text);
        return parsed as categorizationResult;

    } catch (e) {
        console.error("Gemini response parse error:", text);
        return {
      category: "OTHERS",
      confidence: 0.3,
      reasoning: ["Failed to parse model output"],
    };
    }
}

// Cache for dynamic rules
let dynamicRules: Record<EmailCategory, string[]> = {
    WORK: [],
    PERSONAL: [],
    PROMOTIONS: [],
    SOCIAL: [],
    UPDATES: [],
    SPAM: [],
    FINANCE: [],
    OTHERS: [],
};

function createEmptyRules() : Record<EmailCategory, string[]> {
      return {
        WORK: [],
        PERSONAL: [],
        PROMOTIONS: [],
        SOCIAL: [],
        UPDATES: [],
        SPAM: [],
        FINANCE: [],
        OTHERS: [],
  };
}

// Load rules from Elasticsearch index "email_rules"
export async function loadRulesFromES() {
  try {
    const result = await esClient.search({
      index: "email_rules",
      size: 100, // fetch up to 100 rules
    });

    dynamicRules = createEmptyRules();;
    result.hits.hits.forEach((hit: any) => {
      const { category, keywords } = hit._source;
      (dynamicRules as any)[category] = keywords;
    });

    console.log("✅ Loaded dynamic rules from ES:", dynamicRules);
  } catch (err) {
    console.error("Failed to load rules from ES:", err);
  }
}

export async function localCategorize( email : any) : Promise <categorizationResult> {
    // rule-based fallback categorization
    const subject = (email.subject || "").toLowerCase();
    const from = (email.from || "").toLowerCase();
    const body = (email.body || "").toLowerCase();

    let category: EmailCategory = "OTHERS";
    const reasoning: string[] = [];
    let confidence = 0.3;

    // const rules: Record<EmailCategory, string[]> = {
    //     WORK: ["project", "meeting", "deadline", "report"],
    //     PERSONAL: ["hi", "hello", "family", "friend"],
    //     PROMOTIONS: ["sale", "offer", "discount", "coupon"],
    //     FINANCE: ["invoice", "payment", "bank", "statement"],
    //     SOCIAL: ["like", "comment", "share", "follow"],
    //     UPDATES: ["update", "newsletter", "news"],
    //     SPAM: ["lottery", "win", "prize", "urgent"],
    //     OTHERS: []
    // };

    for (const [cat, keywords] of Object.entries(dynamicRules)) {
        for (const keyword of keywords) {
            if (subject.includes(keyword) || body.includes(keyword) || from.includes(keyword)) {
                category = cat as EmailCategory;
                reasoning.push(`Matched keyword "${keyword}`);
                confidence = Math.min(1, confidence + 0.2);

            }
        }
    }

    if (category === "OTHERS") {
        reasoning.push("No matching keywords found");
    }

    return { category, confidence, reasoning};
}

export const emailCategorizer = { categorize, localCategorize, loadRulesFromES }