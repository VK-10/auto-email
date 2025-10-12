# 📧 Email Search with Elasticsearch

This project implements a searchable email storage system using Elasticsearch for advanced email search and filtering capabilities.

## 🚀 Quick Start

### 1. Start Elasticsearch with Docker

```bash
# Start Elasticsearch and Kibana
docker-compose up -d

# Check if Elasticsearch is running
curl http://localhost:9200
```

### 2. Install Dependencies

```bash
cd backend-mail
npm install
```

### 3. Start the Backend

```bash
npm run dev
```

## 🔍 Search API Endpoints

### Search Emails
```
GET /search?q=meeting&folder=inbox&account=main&size=20&page=0
```

**Query Parameters:**
- `q` - Search query (searches subject, body, from, to)
- `folder` - Filter by folder (exact match)
- `account` - Filter by account (exact match)
- `from` - Filter by sender (partial match)
- `to` - Filter by recipient (partial match)
- `dateFrom` - Filter emails from date (ISO format)
- `dateTo` - Filter emails to date (ISO format)
- `isRead` - Filter by read status (true/false)
- `isImportant` - Filter by importance (true/false)
- `hasAttachments` - Filter by attachment presence (true/false)
- `labels` - Filter by labels (comma-separated)
- `size` - Number of results per page (default: 20)
- `page` - Page number (default: 0)

### Get Folders
```
GET /folders
```

### Get Accounts
```
GET /accounts
```

### Get Statistics
```
GET /stats
```

## 📊 Features

### ✅ Advanced Search
- **Full-text search** across subject, body, from, and to fields
- **Fuzzy matching** for typos and variations
- **Field boosting** (subject has higher weight than body)
- **Multi-field search** with best fields matching

### ✅ Filtering
- **Folder filtering** - Filter by specific folders (INBOX, SENT, etc.)
- **Account filtering** - Filter by email accounts
- **Date range filtering** - Filter by date ranges
- **Status filtering** - Filter by read/unread, important, attachments
- **Label filtering** - Filter by email labels

### ✅ Pagination
- **Page-based pagination** with configurable page size
- **Total count** and performance metrics

### ✅ Analytics
- **Email statistics** - Total counts, unread, important, attachments
- **Folder distribution** - Count of emails per folder
- **Account distribution** - Count of emails per account

## 🗂️ Elasticsearch Mapping

The email index includes these fields:

```json
{
  "uid": "long",
  "from": "text + keyword",
  "to": "text + keyword", 
  "subject": "text + keyword",
  "body": "text",
  "date": "date",
  "folder": "keyword",
  "account": "keyword",
  "isRead": "boolean",
  "isImportant": "boolean",
  "hasAttachments": "boolean",
  "messageId": "keyword",
  "threadId": "keyword",
  "labels": "keyword"
}
```

## 🔧 Configuration

### Elasticsearch Connection
- **Host**: `http://localhost:9200`
- **Version**: 8.15.0 (matches Docker image)

### Index Settings
- **Custom analyzer** for email content
- **Keyword fields** for exact matching
- **Text fields** for full-text search

## 🐳 Docker Services

- **Elasticsearch**: `http://localhost:9200`
- **Kibana**: `http://localhost:5601` (for debugging and visualization)

## 📝 Example Usage

### Search for emails about "meeting" in INBOX
```bash
curl "http://localhost:3000/search?q=meeting&folder=INBOX"
```

### Search for unread emails from specific sender
```bash
curl "http://localhost:3000/search?from=john@example.com&isRead=false"
```

### Search with date range
```bash
curl "http://localhost:3000/search?dateFrom=2024-01-01&dateTo=2024-01-31"
```

### Get all folders
```bash
curl "http://localhost:3000/folders"
```

## 🚨 Troubleshooting

### Elasticsearch Connection Issues
1. Make sure Docker is running
2. Check if Elasticsearch is accessible: `curl http://localhost:9200`
3. Verify the client version matches server version (8.15.0)

### Search Not Working
1. Check if emails are being indexed (look for "📩 Indexed email" logs)
2. Verify the index exists: `curl http://localhost:9200/emails`
3. Check Kibana for index mapping and data

### Performance Issues
1. Increase Elasticsearch memory: `ES_JAVA_OPTS=-Xms1g -Xmx1g`
2. Adjust pagination size
3. Use specific filters to reduce search scope
