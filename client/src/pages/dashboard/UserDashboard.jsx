import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, Stethoscope, History, User, ShoppingBag, Truck, BadgeCheck, ArrowRight, ShieldCheck, Store, Receipt, Package } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();

  const getRoleHeader = () => {
    switch (user?.role) {
      case 'farmer':
        return {
          badge: 'Farmer Portal',
          color: 'from-emerald-600 to-teal-700',
          desc: 'Diagnose crop diseases using AI, track history, and consult verified experts.',
        };
      case 'buyer':
        return {
          badge: 'Buyer Portal',
          color: 'from-blue-600 to-indigo-700',
          desc: 'Browse fresh farm produce, order directly from farmers, and manage deliveries.',
        };
      case 'expert':
        return {
          badge: 'Agriculture Expert Portal',
          color: 'from-purple-600 to-purple-800',
          desc: 'Manage your consultation appointments, assist farmers, and update availability.',
        };
      case 'rider':
        return {
          badge: 'Delivery Rider Portal',
          color: 'from-amber-600 to-orange-700',
          desc: 'View assigned agricultural deliveries and route directions in real time.',
        };
      default:
        return {
          badge: 'Khet-i Portal',
          color: 'from-emerald-600 to-teal-700',
          desc: 'Welcome to Khet-i Smart Agriculture Ecosystem.',
        };
    }
  };

  const roleMeta = getRoleHeader();

  const marketplaceCards = [
    {
      title: 'Crop Marketplace',
      desc: 'Browse fresh produce listed by farmers, view details, and order directly.',
      href: '/marketplace',
      icon: Store,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      btnBg: 'bg-sky-600 hover:bg-sky-700',
    },
    ...(user?.role === 'farmer'
      ? [
          {
            title: 'My Crop Listings',
            desc: 'Add, edit, or remove your crop listings and upload photos.',
            href: '/my-listings',
            icon: Package,
            color: 'bg-orange-50 text-orange-700 border-orange-200',
            btnBg: 'bg-orange-600 hover:bg-orange-700',
          },
        ]
      : []),
    ...(user?.role === 'buyer'
      ? [
          {
            title: 'My Cart',
            desc: 'Review items in your cart, adjust quantities, and proceed to checkout.',
            href: '/cart',
            icon: ShoppingBag,
            color: 'bg-teal-50 text-teal-700 border-teal-200',
            btnBg: 'bg-teal-600 hover:bg-teal-700',
          },
          {
            title: 'Order History & Invoices',
            desc: 'View your past orders, track status, and download printable invoices.',
            href: '/orders',
            icon: Receipt,
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            btnBg: 'bg-indigo-600 hover:bg-indigo-700',
          },
        ]
      : []),
  ];

  const actionCards = [
    {
      title: 'AI Crop Disease Diagnosis',
      desc: 'Upload a leaf photo for instant AI diagnosis and disease treatment recommendations.',
      href: '/ai/diagnosis',
      icon: Sprout,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      title: 'Expert Consultation Network',
      desc: 'Browse certified agriculture specialists, check available slots, and book video consultations.',
      href: '/experts',
      icon: Stethoscope,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Diagnosis History & Scans',
      desc: 'Access saved AI diagnosis logs and past scan reports stored in your account.',
      href: '/ai/history',
      icon: History,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Become a Verified Expert',
      desc: 'Register as an agriculture expert — set your fees, upload certifications, and set your weekly availability for consultations.',
      href: '/experts/register',
      icon: BadgeCheck,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      btnBg: 'bg-rose-600 hover:bg-rose-700',
    },
    {
      title: 'My Profile & Account Settings',
      desc: 'Update your personal details, phone number, farm/business address, and password.',
      href: '/profile',
      icon: User,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      btnBg: 'bg-amber-600 hover:bg-amber-700',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r ${roleMeta.color} text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden`}>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" /> {roleMeta.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed">{roleMeta.desc}</p>
        </div>
      </div>

      {/* Marketplace Cards */}
      {marketplaceCards.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">Buy & Sell Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketplaceCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.href}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${card.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-slate-600 text-sm mb-6">{card.desc}</p>
                  </div>

                  <Link
                    to={card.href}
                    className={`inline-flex items-center justify-center gap-2 text-white font-semibold py-3 px-5 rounded-xl transition text-sm shadow-sm ${card.btnBg}`}
                  >
                    <span>Open Feature</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">Core Ecosystem Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.href}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-sm mb-6">{card.desc}</p>
                </div>

                <Link
                  to={card.href}
                  className={`inline-flex items-center justify-center gap-2 text-white font-semibold py-3 px-5 rounded-xl transition text-sm shadow-sm ${card.btnBg}`}
                >
                  <span>Open Feature</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
