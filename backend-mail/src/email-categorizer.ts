import { Email } from "./elastic-index.ts";

export type EmailCategory = 
  | "Interested" 
  | "Meeting Booked" 
  | "Not Interested" 
  | "Spam" 
  | "Out of Office"
  | "Uncategorized";

export interface CategorizationResult {
  category: EmailCategory;
  confidence: number;
  reasoning: string[];
}

// AI-based email categorization using keyword analysis and patterns
export class EmailCategorizer {
  private patterns = {
    "Interested": {
      keywords: [
        "interested", "excited", "yes", "sounds good", "let's do it", "count me in",
        "definitely", "absolutely", "love to", "would like to", "keen", "enthusiastic",
        "perfect", "great idea", "looking forward", "can't wait", "amazing", "fantastic"
      ],
      patterns: [
        /i'm interested/i,
        /sounds great/i,
        /i'd love to/i,
        /count me in/i,
        /definitely interested/i,
        /very interested/i,
        /excited about/i
      ]
    },
    "Meeting Booked": {
      keywords: [
        "meeting", "call", "schedule", "booked", "confirmed", "appointment",
        "calendar", "zoom", "teams", "google meet", "conference", "demo",
        "interview", "discussion", "catch up", "touch base", "sync"
      ],
      patterns: [
        /meeting.*booked/i,
        /call.*scheduled/i,
        /appointment.*confirmed/i,
        /calendar.*invite/i,
        /zoom.*link/i,
        /teams.*meeting/i,
        /google.*meet/i,
        /demo.*scheduled/i,
        /interview.*scheduled/i
      ]
    },
    "Not Interested": {
      keywords: [
        "not interested", "no thanks", "pass", "decline", "not right now",
        "not a good fit", "not for me", "unsubscribe", "remove me", "opt out",
        "not looking", "not available", "busy", "not the right time"
      ],
      patterns: [
        /not interested/i,
        /no thanks/i,
        /not.*good fit/i,
        /not.*right.*time/i,
        /unsubscribe/i,
        /remove.*from/i,
        /opt.*out/i,
        /not.*looking/i
      ]
    },
    "Spam": {
      keywords: [
        "free", "limited time", "act now", "click here", "urgent", "congratulations",
        "winner", "prize", "lottery", "inheritance", "viagra", "casino", "loan",
        "debt", "credit", "investment", "bitcoin", "crypto", "nigerian", "prince"
      ],
      patterns: [
        /free.*offer/i,
        /limited.*time/i,
        /act.*now/i,
        /click.*here/i,
        /congratulations.*winner/i,
        /you.*won/i,
        /inheritance.*money/i,
        /nigerian.*prince/i,
        /bitcoin.*investment/i,
        /urgent.*action/i
      ]
    },
    "Out of Office": {
      keywords: [
        "out of office", "vacation", "holiday", "away", "unavailable", "traveling",
        "on leave", "sick leave", "personal time", "back on", "returning", "auto-reply",
        "automatic reply", "will be back", "currently away"
      ],
      patterns: [
        /out.*of.*office/i,
        /auto.*reply/i,
        /currently.*away/i,
        /on.*vacation/i,
        /will.*be.*back/i,
        /returning.*on/i,
        /unavailable.*until/i,
        /away.*from/i
      ]
    }
  };

  categorize(email: Email): CategorizationResult {
    const content = this.extractContent(email);
    const scores = this.calculateScores(content);
    const bestMatch = this.findBestMatch(scores);
    
    return bestMatch;
  }

  private extractContent(email: Email): string {
    const parts = [
      email.subject || "",
      email.body || "",
      email.from || "",
      email.to || ""
    ];
    
    return parts.join(" ").toLowerCase();
  }

  private calculateScores(content: string): Record<EmailCategory, number> {
    const scores: Record<EmailCategory, number> = {
      "Interested": 0,
      "Meeting Booked": 0,
      "Not Interested": 0,
      "Spam": 0,
      "Out of Office": 0,
      "Uncategorized": 0
    };

    // Calculate keyword scores
    Object.entries(this.patterns).forEach(([category, config]) => {
      let score = 0;
      
      // Keyword matching
      config.keywords.forEach(keyword => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        score += matches * 2; // Keywords are worth 2 points each
      });
      
      // Pattern matching
      config.patterns.forEach(pattern => {
        if (pattern.test(content)) {
          score += 5; // Patterns are worth 5 points each
        }
      });
      
      scores[category as EmailCategory] = score;
    });

    return scores;
  }

  private findBestMatch(scores: Record<EmailCategory, number>): CategorizationResult {
    const sortedCategories = Object.entries(scores)
      .filter(([category]) => category !== "Uncategorized")
      .sort(([, a], [, b]) => b - a);

    const [bestCategory, bestScore] = sortedCategories[0];
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    const confidence = totalScore > 0 ? Math.min(bestScore / totalScore, 1) : 0;
    
    // If confidence is too low, mark as uncategorized
    if (confidence < 0.1) {
      return {
        category: "Uncategorized",
        confidence: 0,
        reasoning: ["No clear patterns detected"]
      };
    }

    const reasoning = this.generateReasoning(bestCategory as EmailCategory, scores);
    
    return {
      category: bestCategory as EmailCategory,
      confidence,
      reasoning
    };
  }

  private generateReasoning(category: EmailCategory, scores: Record<EmailCategory, number>): string[] {
    const reasoning: string[] = [];
    const config = this.patterns[category];
    
    if (!config) return ["No specific reasoning available"];
    
    // Add reasoning based on detected patterns
    if (scores[category] > 0) {
      reasoning.push(`Detected ${category.toLowerCase()} patterns with score: ${scores[category]}`);
    }
    
    return reasoning;
  }

  // Batch categorize multiple emails
  categorizeBatch(emails: Email[]): Array<{ email: Email; result: CategorizationResult }> {
    return emails.map(email => ({
      email,
      result: this.categorize(email)
    }));
  }

  // Get category statistics
  getCategoryStats(categorizations: Array<{ email: Email; result: CategorizationResult }>) {
    const stats: Record<EmailCategory, number> = {
      "Interested": 0,
      "Meeting Booked": 0,
      "Not Interested": 0,
      "Spam": 0,
      "Out of Office": 0,
      "Uncategorized": 0
    };

    categorizations.forEach(({ result }) => {
      stats[result.category]++;
    });

    return stats;
  }
}

// Export singleton instance
export const emailCategorizer = new EmailCategorizer();
