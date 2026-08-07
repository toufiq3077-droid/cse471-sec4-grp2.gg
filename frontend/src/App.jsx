import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CropForm from "./pages/CropForm";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderInvoice from "./pages/OrderInvoice";
import Orders from "./pages/Orders";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderInvoice />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="buyer">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute role="farmer">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crops/new"
            element={
              <ProtectedRoute role="farmer">
                <CropForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crops/:id/edit"
            element={
              <ProtectedRoute role="farmer">
                <CropForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
