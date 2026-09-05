import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import fitkodeLogo from '../assets/images/regenerated_image_1786680575798.webp';
import AuthButton from './AuthButton';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: 'HOME', path: '/' },
    { label: 'PLANS & PRICING', path: '/coaching-plans' },
    { label: 'FITNESS TOOLS', path: '/tools' },
    { label: 'RESULTS', path: '/results' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT US', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-natural-oat border-b border-brand-light-green shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link to="/" className="flex-shrink-0 flex items-center py-1 group" aria-label="Fitkode Home">
            <img 
              src="https://res.cloudinary.com/akmvlt3d/image/upload/v1786877440/My%20Brand/Fitkode_Logo_300_x_150_px_bmxnpa.png" 
              alt="Fitkode" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = fitkodeLogo;
                }
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <nav className="flex items-center space-x-1 lg:space-x-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'text-brand-green bg-brand-light-green/40 font-bold' 
                        : 'text-gray-600 hover:text-brand-green hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pl-2 border-l border-gray-200">
              <AuthButton />
            </div>
          </div>

          {/* Mobile Right Controls: Auth Button + Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <AuthButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-brand-green hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-natural-oat border-b border-brand-light-green px-4 pt-2 pb-4 space-y-3 shadow-inner">
          {/* Mobile Auth Status Card */}
          <div className="pt-1">
            <AuthButton mobile onActionComplete={() => setMobileMenuOpen(false)} />
          </div>

          <div className="space-y-1 border-t border-brand-light-green/60 pt-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    isActive 
                      ? 'text-brand-green bg-brand-light-green/60 font-bold' 
                      : 'text-gray-600 hover:text-brand-green hover:bg-white/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
