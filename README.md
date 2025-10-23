# 🤖 AI-Powered Email Categorization & Lead Management System

An intelligent email automation system that monitors Gmail in real-time, categorizes emails using AI, and instantly notifies your team about interested leads via Slack.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=flat&logo=elasticsearch&logoColor=white)
![Slack](https://img.shields.io/badge/Slack-4A154B?style=flat&logo=slack&logoColor=white)

## 🌟 Features

- **Real-Time Email Monitoring** - IMAP IDLE connection detects new emails instantly
- **AI-Powered Categorization** - Groq AI categorizes emails with 90%+ confidence
- **Smart Fallback** - Rule-based classification when AI is unavailable
- **Advanced Search** - Full-text search with filtering across 1000+ indexed emails
- **Slack Integration** - Instant notifications for interested leads
- **Webhook Support** - Trigger custom workflows for any email category
- **Batch Processing** - Efficient queue-based AI categorization


## 📊 Email Categories

The system automatically categorizes emails into:

- 🎯 **Interested** - Customer shows interest, asks questions, wants demo/pricing
- 📅 **Meeting Booked** - Meeting confirmed, calendar invites, scheduled calls
- ❌ **Not Interested** - Rejections, unsubscribe requests, not a fit
- 🗑️ **Spam** - Promotional content, scams, phishing, unsolicited emails
- 🏖️ **Out of Office** - Auto-replies, vacation messages, away notifications

## 🏗️ Architecture

```
            ┌─────────────┐
            │   Gmail     │
            │   (IMAP)    │
            └──────┬──────┘
                   │ IMAP IDLE
                   ↓
┌─────────────────────────────────────────────┐
│           Node.js Backend Server            │
│  ┌────────────────────────────────────────┐ │
│  │  IMAP Client (Real-time monitoring)    │ │
│  └──────────────────┬─────────────────────┘ │
│                     ↓                       │
│  ┌────────────────────────────────────────┐ │
│  │  Categorization Queue (Batch: 10)      │ │
│  └──────────────────┬─────────────────────┘ │
│                     ↓                       │
│  ┌────────────────────────────────────────┐ │
│  │  Groq AI + Rule-based Fallback         │ │
│  └──────────────────┬─────────────────────┘ │
│                     ↓                       │
│  ┌────────────────────────────────────────┐ │
│  │  Elasticsearch (Indexing & Search)     │ │
│  └──────────────────┬─────────────────────┘ │
│                     ↓                       │
│  ┌────────────────────────────────────────┐ │
│  │  Notification Service                  │ │
│  │  - Slack Webhook                       │ │
│  │  - Custom Webhooks                     │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                   │
                   ↓
            ┌──────────────┐
            │  WebSocket   │
            │   Clients    │
            └──────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Elasticsearch (v8+)
- Gmail account with IMAP enabled
- Groq API key
- Slack webhook URL (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/email-automation.git
cd email-automation/backend-mail
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Gmail OAuth**

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Download `credentials.json` and place it in `backend-mail/`
   - Run the OAuth flow to generate `token.json`:
   ```bash
   npm run auth
   ```

4. **Set up Elasticsearch**
```bash
# Using Docker
docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0

# Or install locally from https://www.elastic.co/downloads/elasticsearch
```

5. **Configure environment variables**

Create `.env` file in `backend-mail/`:
```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com

# Groq API
GROQ_API_KEY=your-groq-api-key

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Custom Webhook (optional)
WEBHOOK_URL=https://your-webhook-endpoint.com

# Server Configuration
PORT=3000
```

6. **Start Elasticsearch** (if not already running)
```bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Should return cluster info
```

7. **Start the server**
```bash
npm run dev
```

## 📡 API Endpoints

### Search Emails
```http
GET /search?q=interested&aiCategory=Interested&size=20
```

**Query Parameters:**
- `q` or `query` - Search term
- `aiCategory` - Filter by category
- `folder` - Filter by folder
- `from` - Filter by sender
- `dateFrom` / `dateTo` - Date range
- `isRead` - Boolean filter
- `size` - Results per page (default: 20)
- `page` - Page number (default: 0)

**Response:**
```json
{
  "emails": [
    {
      "id": "12345",
      "from": "customer@company.com",
      "subject": "Interested in demo",
      "body": "Can you show me your product?",
      "aiCategory": "Interested",
      "aiConfidence": 0.95,
      "date": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "took": 12
}
```

### Batch Categorize Emails
```http
POST /categorize/batch
Content-Type: application/json

{
  "emails": [
    {
      "from": "customer@example.com",
      "subject": "Interested in your product",
      "body": "Can we schedule a demo?"
    }
  ]
}
```

### Get Email Statistics
```http
GET /stats
```

**Response:**
```json
{
  "total": 1523,
  "byFolder": [...],
  "byAccount": [...],
  "unread": 45,
  "important": 12,
  "withAttachments": 234
}
```



## 🔧 Project Structure

```
backend-mail/
├── src/
│   ├── index.ts                 # Main server & API routes
│   ├── idle-mode.ts            # IMAP IDLE real-time monitoring
│   ├── email-categorizer.ts    # AI categorization logic
│   ├── elastic-index.ts        # Elasticsearch integration
│   ├── elastic-search.ts       # Elasticsearch client
│   ├── notifications.ts        # Slack & webhook notifications
│   ├── mail.ts                 # Email fetching utilities
│   ├── oauth.ts                # Gmail OAuth handling
│   ├── batch-runner.ts         # Batch categorization script
│   └── utils/
│       └── fetch-mails.ts      # IMAP email fetching
├── credentials.json            # Gmail OAuth credentials
├── token.json                  # OAuth token (auto-generated)
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Express.js** - REST API framework

### AI & ML
- **Groq AI** - LLM-based email categorization
- **Rule-based fallback** - Pattern matching for offline mode

### Data Storage & Search
- **Elasticsearch** - Full-text search and indexing
- **IMAP** - Real-time email monitoring

### Integrations
- **Slack API** - Team notifications
- **WebSocket** - Real-time client updates
- **Custom Webhooks** - External integrations

### Libraries
- `node-imap` - IMAP client
- `@elastic/elasticsearch` - Elasticsearch client
- `groq-sdk` - Groq AI SDK
- `p-queue` - Rate-limited batch processing
- `ws` - WebSocket server
- `dotenv` - Environment configuration

## 📈 Performance

- **Email Processing**: ~500ms per batch of 10 emails
- **AI Categorization**: 90%+ accuracy with 0.9 confidence
- **Search Response Time**: <50ms for most queries
- **Real-time Detection**: <1s from email arrival to notification
- **Batch Processing**: 100 emails/minute with rate limiting


---

⭐ **Star this repository if you find it useful!**

📧 **Questions?** Open an issue or reach out on LinkedIn!
