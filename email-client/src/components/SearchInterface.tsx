import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Folder, Mail, Star, Paperclip, Brain } from 'lucide-react';
import { getFolders, getAccounts, getStats, getAICategories } from '../api/email';

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
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [foldersData, accountsData, statsData, aiCategoriesData] = await Promise.all([
          getFolders(),
          getAccounts(),
          getStats(),
          getAICategories()
        ]);
        setFolders(foldersData);
        setAccounts(accountsData);
        setStats(statsData);
        setAiCategories(aiCategoriesData);
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

  const handleInputChange = (field: keyof SearchOptions, value: unknown) => {
    setSearchOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchOptions.query || ''}
            onChange={(e) => handleInputChange('query', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
        >
          Clear
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.important.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Important</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.withAttachments.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Attachments</div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Folder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder
              </label>
              <select
                value={searchOptions.folder || ''}
                onChange={(e) => handleInputChange('folder', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={searchOptions.account || ''}
                onChange={(e) => handleInputChange('account', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>

            {/* AI Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Category
              </label>
              <select
                value={searchOptions.aiCategory || ''}
                onChange={(e) => handleInputChange('aiCategory', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {aiCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="text"
                placeholder="sender@example.com"
                value={searchOptions.from || ''}
                onChange={(e) => handleInputChange('from', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                placeholder="recipient@example.com"
                value={searchOptions.to || ''}
                onChange={(e) => handleInputChange('to', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={searchOptions.dateFrom || ''}
                onChange={(e) => handleInputChange('dateFrom', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={searchOptions.dateTo || ''}
                onChange={(e) => handleInputChange('dateTo', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchOptions.isRead === false}
                  onChange={(e) => handleInputChange('isRead', e.target.checked ? false : undefined)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Unread</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchOptions.isImportant === true}
                  onChange={(e) => handleInputChange('isImportant', e.target.checked ? true : undefined)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Important</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchOptions.hasAttachments === true}
                  onChange={(e) => handleInputChange('hasAttachments', e.target.checked ? true : undefined)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has Attachments</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}