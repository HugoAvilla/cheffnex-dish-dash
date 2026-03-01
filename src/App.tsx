import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast } from "@/components/ErrorToast";
import { UpdateBanner } from "@/components/UpdateBanner";
import { captureError } from "@/lib/errorHandler";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminCategories from "./pages/AdminCategories";
import AdminMenuPreview from "./pages/AdminMenuPreview";
import AdminRestaurant from "./pages/AdminRestaurant";
import AdminStorefront from "./pages/AdminStorefront";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        captureError(error, "executar operação");
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <UpdateBanner />
              <ErrorToast />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/admin/login" replace />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/menu/:restaurantId" element={<Menu />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/admin/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                  <Route path="/admin/menu-preview" element={<ProtectedRoute><AdminMenuPreview /></ProtectedRoute>} />
                  <Route path="/admin/restaurant" element={<ProtectedRoute><AdminRestaurant /></ProtectedRoute>} />
                  <Route path="/admin/storefront" element={<ProtectedRoute><AdminStorefront /></ProtectedRoute>} />
                  <Route path="/admin/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                  <Route path="/admin/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
