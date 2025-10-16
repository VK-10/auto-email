import { useState } from 'react';
import { Mail, Star, Paperclip, Calendar, User, Folder, ChevronDown, ChevronRight } from 'lucide-react';

// Define types locally to avoid import issues
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
  aiCategory?: string;
  aiConfidence?: number;
  aiReasoning?: string;
};

type SearchResult = {
  emails: Email[];
  total: number;
  took: number;
};

interface EmailListProps {
  searchResult: SearchResult | null;
  loading: boolean;
  onLoadMore: () => void;
}

export default function EmailList({ searchResult, loading, onLoadMore }: EmailListProps) {
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  const toggleExpanded = (emailId: string) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && !searchResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Searching emails...</span>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Results</h3>
          <p className="text-gray-600">Enter a search query to find emails</p>
        </div>
      </div>
    );
  }

  if (searchResult.emails.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Emails Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-900">{searchResult.total.toLocaleString()}</span> emails in {searchResult.took}ms
        </div>
        {searchResult.emails.length < searchResult.total && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Load More
          </button>
        )}
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {searchResult.emails.map((email) => {
          const isExpanded = expandedEmails.has(email.id);
          
          return (
            <div
              key={email.id}
              className={`bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${
                !email.isRead ? 'border-l-4 border-l-blue-600 border-gray-200' : 'border-gray-200'
              }`}
              onClick={() => toggleExpanded(email.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Subject and Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      {!email.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                      {email.isImportant && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                      {email.hasAttachments && (
                        <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {email.subject || '(No Subject)'}
                      </h3>
                      {email.aiCategory && (
                        <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded flex-shrink-0">
                          {email.aiCategory}
                        </span>
                      )}
                    </div>

                    {/* From/To */}
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{email.from}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{email.to}</span>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(email.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5" />
                        <span>{email.folder}</span>
                      </div>
                      <span>{email.account}</span>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {email.body && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {truncateText(email.body, 500)}
                            </p>
                          </div>
                        )}

                        {email.labels && email.labels.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {email.labels.map((label, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {email.aiReasoning && (
                          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                            <strong>AI Analysis:</strong> {email.aiReasoning}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(email.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {searchResult.emails.length < searchResult.total && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : `Load More (${searchResult.total - searchResult.emails.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}