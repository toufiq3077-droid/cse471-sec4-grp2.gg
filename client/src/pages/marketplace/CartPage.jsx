import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, ShoppingBag, Loader } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const DELIVERY_FEE = 60;

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeItem } = useCart();

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const total = subtotal + (items.length ? DELIVERY_FEE : 0);

  const handleQuantityChange = async (cropId, quantity) => {
    try {
      const data = await updateQuantity(cropId, quantity);
      if (quantity < 1) toast.success('Item removed from cart.');
    } catch (error) {
      toast.error(error.message || 'Failed to update quantity.');
    }
  };

  const handleRemove = async (cropId) => {
    try {
      const data = await removeItem(cropId);
      toast.success('Item removed from cart.');
    } catch (error) {
      toast.error(error.message || 'Failed to remove item.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Cart</h1>
          <p className="text-slate-500 text-sm">Review your selected crops before checkout.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mb-6">Browse the marketplace and add some fresh crops.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.cropId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-4"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/marketplace/${item.cropId}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 truncate"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-500">by {item.farmerName || 'Farmer'}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.cropId)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1">
                      <button
                        onClick={() => handleQuantityChange(item.cropId, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() =>
                          item.quantity < item.availableQty && handleQuantityChange(item.cropId, item.quantity + 1)
                        }
                        className={`p-1 rounded-md text-slate-600 ${
                          item.quantity >= item.availableQty ? 'opacity-40' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">৳{item.subtotal}</p>
                      <p className="text-xs text-slate-400">
                        ৳{item.price} / {item.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-semibold hover:underline"
            >
              <ArrowRight className="w-4 h-4" /> Continue shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-slate-900">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-900">৳{DELIVERY_FEE}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-extrabold text-emerald-700 text-lg">৳{total}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
