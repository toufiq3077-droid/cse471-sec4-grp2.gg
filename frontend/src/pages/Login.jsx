import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("buyer");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== role) {
        setError(
          `This email is registered as a ${user.role}. Switch the tab above and try again.`
        );
        return;
      }
      navigate(user.role === "farmer" ? "/my-listings" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card p-8">
        <div className="flex rounded-lg border border-leaf-200 p-1 mb-6">
          {["buyer", "farmer"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 text-sm font-medium py-2 rounded-md capitalize transition-colors ${
                role === r ? "bg-leaf-600 text-white" : "text-leaf-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <h1 className="font-display text-2xl font-semibold text-leaf-900 mb-1">
          {role === "farmer" ? "Farmer Login" : "Buyer Login"}
        </h1>
        <p className="text-sm text-leaf-500 mb-6">
          {role === "farmer"
            ? "Manage your crop listings on Khet-i."
            : "Log in to check out faster and view your order history."}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-leaf-500 mt-5 text-center">
          New here?{" "}
          <Link to="/register" className="text-leaf-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
