import { esClient } from "./elastic-search";
// import { emailCategorizer} from "./email-categorizer.ts";


const INDEX = "emails";

type EmailCategory = "Interested" |  "Meeting Booked" |  "Not Interested" |  "Spam" | "Out of Office";

// index if it doesn't exist
export async function setupEmailIndex() {
  const exists = await esClient.indices.exists({ index: INDEX });

  if (!exists) {
    await esClient.indices.create({
      index: INDEX,
      body: {
        mappings: {
          properties: {
            uid: { type: "long" },
            from: { 
              type: "text",
              fields: {
                keyword: { type: "keyword" }
              }
            },
            to: { 
              type: "text",
              fields: {
                keyword: { type: "keyword" }
              }
            },
            subject: { 
              type: "text",
              analyzer: "standard",
              fields: {
                keyword: { type: "keyword" }
              }
            },
            body: { 
              type: "text",
              analyzer: "standard"
            },
            date: { type: "date" },
            folder: { type: "keyword" },
            account: { type: "keyword" },
            isRead: { type: "boolean" },
            isImportant: { type: "boolean" },
            hasAttachments: { type: "boolean" },
            messageId: { type: "keyword" },
            threadId: { type: "keyword" },
            labels: { type: "keyword" },
            aiCategory: { type: "keyword" },
            aiConfidence: { type: "float" },
            aiReasoning: { type: "text" }
          },
        },
        settings: {
          analysis: {
            analyzer: {
              email_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "stop", "snowball"]
              }
            }
          }
        }
      } as any,
    });

    console.log(`Created index: ${INDEX}`);
  } else {
    console.log(`ℹIndex ${INDEX} already exists`);
  }
}

// Function to index a email with AI categorization
export async function indexEmail(emailOrEmails: any | any[] , isUpdate: boolean = false) {

  if (Array.isArray(emailOrEmails)){
    console.log(`Starting bulk ${isUpdate ? 'update' : 'indexing'} for ${emailOrEmails.length} emails......`);

    const operations = emailOrEmails.flatMap(doc => {
      const action = isUpdate ? 'update' : 'index';

      const docBody = {
        ...doc,
        aiCategory : doc.category,
        aiConfidence: doc.confidence || 1.0, 
        aiReasoning: doc.reasoning?.join("; ") || "AI Categorization",
      };

      if (isUpdate) {
        return [
          { update: { _index: INDEX, _id: doc.uid } },  // ✅ FIXED: use doc.uid instead of doc.id
          { 
            doc: { 
              aiCategory: docBody.aiCategory, 
              aiConfidence: docBody.aiConfidence,
              aiReasoning: docBody.aiReasoning 
            }
          }
        ];
      } else {
        return [
          { index: { _index: INDEX, _id: doc.uid } },
          docBody
        ]
      }
    });

    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      console.error("Bulk indexing errors:", bulkResponse.items.filter(item => item.index?.error || item.update?.error));
    }
    console.log("  ✅ Bulk operation complete.");
    return;
  }

  const email = emailOrEmails;

  await esClient.index({
    index: INDEX,
    id: email.uid,
    document: email,
  });

  console.log(`Indexed email: ${email.subject} [${email.subject} (Queued for category)`);
}

