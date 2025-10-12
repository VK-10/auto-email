import { useState, useEffect } from "react";
import { searchEmails } from "./api/email";
import SearchInterface from "./components/SearchInterface";
import EmailList from "./components/EmailList";

// Define types locally to avoid import issues
type SearchOptions = {
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
  size?: number;
  page?: number;
};

type Email = {
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
};

type SearchResult = {
  emails: Email[];
  total: number;
  took: number;
};

function App() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // WebSocket for real-time emails
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8081");

    ws.onopen = () => console.log("🔌 WebSocket connected");

    ws.onmessage = (event) => {
      const newEmail = JSON.parse(event.data);
      // Add new email to current results if it matches current search
      setSearchResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          emails: [newEmail, ...prev.emails],
          total: prev.total + 1
        };
      });
    };

    ws.onclose = () => console.log("🔌 WebSocket disconnected");

    return () => ws.close();
  }, []);

  const handleSearch = async (options: SearchOptions) => {
    setLoading(true);
    setCurrentPage(0);
    
    try {
      const result = await searchEmails({ ...options, page: 0 });
      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!searchResult || loading) return;
    
    setLoading(true);
    const nextPage = currentPage + 1;
    
    try {
      const result = await searchEmails({ 
        ...searchResult, 
        page: nextPage,
        size: 20 
      });
      
      setSearchResult(prev => prev ? {
        ...prev,
        emails: [...prev.emails, ...result.emails],
        total: result.total
      } : result);
      
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Search</h1>
          <p className="text-gray-600">Search and filter your emails with advanced Elasticsearch-powered search</p>
        </div>

        {/* Search Interface */}
        <SearchInterface onSearch={handleSearch} loading={loading} />

        {/* Email List */}
        <EmailList 
          searchResult={searchResult} 
          loading={loading} 
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}

export default App;
