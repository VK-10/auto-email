import { categorizeEmailsBatch } from "./email-categorizer.js"

const testEmails = [
  {
    subject: "Re: Demo Request",
    body: "I'm interested in your product. Can we schedule a call?",
    from: "john@company.com"
  },
  {
    subject: "Out of Office",
    body: "I am away until Monday",
    from: "auto@reply.com"
  }
];

const results = await categorizeEmailsBatch(testEmails);
console.log(results);