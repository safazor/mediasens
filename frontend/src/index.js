import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MediaDetail from "./pages/MediaDetail"
import UploadPage from "./pages/UploadPage"
import "./index.css";
import { AuthProvider } from "./AuthContext"; // ✅ import correct

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* ✅ ICI on enveloppe TOUT dans AuthProvider */}
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/media/:id" element={<MediaDetail />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
