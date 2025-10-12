import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Folder, Mail, Star, Paperclip, Brain } from 'lucide-react';
import { searchEmails, getFolders, getAccounts, getStats, getAICategories, getAIStats } from '../api/email';

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
  aiCategory?: string;
  size?: number;
  page?: number;
};

interface SearchInterfaceProps {
  onSearch: (options: SearchOptions) => void;
  loading: boolean;
}

export default function SearchInterface({ onSearch, loading }: SearchInterfaceProps) {
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    size: 20,
    page: 0
  });
  
  const [folders, setFolders] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [aiCategories, setAiCategories] = useState<string[]>([]);
  const [aiStats, setAiStats] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [foldersData, accountsData, statsData, aiCategoriesData, aiStatsData] = await Promise.all([
          getFolders(),
          getAccounts(),
          getStats(),
          getAICategories(),
          getAIStats()
        ]);
        setFolders(foldersData);
        setAccounts(accountsData);
        setStats(statsData);
        setAiCategories(aiCategoriesData);
        setAiStats(aiStatsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleSearch = () => {
    onSearch(searchOptions);
  };

  const handleClear = () => {
    setSearchOptions({
      query: '',
      size: 20,
      page: 0
    });
    onSearch({ size: 20, page: 0 });
  };

  const handleInputChange = (field: keyof SearchOptions, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Search Emails</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchOptions.query || ''}
            onChange={(e) => handleInputChange('query', e.target.value)}
            className="input-field pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        <button
          onClick={handleClear}
          className="btn-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.important}</div>
            <div className="text-sm text-gray-600">Important</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.withAttachments}</div>
            <div className="text-sm text-gray-600">With Attachments</div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Folder Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Folder className="w-4 h-4 inline mr-1" />
              Folder
            </label>
            <select
              value={searchOptions.folder || ''}
              onChange={(e) => handleInputChange('folder', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">All Folders</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Account
            </label>
            <select
              value={searchOptions.account || ''}
              onChange={(e) => handleInputChange('account', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>

          {/* From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              From
            </label>
            <input
              type="text"
              placeholder="Sender email..."
              value={searchOptions.from || ''}
              onChange={(e) => handleInputChange('from', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          {/* To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              To
            </label>
            <input
              type="text"
              placeholder="Recipient email..."
              value={searchOptions.to || ''}
              onChange={(e) => handleInputChange('to', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date From
            </label>
            <input
              type="date"
              value={searchOptions.dateFrom || ''}
              onChange={(e) => handleInputChange('dateFrom', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date To
            </label>
            <input
              type="date"
              value={searchOptions.dateTo || ''}
              onChange={(e) => handleInputChange('dateTo', e.target.value || undefined)}
              className="input-field"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.isRead === false}
                  onChange={(e) => handleInputChange('isRead', e.target.checked ? false : undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm">Unread</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.isImportant === true}
                  onChange={(e) => handleInputChange('isImportant', e.target.checked ? true : undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Important
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.hasAttachments === true}
                  onChange={(e) => handleInputChange('hasAttachments', e.target.checked ? true : undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm flex items-center">
                  <Paperclip className="w-3 h-3 mr-1" />
                  Attachments
                </span>
              </label>
            </div>
          </div>

          {/* AI Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Brain className="w-4 h-4 inline mr-1" />
              AI Category
            </label>
            <select
              value={searchOptions.aiCategory || ''}
              onChange={(e) => handleInputChange('aiCategory', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {aiCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
