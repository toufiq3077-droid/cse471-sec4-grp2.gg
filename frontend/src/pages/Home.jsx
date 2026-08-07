import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

const Home = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/crops");
        setCrops(data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load marketplace");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-leaf-900">Fresh from the farm</h1>
          <p className="text-leaf-500 mt-1">Browse active crop listings and add items to your cart for checkout.</p>
        </div>
        <button onClick={() => navigate("/cart")} className="btn-primary w-full sm:w-auto">
          View Cart
        </button>
      </div>

      {loading ? (
        <p className="text-leaf-500">Loading marketplace...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
      ) : crops.length === 0 ? (
        <p className="text-leaf-500">No crop listings yet — be the first farmer to add one.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <ProductCard key={crop._id} crop={crop} onAddToCart={addItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
