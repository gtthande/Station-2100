
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Auth from "./pages/Auth";

function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuthGuard();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Station-2100...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-slate-800">
              🛩️ Station-2100 Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {user?.profile?.full_name || user?.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Inventory Management</h3>
            <p className="text-slate-600">Manage products, batches, and stock levels</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Job Cards</h3>
            <p className="text-slate-600">Create and track aviation job cards</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Reports</h3>
            <p className="text-slate-600">Generate inventory and job reports</p>
          </div>
          
          {user?.is_super_admin && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Admin Panel</h3>
              <p className="text-slate-600">System administration and sync tools</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ MySQL Primary Authentication Active</h3>
          <p className="text-green-700">
            Station-2100 is now running with MySQL as the primary database and authentication system.
            Supabase is available as a backup/sync target through the admin panel.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Auth />} />
        <Route
          path="/health"
          element={
            <main className="min-h-screen flex items-center justify-center text-green-700 text-2xl">
              ✅ Frontend OK – Diagnostics Healthy
            </main>
          }
        />
        <Route
          path="*"
          element={
            <main className="min-h-screen flex items-center justify-center text-red-600">
              404 – Route not found
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