// Advanced search with filtering
export async function searchEmails(options: {
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
  aiCategory?: EmailCategory;
  size?: number;
  fromIndex?: number;
}) {
  const {
    query,
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
    size = 20,
    fromIndex = 0
  } = options;

  const mustQueries: any[] = [];
  const shouldQueries: any[] = [];

  // Text search across multiple fields
  if (query) {
    shouldQueries.push({
      multi_match: {
        query,
        fields: ["subject^2", "body", "from", "to"],
        type: "best_fields",
        fuzziness: "AUTO"
      }
    });
  }

  // Exact field filters
  if (folder) {
    mustQueries.push({ term: { folder } });
  }

  if (account) {
    mustQueries.push({ term: { account } });
  }

  if (from) {
    mustQueries.push({ wildcard: { "from.keyword": `*${from}*` } });
  }

  if (to) {
    mustQueries.push({ wildcard: { "to.keyword": `*${to}*` } });
  }

  if (isRead !== undefined) {
    mustQueries.push({ term: { isRead } });
  }

  if (isImportant !== undefined) {
    mustQueries.push({ term: { isImportant } });
  }

  if (hasAttachments !== undefined) {
    mustQueries.push({ term: { hasAttachments } });
  }

  if (labels && labels.length > 0) {
    mustQueries.push({ terms: { labels } });
  }

  if (aiCategory) {
    mustQueries.push({ term: { aiCategory } });
  }

  // Date range filter
  if (dateFrom || dateTo) {
    const dateRange: any = {};
    if (dateFrom) dateRange.gte = dateFrom;
    if (dateTo) dateRange.lte = dateTo;
    mustQueries.push({ range: { date: dateRange } });
  }

  let searchQuery: any;

  // If only text search, use simpler query
  if (mustQueries.length === 0 && shouldQueries.length === 1) {
    searchQuery = shouldQueries[0];
  } else if (mustQueries.length === 0 && shouldQueries.length === 0) {
    // If no filters, return all emails
    searchQuery = { match_all: {} };
  } else {
    // Complex query with multiple conditions
    searchQuery = {
      bool: {}
    };

    if (mustQueries.length > 0) {
      searchQuery.bool.must = mustQueries;
    }

    if (shouldQueries.length > 0) {
      searchQuery.bool.should = shouldQueries;
      searchQuery.bool.minimum_should_match = 1;
    }
  }

  const result = await esClient.search({
    index: INDEX,
    query: searchQuery,
    sort: [{ date: { order: "desc" } }],
    size,
    from: fromIndex,
    _source: true
  });

  const hits = result.hits.hits.map((hit: any) => ({
    id: hit._id,
    ...hit._source
  }));

  return {
    emails: hits,
    total: typeof result.hits.total === "number"
    ? result.hits.total
    : result.hits.total?.value ?? 0,
    took: result.took
  };
}

// ✅ Get all unique folders
export async function getFolders() {
  const result = await esClient.search({
    index: INDEX,
    aggs: {
      folders: {
        terms: {
          field: "folder",
          size: 100
        }
      }
    },
    size: 0
  });

  const byFolder = (result.aggregations?.by_folder as any)?.buckets ?? [];
const byAccount = (result.aggregations?.by_account as any)?.buckets ?? [];

return {
  total: (result.aggregations?.total_emails as any)?.value ?? 0,
  byFolder: (result.aggregations?.by_folder as any)?.buckets ?? [],
  byAccount: (result.aggregations?.by_account as any)?.buckets ?? [],
  unread: (result.aggregations?.unread_count as any)?.doc_count ?? 0,
  important: (result.aggregations?.important_count as any)?.doc_count ?? 0,
  withAttachments: (result.aggregations?.with_attachments as any)?.doc_count ?? 0,
};



}

// ✅ Get all unique accounts
export async function getAccounts() {
  const result = await esClient.search({
    index: INDEX,
    aggs: {
      accounts: {
        terms: {
          field: "account",
          size: 100
        }
      }
    },
    size: 0
  });

  return {
  total: (result.aggregations?.total_emails as any)?.value ?? 0,
  byFolder: (result.aggregations?.by_folder as any)?.buckets ?? [],
  byAccount: (result.aggregations?.by_account as any)?.buckets ?? [],
  unread: (result.aggregations?.unread_count as any)?.doc_count ?? 0,
  important: (result.aggregations?.important_count as any)?.doc_count ?? 0,
  withAttachments: (result.aggregations?.with_attachments as any)?.doc_count ?? 0,
};

}

//email statistics
export async function getEmailStats() {
  const result = await esClient.search({
    index: INDEX,
    aggs: {
      total_emails: { value_count: { field: "uid" } },
      by_folder: {
        terms: { field: "folder" }
      },
      by_account: {
        terms: { field: "account" }
      },
      unread_count: {
        filter: { term: { isRead: false } }
      },
      important_count: {
        filter: { term: { isImportant: true } }
      },
      with_attachments: {
        filter: { term: { hasAttachments: true } }
      }
    },
    size: 0
  });

  return {
  total: (result.aggregations?.total_emails as any)?.value ?? 0,
  byFolder: (result.aggregations?.by_folder as any)?.buckets ?? [],
  byAccount: (result.aggregations?.by_account as any)?.buckets ?? [],
  unread: (result.aggregations?.unread_count as any)?.doc_count ?? 0,
  important: (result.aggregations?.important_count as any)?.doc_count ?? 0,
  withAttachments: (result.aggregations?.with_attachments as any)?.doc_count ?? 0,
};

}

// ✅ Initialize index on module load
await setupEmailIndex();
