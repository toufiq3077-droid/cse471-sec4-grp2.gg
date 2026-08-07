import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const TOKEN_KEY = "kb_token";
const USER_KEY = "kb_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const persist = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
  };

  // role: "farmer" | "buyer"
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.data);
    return data.data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persist(data.data);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farmer: user, // back-compat alias for any old references
        loading,
        login,
        register,
        logout,
        isFarmer: user?.role === "farmer",
        isBuyer: user?.role === "buyer",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
