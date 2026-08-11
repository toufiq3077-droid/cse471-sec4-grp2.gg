import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Package, MapPin, Phone, User as UserIcon, CheckCircle2, Clock, CreditCard, Truck } from 'lucide-react';
import { orderApi } from '../../services/orderApi';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderApi
      .get(id)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-pulse bg-white rounded-2xl border border-slate-200 h-96 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-rose-600 font-semibold">{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/orders')} className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
          Back to Orders
        </button>
      </div>
    );
  }

  const { payment } = order;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Invoice header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 sm:px-10 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Invoice</p>
              <h1 className="text-2xl sm:text-3xl font-black">Order #{order.orderNumber}</h1>
              <p className="text-emerald-100 text-sm mt-1">Placed on {formatDateTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider`}>
                {order.status}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                  payment.status === 'paid'
                    ? 'bg-emerald-400/30 border border-emerald-300 text-emerald-100'
                    : 'bg-amber-400/30 border border-amber-300 text-amber-100'
                }`}
              >
                {payment.status === 'paid' ? 'Payment: Paid' : 'Payment: ' + payment.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {/* Buyer & shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" /> Billed To
              </h3>
              <p className="font-bold text-slate-900">{order.buyerName || 'Buyer'}</p>
              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" /> {order.buyerPhone || '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {order.shippingAddress?.street}
                <br />
                {[order.shippingAddress?.city, order.shippingAddress?.district]
                  .filter(Boolean)
                  .join(', ')}
                {order.shippingAddress?.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}
              </p>
            </div>
          </div>

          {/* Delivery driver */}
          {order.riderId && (
            <div
              className={`rounded-2xl p-5 border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                order.status === 'delivered'
                  ? 'bg-green-50 border-green-100'
                  : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {order.status === 'delivered' ? <CheckCircle2 className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {order.status === 'delivered' ? 'Delivered By' : 'Your Delivery Driver'}
                  </h3>
                  <p className="font-bold text-slate-900">{order.riderName || 'Rider'}</p>
                  {order.riderPhone && (
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {order.riderPhone}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {order.status === 'delivered'
                  ? 'Your order has been delivered by the rider above.'
                  : 'A rider has accepted your order and is handling the delivery.'}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Items ({order.itemCount})</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">by {item.farmerName || 'Farmer'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">৳{item.subtotal}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} × ৳{item.price}/{item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment + totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Payment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="font-semibold text-slate-800">
                    {payment.method === 'mock_bkash' ? 'bKash (Mock)' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-800 capitalize">{payment.status}</span>
                </div>
                {payment.transactionId && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs break-all text-right">
                      {payment.transactionId}
                    </span>
                  </div>
                )}
                {payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid On</span>
                    <span className="font-semibold text-slate-800">{formatDateTime(payment.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Amount Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">৳{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900">৳{order.deliveryFee}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-extrabold text-emerald-700 text-lg">৳{order.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status note */}
          <div className="mt-8 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800">
            {order.status === 'delivered' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 shrink-0" />
            )}
            <p>
              {order.status === 'delivered'
                ? 'This order has been delivered. Thank you for shopping with Khet-i!'
                : 'Your order is being processed. You can track its status here.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
