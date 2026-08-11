import React, { useState } from 'react';
import { ActivePage } from '../types';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onSearch?: (term: string) => void;
}

export default function Header({ activePage, setActivePage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'HOME', page: 'home' as ActivePage },
    { label: 'PLANS & PRICING', page: 'plans-pricing' as ActivePage },
    { label: 'FITNESS TOOLS', page: 'fitness-tools' as ActivePage },
    { label: 'CONTACT US', page: 'contact-us' as ActivePage },
  ];

  return (
    <header className="sticky top-0 z-40 bg-natural-oat/90 backdrop-blur-md border-b border-brand-light-green shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer py-1 group" onClick={() => setActivePage('home')}>
            <img 
              src="https://static.wixstatic.com/media/176a3f_90b60bdbc10c452bbb9ed88748c65af6~mv2.png/v1/crop/x_329,y_64,w_1417,h_961/fill/w_300,h_200,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/176a3f_90b60bdbc10c452bbb9ed88748c65af6~mv2.png" 
              alt="Fitkode Logo" 
              className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setActivePage(item.page);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activePage === item.page 
                    ? 'text-brand-green bg-brand-light-green/40' 
                    : 'text-gray-600 hover:text-brand-green hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-brand-green hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-natural-oat border-b border-brand-light-green px-4 pt-2 pb-4 space-y-2 shadow-inner">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setActivePage(item.page);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  activePage === item.page 
                    ? 'text-brand-green bg-brand-light-green/60' 
                    : 'text-gray-600 hover:text-brand-green hover:bg-white/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
