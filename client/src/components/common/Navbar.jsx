import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sprout, User, LogOut, LogIn, UserPlus, Menu, X, ShieldAlert, Stethoscope, Truck, ShoppingBag, LayoutDashboard, Store, ShoppingCart, CloudSun, Wallet } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'farmer':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Sprout className="w-3 h-3"/> Farmer</span>;
      case 'buyer':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Buyer</span>;
      case 'expert':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Stethoscope className="w-3 h-3"/> Expert</span>;
      case 'rider':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Truck className="w-3 h-3"/> Rider</span>;
      case 'admin':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Admin</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">{role}</span>;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-emerald-700 font-extrabold text-2xl tracking-tight hover:opacity-90 transition">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md shadow-emerald-200">
                <Sprout className="w-6 h-6" />
              </div>
              <span>Khet<span className="text-amber-500">-i</span></span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <Link
                to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                className={`text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/admin') || isActive('/dashboard')
                    ? 'text-emerald-600 font-semibold'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}</span>
              </Link>
            )}

            {user?.role !== 'admin' && (
              <>
                <Link
                  to="/ai/diagnosis"
                  className={`text-sm font-medium transition ${
                    isActive('/ai/diagnosis') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  AI Diagnosis
                </Link>
                <Link
                  to="/ai/history"
                  className={`text-sm font-medium transition ${
                    isActive('/ai/history') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  Diagnosis History
                </Link>
                <Link
                  to="/marketplace"
                  className={`text-sm font-medium transition flex items-center gap-1.5 ${
                    location.pathname.startsWith('/marketplace') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Marketplace
                </Link>
                {user?.role === 'farmer' && (
                  <Link
                    to="/my-listings"
                    className={`text-sm font-medium transition ${
                      isActive('/my-listings') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                    }`}
                  >
                    My Listings
                  </Link>
                )}
                {user?.role === 'rider' && (
                  <Link
                    to="/rider"
                    className={`text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive('/rider') ? 'text-amber-600 font-semibold' : 'text-gray-600 hover:text-amber-600'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    My Deliveries
                  </Link>
                )}
                {user?.role === 'rider' && (
                  <Link
                    to="/rider/earnings"
                    className={`text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive('/rider/earnings') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    My Earnings
                  </Link>
                )}
                <Link
                  to="/experts"
                  className={`text-sm font-medium transition ${
                    isActive('/experts') ? 'text-emerald-600 font-semibold' : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  Experts Directory
                </Link>
                <Link
                  to="/weather"
                  className={`text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive('/weather') ? 'text-sky-600 font-semibold' : 'text-gray-600 hover:text-sky-600'
                  }`}
                >
                  <CloudSun className="w-4 h-4" />
                  Weather
                </Link>
              </>
            )}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === 'buyer' && (
                  <Link
                    to="/cart"
                    className="relative flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition text-sm font-medium text-emerald-900"
                    title="Cart"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-700" />
                    <span>Cart</span>
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition text-sm font-medium text-emerald-900"
                >
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>{user?.name}</span>
                  {getRoleBadge(user?.role)}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-50 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-200 transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-emerald-600 p-2 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-3">
          {isAuthenticated && (
            <Link
              to={user?.role === 'admin' ? '/admin' : '/dashboard'}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
            >
              {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
            </Link>
          )}

          {user?.role !== 'admin' && (
            <>
              <Link
                to="/ai/diagnosis"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
              >
                AI Diagnosis
              </Link>
              <Link
                to="/ai/history"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
              >
                Diagnosis History
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
              >
                Marketplace
              </Link>
              {user?.role === 'farmer' && (
                <Link
                  to="/my-listings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  My Listings
                </Link>
              )}
              {user?.role === 'rider' && (
                <Link
                  to="/rider"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Truck className="w-4 h-4 text-amber-600" />
                  My Deliveries
                </Link>
              )}
              {user?.role === 'rider' && (
                <Link
                  to="/rider/earnings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  My Earnings
                </Link>
              )}
              {user?.role === 'buyer' && (
                <Link
                  to="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  <span>Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-rose-600 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                to="/experts"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
              >
                Experts Directory
              </Link>
              <Link
                to="/weather"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-sky-600 hover:bg-sky-50"
              >
                <CloudSun className="w-4 h-4" />
                Weather Dashboard
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 font-medium"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    {user?.name}
                  </span>
                  {getRoleBadge(user?.role)}
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-xl text-emerald-700 font-medium bg-emerald-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center px-4 py-2 rounded-xl text-white font-semibold bg-emerald-600 shadow-md shadow-emerald-100"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
