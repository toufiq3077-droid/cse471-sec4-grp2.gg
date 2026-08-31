import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package, MapPin, Loader } from 'lucide-react';
import { cropApi, categoryLabels } from '../../services/cropApi';

export default function MyListingsPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cropApi.getMine();
      setCrops(data.crops || []);
    } catch (err) {
      setError(err.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (crop) => {
    if (!window.confirm(`Delete "${crop.name}" listing? This cannot be undone.`)) return;
    try {
      await cropApi.remove(crop._id);
      toast.success('Listing deleted.');
      setCrops((prev) => prev.filter((c) => c._id !== crop._id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete listing.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Crop Listings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage the crops you are selling on the marketplace.</p>
        </div>
        <Link
          to="/marketplace/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
        >
          <Plus className="w-4 h-4" /> Add New Listing
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
          <p className="text-rose-600 font-semibold">{error}</p>
        </div>
      ) : crops.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">No listings yet</h2>
          <p className="text-slate-500 text-sm mb-6">Add your first crop listing to start selling.</p>
          <Link
            to="/marketplace/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm"
          >
            <Plus className="w-4 h-4" /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {crops.map((crop) => {
            const inStock = crop.status === 'available' && crop.quantity > 0;
            return (
              <div key={crop._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                <Link to={`/marketplace/${crop._id}`} className="w-36 sm:w-44 shrink-0 bg-slate-100">
                  {crop.photos?.[0] ? (
                    <img src={crop.photos[0]} alt={crop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-10 h-10" />
                    </div>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/marketplace/${crop._id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                        {crop.name}
                      </Link>
                      <span className="block text-xs text-slate-500 uppercase tracking-wide">
                        {categoryLabels[crop.category] || crop.category}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        inStock ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inStock ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="mt-1 text-sm">
                    <span className="font-bold text-emerald-700">৳{crop.price}</span>
                    <span className="text-slate-500"> / {crop.unit}</span>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-slate-600">{crop.quantity} {crop.unit}(s)</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[crop.location?.city, crop.location?.district].filter(Boolean).join(', ') || 'Bangladesh'}
                  </p>

                  <div className="flex gap-2 mt-auto pt-3">
                    <Link
                      to={`/marketplace/${crop._id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(crop)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
