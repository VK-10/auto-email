export type Email = {
  id: string;
  uid: number;
  from: string;
  to: string;
  subject: string;
  body?: string;
  date: string;
  folder: string;
  account: string;
  isRead?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  messageId?: string;
  threadId?: string;
  labels?: string[];
  aiCategory?: string;
  aiConfidence?: number;
  aiReasoning?: string;
};

export type SearchOptions = {
  query?: string;
  folder?: string;
  account?: string;
  from?: string;
  to?: string;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  labels?: string[];
  aiCategory?: string;
  size?: number;
  page?: number;
};

export type SearchResult = {
  emails: Email[];
  total: number;
  took: number;
};

export type Stats = {
  total: number;
  byFolder: Array<{ key: string; doc_count: number }>;
  byAccount: Array<{ key: string; doc_count: number }>;
  unread: number;
  important: number;
  withAttachments: number;
};

// Search emails with filters
export async function searchEmails(options: SearchOptions = {}): Promise<SearchResult> {
  const params = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.append(key, value.join(','));
      } else {
        params.append(key, String(value));
      }
    }
  });

  const res = await fetch(`http://localhost:3000/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }
  return res.json();
}

// Get all folders
export async function getFolders(): Promise<string[]> {
  const res = await fetch("http://localhost:3000/folders");
  if (!res.ok) {
    throw new Error(`Failed to get folders: ${res.statusText}`);
  }
  const data = await res.json();
  return data.folders || [];
}

// Get all accounts
export async function getAccounts(): Promise<string[]> {
  const res = await fetch("http://localhost:3000/accounts");
  if (!res.ok) {
    throw new Error(`Failed to get accounts: ${res.statusText}`);
  }
  const data = await res.json();
  return data.accounts || [];
}

// Get email statistics
export async function getStats(): Promise<Stats> {
  const res = await fetch("http://localhost:3000/stats");
  if (!res.ok) {
    throw new Error(`Failed to get stats: ${res.statusText}`);
  }
  return res.json();
}

// Legacy function for backward compatibility
export async function fetchEmails(): Promise<Email[]> {
  const result = await searchEmails({ size: 50 });
  return result.emails;
}

// 🤖 AI Categorization functions
export async function categorizeEmail(email: Email): Promise<any> {
  const res = await fetch("http://localhost:3000/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    throw new Error(`Categorization failed: ${res.statusText}`);
  }
  return res.json();
}

export async function categorizeEmailsBatch(emails: Email[]): Promise<any> {
  const res = await fetch("http://localhost:3000/categorize/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails })
  });
  if (!res.ok) {
    throw new Error(`Batch categorization failed: ${res.statusText}`);
  }
  return res.json();
}

export async function getAIStats(): Promise<any> {
  const res = await fetch("http://localhost:3000/ai-stats");
  if (!res.ok) {
    throw new Error(`Failed to get AI stats: ${res.statusText}`);
  }
  return res.json();
}

export async function getAICategories(): Promise<string[]> {
  const res = await fetch("http://localhost:3000/ai-categories");
  if (!res.ok) {
    throw new Error(`Failed to get AI categories: ${res.statusText}`);
  }
  const data = await res.json();
  return data.categories || [];
}