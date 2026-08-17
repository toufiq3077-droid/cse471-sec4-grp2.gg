import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  User as UserIcon,
  Package,
  Minus,
  Plus,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { cropApi, categoryLabels } from '../../services/cropApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, itemCount } = useCart();

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activePhoto, setActivePhoto] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    cropApi
      .get(id)
      .then((data) => {
        setCrop(data.crop);
        setActivePhoto(0);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load listing');
        navigate('/marketplace');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 h-96 animate-pulse" />
      </div>
    );
  }

  if (!crop) return null;

  const inStock = crop.status === 'available' && crop.quantity > 0;
  const isOwner = user && String(user._id) === String(crop.farmerId);
  const isBuyer = user?.role === 'buyer';

  const handleAddToCart = async () => {
    if (!isBuyer) {
      toast.error('Only buyers can add items to the cart.');
      return;
    }
    if (quantity > crop.quantity) {
      toast.error(`Only ${crop.quantity} ${crop.unit}(s) available.`);
      return;
    }
    setAdding(true);
    try {
      const data = await addToCart(crop._id, quantity);
      toast.success(data.message || 'Added to cart!');
      setQuantity(1);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Photo gallery */}
        <div>
          <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 aspect-square mb-3">
            {crop.photos?.[activePhoto] ? (
              <img src={crop.photos[activePhoto]} alt={crop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="w-20 h-20" />
              </div>
            )}
          </div>
          {crop.photos?.length > 1 && (
            <div className="flex gap-3">
              {crop.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhoto(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    activePhoto === index ? 'border-emerald-600' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <img src={photo} alt={`${crop.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide border border-emerald-200">
              {categoryLabels[crop.category] || crop.category}
            </span>
            {inStock ? (
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                In Stock
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                Out of Stock
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">{crop.name}</h1>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-extrabold text-emerald-700">৳{crop.price}</span>
            <span className="text-slate-500">/ {crop.unit}</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-6">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-emerald-600" /> {crop.farmerName || 'Farmer'}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {[crop.location?.city, crop.location?.district].filter(Boolean).join(', ') || 'Bangladesh'}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              {crop.quantity} {crop.unit}(s) available
            </span>
          </div>

          {crop.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{crop.description}</p>
            </div>
          )}

          {isOwner ? (
            <div className="flex flex-col gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
                This is your listing.
              </div>
              <Link
                to={`/marketplace/${crop._id}/edit`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
              >
                <Pencil className="w-4 h-4" /> Edit Listing
              </Link>
            </div>
          ) : inStock ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(q + 1, crop.quantity))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
              This item is currently out of stock.
            </div>
          )}

          {isBuyer && (
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              You have {itemCount} item(s) in your cart.{' '}
              <Link to="/cart" className="text-emerald-600 font-semibold hover:underline">
                View cart
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
