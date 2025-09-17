
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LovableEditControl } from "@/components/auth/LovableEditControl";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import Approvals from "./pages/Approvals";
import Admin from "./pages/Admin";
import BatchSubmission from "./pages/BatchSubmission";
import Reports from "./pages/Reports";
import JobCards from "./pages/JobCards";
import StockMovements from "./pages/StockMovements";
import Tools from "./pages/Tools";
import RotableLLP from "./pages/RotableLLP";
import DevSyncPage from "./pages/DevSyncPage";
import CustomersSuppliers from "./pages/CustomersSuppliers";

const queryClient = new QueryClient();

const App = () => {
  // Default to dark mode for Station-2100 aesthetic
  document.documentElement.classList.add('dark');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <LovableEditControl />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/customers" 
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/suppliers" 
                  element={
                    <ProtectedRoute>
                      <Suppliers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/batch-submission" 
                  element={
                    <ProtectedRoute>
                      <BatchSubmission />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/approvals" 
                  element={
                    <ProtectedRoute>
                      <Approvals />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/job-cards" 
                  element={
                    <ProtectedRoute>
                      <JobCards />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/stock-movements" 
                  element={
                    <ProtectedRoute>
                      <StockMovements />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tools" 
                  element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rotable-llp" 
                  element={
                    <ProtectedRoute>
                      <RotableLLP />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/auth" element={<Auth />} />
                <Route 
                  path="/dev-sync" 
                  element={
                    <ProtectedRoute>
                      <DevSyncPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/customers-suppliers" 
                  element={
                    <ProtectedRoute>
                      <CustomersSuppliers />
                    </ProtectedRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
