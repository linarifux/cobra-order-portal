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
import Divisions from './pages/Divisions';

// --- Auth Protected Route Wrapper ---
// Validates global session state to authorize portal boundary access.
const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; 
};

// --- Workspace Division Guard ---
// Enforces that a localized layout configuration target must exist 
// before letting users enter the functional application environment.
const WorkspaceRoute = () => {
  const activeDivision = localStorage.getItem('dsm_active_division');

  if (!activeDivision) {
    return <Navigate to="/divisions" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Authentication Portal */}
        <Route path="/login" element={<Login />} />

        {/* Secure Session Boundary */}
        <Route element={<ProtectedRoute />}>
          
          {/* Workspace Matrix (Standalone page, clear of broken navigation panels) */}
          <Route path="/divisions" element={<Divisions />} />

          {/* Division Scoped Operational Boundary */}
          <Route element={<WorkspaceRoute />}>
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

        </Route>

        {/* Global Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;