import {
  Search,
  Filter,
  X,
  User,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";


import { api } from "../../services/expertApi";
import ExpertCard from "../../components/expert/ExpertCard";
import CalendarBooking from "../../components/expert/CalendarBooking";
// ─── Main Module 1 Page ───────────────────────────────────────────────────────
export default function ExpertBookingPage() {
  const navigate = useNavigate();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ specialization: "", minRating: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExperts({
        search,
        specialization: filters.specialization,
        minRating: filters.minRating,
        page,
        limit: 9,
        status: "approved",
      });
      setExperts(data.experts || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      console.error("Failed to load experts");
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  if (selectedExpert) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <CalendarBooking
          expert={selectedExpert}
          onBack={() => setSelectedExpert(null)}
          onBooked={(consultation) => {
            setSelectedExpert(null);
            // Send them straight to the detail page to complete payment
            // and unlock secure chat with the expert.
            navigate(`/consultations/${consultation._id}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Find an Expert</h1>
        <p className="text-sm text-gray-500">Browse verified agriculture experts and book consultations</p>
      </div>

      <div className="p-6">
        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or specialization..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:border-green-400 text-sm font-medium text-gray-700 transition-colors"
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Specialization</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">All</option>
                <option value="soil">Soil Science</option>
                <option value="pest">Pest Management</option>
                <option value="irrigation">Irrigation</option>
                <option value="organic">Organic Farming</option>
                <option value="crop">Crop Science</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters((f) => ({ ...f, minRating: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Any</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            <button
              onClick={() => { setFilters({ specialization: "", minRating: "" }); setSearch(""); }}
              className="col-span-full text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          </div>
        )}

        {/* Expert Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No experts found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <ExpertCard key={expert._id} expert={expert} onSelect={setSelectedExpert} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-green-400 transition-colors">
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${page === i + 1 ? "bg-green-600 text-white" : "border border-gray-200 hover:border-green-400"}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:border-green-400 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
