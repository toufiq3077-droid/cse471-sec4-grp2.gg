import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout, isFarmer, isBuyer } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-leaf-100 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold text-leaf-800">
          Khet-i <span className="text-clay">🌾</span>
        </Link>

        <nav className="flex items-center gap-3">
          {!isFarmer && (
            <Link to="/cart" className="text-sm font-medium text-leaf-700 hover:text-leaf-900">
              Cart ({itemCount})
            </Link>
          )}

          {isFarmer && (
            <>
              <Link to="/my-listings" className="text-sm font-medium text-leaf-700 hover:text-leaf-900">
                My Listings
              </Link>
              <Link to="/crops/new" className="btn-primary">
                + Add Crop
              </Link>
            </>
          )}

          {isBuyer && (
            <Link to="/orders" className="text-sm font-medium text-leaf-700 hover:text-leaf-900">
              My Orders
            </Link>
          )}

          {user ? (
            <>
              <span className="text-sm text-leaf-500 hidden sm:inline capitalize">
                Hi, {user.name.split(" ")[0]} ({user.role})
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
