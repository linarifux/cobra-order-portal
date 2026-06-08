import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    // min-h-screen and flex-col are the engine keeping the footer at the bottom
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* flex-1 forces the main content to stretch, pushing the footer down */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}