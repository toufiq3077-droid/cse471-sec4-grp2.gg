import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader, Package, ShoppingBag, Sprout, Wallet } from 'lucide-react';
import { farmerSummaryApi } from '../../services/farmerSummaryApi';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatMoney(value) {
  return `Tk ${Number(value || 0).toLocaleString('en-BD')}`;
}

function EmptyTable({ message }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-500">{message}</p>;
}

export default function FarmerMarketplaceSummaryPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    farmerSummaryApi
      .get()
      .then((data) => setSummary(data))
      .catch((err) => setError(err.message || 'Failed to load your marketplace summary.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader className="w-8 h-8 text-emerald-600 animate-spin" /></div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="text-center py-16 bg-white rounded-2xl border border-rose-100"><p className="text-rose-600 font-semibold">{error}</p></div></div>;
  }

  const sales = summary?.sales || {};
  const inventory = summary?.inventory || {};
  const salesCards = [
    { label: 'Total Revenue', value: formatMoney(sales.totalRevenue), icon: Wallet, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Orders', value: sales.totalOrders || 0, icon: ClipboardList, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Units Sold', value: sales.unitsSold || 0, icon: ShoppingBag, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Completed Orders', value: sales.completedOrders || 0, icon: CheckCircle2, tone: 'bg-green-50 text-green-700' },
    { label: 'Pending Orders', value: sales.pendingOrders || 0, icon: ClipboardList, tone: 'bg-amber-50 text-amber-700' },
  ];
  const inventoryCards = [
    { label: 'Total Listed Crops', value: inventory.totalListedCrops || 0 },
    { label: 'Low Stock Crops', value: inventory.lowStockCrops || 0 },
    { label: 'Out of Stock Crops', value: inventory.outOfStockCrops || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center"><Sprout className="w-5 h-5" /></div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Farmer Marketplace Summary</h1>
          <p className="text-slate-500 text-sm mt-1">Your sales, crop inventory, and latest marketplace orders.</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Sales Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {salesCards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-4 h-4" /></div><p className="text-sm text-slate-500 mt-4">{label}</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p></div>)}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Inventory Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {inventoryCards.map(({ label, value }) => <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center"><Package className="w-5 h-5" /></div><div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-extrabold text-slate-900">{value}</p></div></div>)}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Crop Performance</h2>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {summary.cropPerformance?.length ? <table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Crop Name</th><th className="px-5 py-3 font-semibold">Units Sold</th><th className="px-5 py-3 font-semibold">Current Stock</th><th className="px-5 py-3 font-semibold">Current Price</th><th className="px-5 py-3 font-semibold">Revenue</th></tr></thead><tbody className="divide-y divide-slate-100">{summary.cropPerformance.map((crop) => <tr key={crop.cropId}><td className="px-5 py-4 font-semibold text-slate-900">{crop.cropName}</td><td className="px-5 py-4 text-slate-600">{crop.unitsSold} {crop.unit}</td><td className="px-5 py-4 text-slate-600">{crop.currentStock} {crop.unit}</td><td className="px-5 py-4 text-slate-600">{formatMoney(crop.currentPrice)}/{crop.unit}</td><td className="px-5 py-4 font-semibold text-emerald-700">{formatMoney(crop.revenue)}</td></tr>)}</tbody></table> : <EmptyTable message="No crop listings yet. Add a listing to see its performance here." />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Recent Orders</h2>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {summary.recentOrders?.length ? <table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Order ID</th><th className="px-5 py-3 font-semibold">Crop Name</th><th className="px-5 py-3 font-semibold">Quantity</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{summary.recentOrders.map((order) => <tr key={`${order.orderId}-${order.cropId}`}><td className="px-5 py-4 font-semibold text-slate-900">#{order.orderNumber}</td><td className="px-5 py-4 text-slate-600">{order.cropName}</td><td className="px-5 py-4 text-slate-600">{order.quantity} {order.unit}</td><td className="px-5 py-4 font-semibold text-emerald-700">{formatMoney(order.amount)}</td><td className="px-5 py-4"><span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>{order.status}</span></td></tr>)}</tbody></table> : <EmptyTable message="No marketplace orders have been received yet." />}
        </div>
      </section>
    </div>
  );
}
