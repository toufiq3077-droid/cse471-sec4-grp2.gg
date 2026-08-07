import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("buyer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    farmName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === "farmer" ? "/my-listings" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
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
          {role === "farmer" ? "Register as Farmer" : "Register as Buyer"}
        </h1>
        <p className="text-sm text-leaf-500 mb-6">
          {role === "farmer"
            ? "Start listing your crops on the marketplace."
            : "Create an account to check out faster and track your orders."}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input required className="input-field" value={form.name} onChange={update("name")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={update("email")} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input required className="input-field" value={form.phone} onChange={update("phone")} />
          </div>
          {role === "farmer" && (
            <div>
              <label className="label">Farm Name (optional)</label>
              <input className="input-field" value={form.farmName} onChange={update("farmName")} />
            </div>
          )}
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={form.password}
              onChange={update("password")}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-leaf-500 mt-5 text-center">
          Already registered?{" "}
          <Link to="/login" className="text-leaf-700 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
