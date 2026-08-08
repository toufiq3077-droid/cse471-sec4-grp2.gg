import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Banknote, MapPin, Loader, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../services/orderApi';

const DELIVERY_FEE = 60;

const PAYMENT_METHODS = [
  {
    id: 'mock_bkash',
    title: 'bKash (Mock)',
    desc: 'Simulated bKash payment — no real charge',
    icon: CreditCard,
  },
  {
    id: 'cash_on_delivery',
    title: 'Cash on Delivery',
    desc: 'Pay in cash when your order arrives',
    icon: Banknote,
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('mock_bkash');
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    district: user?.address?.district || '',
    postalCode: user?.address?.postalCode || '',
  });
  const [placing, setPlacing] = useState(false);

  const items = cart.items || [];
  const subtotal = cart.subtotal || 0;
  const total = subtotal + (items.length ? DELIVERY_FEE : 0);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    if (!address.street.trim() || !address.city.trim() || !address.district.trim()) {
      toast.error('Please fill in your delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const data = await orderApi.place({ paymentMethod, shippingAddress: address });
      await clearCart();
      toast.success(data.message || 'Order placed successfully!');
      navigate(`/orders/${data.order._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 font-medium">Your cart is empty. Add items before checking out.</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl"
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/cart')}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </button>

      <h1 className="text-3xl font-black text-slate-900 mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-emerald-600" /> Delivery Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  name="street"
                  required
                  value={address.street}
                  onChange={handleChange}
                  placeholder="House, road, area"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">City / Upazila</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Sadar"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  required
                  value={address.district}
                  onChange={handleChange}
                  placeholder="Dinajpur"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleChange}
                  placeholder="5200"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = paymentMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`cursor-pointer rounded-2xl border-2 p-4 flex items-start gap-3 transition ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{method.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 max-h-64 overflow-auto pr-1">
            {items.map((item) => (
              <div key={item.cropId} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} × ৳{item.price}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900">৳{item.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-4 pt-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">৳{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">৳{DELIVERY_FEE}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-extrabold text-emerald-700 text-lg">৳{total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
          >
            {placing ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Mock payment only — no real money is charged.
          </p>
        </div>
      </form>
    </div>
  );
}
