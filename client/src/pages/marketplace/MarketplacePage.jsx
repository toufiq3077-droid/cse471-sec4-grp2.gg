import React, { useEffect, useState, useCallback } from 'react';
import { Search, Store, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { cropApi, CATEGORIES, categoryLabels } from '../../services/cropApi';
import CropCard from '../../components/marketplace/CropCard';

const LIMIT = 9;

export default function MarketplacePage() {
  const [crops, setCrops] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cropApi.list({ page, limit: LIMIT, search, category, sort });
      setCrops(data.crops || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const selectCategory = (cat) => {
    setCategory(cat === category ? '' : cat);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Store className="w-4 h-4" /> Fresh From the Farm
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Crop Marketplace</h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            Browse fresh produce listed directly by verified farmers across Bangladesh.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search crops (e.g. rice, tomato, mango)..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </form>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                category === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
          <p className="text-rose-600 font-semibold">{error}</p>
          <button
            onClick={fetchCrops}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl"
          >
            Try Again
          </button>
        </div>
      ) : crops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">No listings found.</p>
          <p className="text-slate-400 text-sm mt-1">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <CropCard key={crop._id} crop={crop} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:border-emerald-400 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:border-emerald-400 transition flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
