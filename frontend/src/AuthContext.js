import React, { createContext, useState } from "react";
import api from "./api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {   // ← plus de "default" ici
  const [user, setUser] = useState(null);

async function login(username, password) {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  const { data } = await api.post("/api/auth/login/", { username, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  const me = await api.get("/api/auth/me/");
  setUser(me.data);
}


async function register({ username, email, password }) {
  await api.post("/api/auth/register/", { username, email, password });
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  await login(username, password);
}



  async function logout() {
    const refresh = localStorage.getItem("refresh");
    try {
      await api.post("/api/auth/logout/", { refresh });
    } catch (_) {}
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
