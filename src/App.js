import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

// Import all components
import HomePage from "./Component/HomePage";
import MovieDetailPage from "./Component/MovieDetailPage";
import SeatSelectionPage from "./Component/SeatSelectionPage";
import PaymentPage from "./Component/PaymentPage";
import TicketPage from "./Component/TicketPage";
import LoginPage from "./Component/LoginPage";
import AdminLogin from "./Component/AdminLogin";
import AdminPage from "./Component/AdminPage";

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin token exists in localStorage
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAdminAuthenticated(true);
    }
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/seats" element={<SeatSelectionPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/ticket" element={<TicketPage />} />
        <Route path="/movies" element={<HomePage />} />
        <Route path="/coming-soon" element={<HomePage />} />
        <Route path="/theaters" element={<HomePage />} />
        <Route path="/offers" element={<HomePage />} />

        {/* Admin routes */}
        <Route
          path="/AdminLogin"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/AdminPage" replace />
            ) : (
              <AdminLogin setIsAdminAuthenticated={setIsAdminAuthenticated} />
            )
          }
        />
        <Route
          path="/AdminPage"
          element={
            isAdminAuthenticated ? (
              <AdminPage setIsAdminAuthenticated={setIsAdminAuthenticated} />
            ) : (
              <Navigate to="/AdminLogin" replace />
            )
          }
        />

        {/* 404 route - redirect to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
