import { Box } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Copyright */}
          <div className="flex items-center gap-2 text-gray-500">
            <Box className="h-5 w-5" />
            <span className="text-sm font-medium">
              © {currentYear} MI-KRO. All rights reserved
            </span>
          </div>

          {/* Utility Links */}
          <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Help & Support</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>

        </div>
      </div>
    </footer>
  );
}