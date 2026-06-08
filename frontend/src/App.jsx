import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails'; // <-- Import new page
import Orders from './pages/Orders';
import Address from './pages/Address';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="orders" element={<Orders />} />
          <Route path="address" element={<Address />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;