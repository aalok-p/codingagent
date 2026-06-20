import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RolePicker from './pages/RolePicker';
import SellerProducts from './pages/seller/Products';
import BuyerProducts from './pages/buyer/Products';
import BuyerOrders from './pages/buyer/Orders';
import { ToastProvider } from './components/ToastProvider';
import { CartProvider } from './context/CartProvider';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/role-picker" element={<RolePicker />} />
          <Route
            path="/seller/products"
            element={
              <ProtectedRoute requiredRole="seller">
                <SellerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/products"
            element={
              <ProtectedRoute requiredRole="buyer">
                <CartProvider>
                  <BuyerProducts />
                </CartProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <ProtectedRoute requiredRole="buyer">
                <BuyerOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
