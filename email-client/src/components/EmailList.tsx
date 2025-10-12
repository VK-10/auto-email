import { useState } from 'react';
import { Mail, Star, Paperclip, Calendar, User, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { searchEmails } from '../api/email';

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
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Searching emails...</span>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Results</h3>
          <p className="text-gray-600">Enter a search query to find emails</p>
        </div>
      </div>
    );
  }

  if (searchResult.emails.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Emails Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Found {searchResult.total.toLocaleString()} emails in {searchResult.took}ms
        </div>
        {searchResult.emails.length < searchResult.total && (
          <button
            onClick={onLoadMore}
            className="btn-secondary text-sm"
          >
            Load More
          </button>
        )}
      </div>

      {/* Email List */}
      <div className="space-y-2">
        {searchResult.emails.map((email) => {
          const isExpanded = expandedEmails.has(email.id);
          
          return (
            <div
              key={email.id}
              className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
                !email.isRead ? 'border-l-4 border-l-primary-500 bg-blue-50' : ''
              }`}
              onClick={() => toggleExpanded(email.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {email.isImportant && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      {email.hasAttachments && (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                      {!email.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 truncate">
                      {email.subject || '(No Subject)'}
                    </span>
                    {email.aiCategory && (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        email.aiCategory === 'Interested' ? 'bg-green-100 text-green-800' :
                        email.aiCategory === 'Meeting Booked' ? 'bg-blue-100 text-blue-800' :
                        email.aiCategory === 'Not Interested' ? 'bg-red-100 text-red-800' :
                        email.aiCategory === 'Spam' ? 'bg-orange-100 text-orange-800' :
                        email.aiCategory === 'Out of Office' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        🤖 {email.aiCategory}
                        {email.aiConfidence && (
                          <span className="ml-1 opacity-75">
                            ({Math.round(email.aiConfidence * 100)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* From/To Row */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{email.from}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{email.to}</span>
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(email.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      <span>{email.folder}</span>
                    </div>
                    <span>{email.account}</span>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Subject:</span>
                          <p className="text-sm text-gray-900">{email.subject || '(No Subject)'}</p>
                        </div>
                        
                        {email.body && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Body:</span>
                            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                              {truncateText(email.body, 500)}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">From:</span>
                            <p className="text-gray-900">{email.from}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">To:</span>
                            <p className="text-gray-900">{email.to}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Date:</span>
                            <p className="text-gray-900">{new Date(email.date).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Folder:</span>
                            <p className="text-gray-900">{email.folder}</p>
                          </div>
                        </div>

                        {email.labels && email.labels.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Labels:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {email.labels.map((label, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(email.id);
                  }}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {searchResult.emails.length < searchResult.total && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="btn-primary"
          >
            Load More ({searchResult.total - searchResult.emails.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
