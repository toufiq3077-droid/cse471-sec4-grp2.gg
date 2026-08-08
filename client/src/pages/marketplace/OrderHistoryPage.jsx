import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Loader, Package } from 'lucide-react';
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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderApi
      .getMine()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Order History</h1>
          <p className="text-slate-500 text-sm">Your past orders and invoices.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
          <p className="text-rose-600 font-semibold">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">No orders yet</h2>
          <p className="text-slate-500 text-sm mb-6">When you place an order, its invoice will appear here.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusStyle = STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-700 border-slate-200';
            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-emerald-300 transition block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {order.status}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          order.payment.status === 'paid'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {order.payment.status === 'paid' ? 'Paid' : 'Payment Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(order.createdAt)} • {order.itemCount} item(s)
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {order.items.map((item) => item.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-extrabold text-emerald-700">৳{order.total}</p>
                    <p className="text-xs text-slate-400">View Invoice →</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
