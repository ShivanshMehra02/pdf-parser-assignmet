'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  FileText,
  Upload,
  Search,
  LogOut,
  Loader2,
  FileUp,
  Table,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Filter,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import PdfViewer from '@/components/PdfViewer';
import TransactionsTable from '@/components/TransactionsTable';

interface User {
  id: number;
  email: string;
  name: string;
}

interface Transaction {
  id: number;
  documentNumber: string;
  documentYear: string;
  documentDate: string;
  buyerName: string;
  buyerNameTamil: string;
  sellerName: string;
  sellerNameTamil: string;
  houseNumber: string;
  surveyNumber: string;
  plotNumber: string;
  propertyType: string;
  propertyExtent: string;
  village: string;
  considerationValue: string;
  marketValue: string;
  pdfFileName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // PDF Preview state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    buyerName: '',
    sellerName: '',
    houseNumber: '',
    surveyNumber: '',
    documentNumber: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user');
      }
    }

    fetchTransactions();
  }, [router]);

  const fetchTransactions = async (searchFilters?: typeof filters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const filtersToUse = searchFilters || filters;
      
      if (filtersToUse.buyerName) params.append('buyerName', filtersToUse.buyerName);
      if (filtersToUse.sellerName) params.append('sellerName', filtersToUse.sellerName);
      if (filtersToUse.houseNumber) params.append('houseNumber', filtersToUse.houseNumber);
      if (filtersToUse.surveyNumber) params.append('surveyNumber', filtersToUse.surveyNumber);
      if (filtersToUse.documentNumber) params.append('documentNumber', filtersToUse.documentNumber);

      const response = await api.get(`/transactions?${params.toString()}`);
      setTransactions(response.data.transactions || []);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setShowPdfPreview(true);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!pdfFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const response = await api.post('/transactions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        setSuccess(`Successfully processed ${response.data.count} transactions!`);
        fetchTransactions();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and process PDF');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSearch = () => {
    fetchTransactions(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      buyerName: '',
      sellerName: '',
      houseNumber: '',
      surveyNumber: '',
      documentNumber: '',
    });
    fetchTransactions({
      buyerName: '',
      sellerName: '',
      houseNumber: '',
      surveyNumber: '',
      documentNumber: '',
    });
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all transactions? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/transactions/all');
      setSuccess('All transactions deleted');
      setTransactions([]);
    } catch (err: any) {
      setError('Failed to delete transactions');
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-slate-800">
                  Tamil PDF Translator
                </h1>
                <p className="text-xs text-slate-500">Real Estate Documents</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="logout-button"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between fade-in">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-between fade-in">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Upload size={20} className="text-primary-500" />
            Upload Tamil PDF
          </h2>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Upload Area */}
            <div className="flex-1">
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="mb-2 text-sm text-slate-600">
                    <span className="font-semibold text-primary-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">PDF files only (max 50MB)</p>
                </div>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="pdf-upload-input"
                />
              </label>

              {pdfFile && (
                <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{pdfFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPdfPreview(true)}
                      className="p-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        setPdfUrl(null);
                      }}
                      className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!pdfFile || isUploading}
                className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
                data-testid="upload-button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload & Process PDF
                  </>
                )}
              </button>
            </div>

            {/* PDF Preview Thumbnail */}
            {pdfUrl && (
              <div className="lg:w-72">
                <div
                  className="bg-slate-100 rounded-xl p-4 cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => setShowPdfPreview(true)}
                >
                  <p className="text-sm font-medium text-slate-600 mb-2">PDF Preview</p>
                  <div className="aspect-[3/4] bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <FileText className="w-16 h-16 text-slate-300" />
                  </div>
                  <p className="text-xs text-primary-500 mt-2 text-center">Click to view full preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Search size={20} className="text-primary-500" />
              Search Transactions
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Buyer Name</label>
                <input
                  type="text"
                  value={filters.buyerName}
                  onChange={(e) => setFilters({ ...filters, buyerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search buyer..."
                  data-testid="filter-buyer-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Seller Name</label>
                <input
                  type="text"
                  value={filters.sellerName}
                  onChange={(e) => setFilters({ ...filters, sellerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search seller..."
                  data-testid="filter-seller-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">House Number</label>
                <input
                  type="text"
                  value={filters.houseNumber}
                  onChange={(e) => setFilters({ ...filters, houseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search house #..."
                  data-testid="filter-house-number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Survey Number</label>
                <input
                  type="text"
                  value={filters.surveyNumber}
                  onChange={(e) => setFilters({ ...filters, surveyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search survey #..."
                  data-testid="filter-survey-number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Document Number</label>
                <input
                  type="text"
                  value={filters.documentNumber}
                  onChange={(e) => setFilters({ ...filters, documentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search doc #..."
                  data-testid="filter-document-number"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              data-testid="search-button"
            >
              <Search size={18} />
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <X size={18} />
              Clear Filters
            </button>
            {transactions.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors ml-auto"
                data-testid="delete-all-button"
              >
                <Trash2 size={18} />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Table size={20} className="text-primary-500" />
              Transactions
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                {transactions.length} records
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-slate-500">Loading transactions...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <FileText className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Upload a PDF to get started</p>
            </div>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">PDF Preview</h3>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PdfViewer url={pdfUrl} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
