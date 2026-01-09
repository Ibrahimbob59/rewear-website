import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { withProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import ItemDetails from "@/pages/ItemDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import Profile from "@/pages/Profile";
import Sell from "@/pages/Sell";
import MyListings from "@/pages/MyListings";
import Favorites from "@/pages/Favorites";
import ApplyDriver from "@/pages/ApplyDriver";
import NotFound from "@/pages/not-found";

const ProtectedCheckout = withProtectedRoute(Checkout);
const ProtectedOrders = withProtectedRoute(Orders);
const ProtectedOrderDetails = withProtectedRoute(OrderDetails);
const ProtectedProfile = withProtectedRoute(Profile);
const ProtectedSell = withProtectedRoute(Sell);
const ProtectedMyListings = withProtectedRoute(MyListings);
const ProtectedFavorites = withProtectedRoute(Favorites);
const ProtectedApplyDriver = withProtectedRoute(ApplyDriver);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/items/:id" component={ItemDetails} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={ProtectedCheckout} />
      <Route path="/orders" component={ProtectedOrders} />
      <Route path="/orders/:id" component={ProtectedOrderDetails} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/sell" component={ProtectedSell} />
      <Route path="/my-listings" component={ProtectedMyListings} />
      <Route path="/favorites" component={ProtectedFavorites} />
      <Route path="/apply-driver" component={ProtectedApplyDriver} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <FavoritesProvider isAuthenticated={isAuthenticated}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </FavoritesProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
