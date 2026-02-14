// File: Client/src/App.tsx
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

// Pages
import Index from "./pages/Index";
import LoginPage from "./pages/Login_Page";
import SignupPage from "./pages/Signup_Page"; 
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Gigs from "./pages/Gigs";
import GigDetail from "./pages/GigDetail";
import BuyerProfile from "./pages/Buyer/BuyerProfile";
import Settings from "./pages/Settings";

// Dashboard & Marketplace Pages
import BuyerDashboard from "./pages/Buyer/BuyerDashboard";
import SellerDashboard from "./pages/Seller/SellerDashboard";
import SellerProfile from "./pages/Seller/SellerProfile";
import CreateGig from "./pages/Seller/CreateGig";
import BookingPage from "./pages/Buyer/BookingPage";
import CategoryPage from "./pages/CategoryPage";
import ManageBookings from "./pages/Seller/ManageBookings";
import ChatPage from "./pages/ChatPage";
import VerificationStatus from "./pages/VerificationStatus";
import ReviewBooking from "./pages/ReviewBooking";
import SellerMessagesPage from "./pages/Seller/SellerMessagesPage"; 

// Supabase Auth & Layout
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/layout/BottomNav";

const queryClient = new QueryClient();

// ────────────────────────────────────────────────
// Protected Layout (with mobile bottom nav)
// ────────────────────────────────────────────────
const ProtectedLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col">
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

// ────────────────────────────────────────────────
// General Protected Route (any logged-in user)
// ────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// ────────────────────────────────────────────────
// Seller-only Protected Route
// ────────────────────────────────────────────────
const SellerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== "seller") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ────────────────────────────────────────────────
// Dashboard Switcher (renders correct dashboard based on role)
// ────────────────────────────────────────────────
const DashboardSwitcher = () => {
  const { userRole } = useAuth();
  return userRole === "seller" ? <SellerDashboard /> : <BuyerDashboard />;
};

const App = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        Loading...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes (any logged-in user) */}
            <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
              {/* Dashboard – switches based on role */}
              <Route path="/dashboard" element={<DashboardSwitcher />} />

              {/* Shared / buyer-leaning pages */}
              <Route path="/gigs" element={<Gigs />} />
              <Route path="/gig/:id" element={<GigDetail />} />
              <Route path="/profile/:username" element={<BuyerProfile />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/bookings" element={<ManageBookings />} />
              <Route path="/chat/:chatId" element={<ChatPage />} />
              <Route path="/verification/:id" element={<VerificationStatus />} />
              <Route path="/review-booking/:id" element={<ReviewBooking />} />
              <Route path="/booking/:id" element={<BookingPage />} />

              {/* Settings (any user) */}
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Seller-only protected routes */}
            <Route element={<SellerProtectedRoute><ProtectedLayout /></SellerProtectedRoute>}>
              <Route path="/create-gig" element={<CreateGig />} />
              <Route path="/messages/seller" element={<SellerMessagesPage />} />
              <Route path="/seller-profile/*" element={<SellerProfile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;