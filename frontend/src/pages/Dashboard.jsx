import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import CropCard from "../components/CropCard";

const Dashboard = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCrops = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/crops/mine", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setCrops(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this crop listing? This cannot be undone.")) return;
    try {
      await api.delete(`/crops/${id}`);
      setCrops((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete listing");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-900">My Crop Listings</h1>
          <p className="text-sm text-leaf-500">Create, update stock, pricing and photos for your crops.</p>
        </div>
        <Link to="/crops/new" className="btn-primary">+ Add New Crop</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "Active", "Out of Stock", "Inactive"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s
                ? "bg-leaf-600 text-white border-leaf-600"
                : "bg-white text-leaf-600 border-leaf-200 hover:border-leaf-400"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <p className="text-leaf-500">Loading your listings...</p>
      ) : crops.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-leaf-500 mb-4">You haven't listed any crops yet.</p>
          <Link to="/crops/new" className="btn-primary">List your first crop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <CropCard key={crop._id} crop={crop} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
