import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails'; 
import Orders from './pages/Orders';
import Address from './pages/Address';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import Login from './pages/Login';

// --- Protected Route Wrapper ---
// Checks the Redux store to see if a valid token exists.
// If not, it redirects the user immediately to the Login page.
const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Renders the child routes if authenticated
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Route - Sits outside the MainLayout so it has no Navbar */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Only accessible if logged in */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="orders" element={<Orders />} />
            <Route path="address" element={<Address />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders/:id" element={<OrderDetails />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;