import React, { useState } from 'react';
import { ActivePage } from '../types';
import { Search, LogIn, Menu, X, Check } from 'lucide-react';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onSearch: (term: string) => void;
}

export default function Header({ activePage, setActivePage, onSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const menuItems = [
    { label: 'HOME', page: 'home' as ActivePage },
    { label: 'PLANS & PRICING', page: 'plans-pricing' as ActivePage },
    { label: 'FITNESS TOOLS', page: 'fitness-tools' as ActivePage },
    { label: 'CONTACT US', page: 'contact-us' as ActivePage },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-natural-oat/90 backdrop-blur-md border-b border-brand-light-green shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('home')}>
            <img 
              src="https://static.wixstatic.com/media/176a3f_90b60bdbc10c452bbb9ed88748c65af6~mv2.png/v1/crop/x_329,y_64,w_1417,h_961/fill/w_85,h_62,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/176a3f_90b60bdbc10c452bbb9ed88748c65af6~mv2.png" 
              alt="Fitkode Logo" 
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-wider text-brand-green leading-none">FITKODE</span>
              <span className="text-[10px] tracking-widest text-brand-dark-green font-semibold">FITNESS SIMPLIFIED</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setActivePage(item.page);
                  setSearchTerm('');
                  onSearch('');
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

          {/* Search Table & Login */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools & plans..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-48 lg:w-60 pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:border-brand-green transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-sm shadow">
                  CJ
                </div>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-green text-xs font-bold text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {searchTerm !== '' && (
              <button onClick={() => { setSearchTerm(''); onSearch(''); }} className="text-xs text-brand-green font-medium underline">
                Clear search
              </button>
            )}
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
          <div className="relative my-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-light-green rounded-lg text-sm focus:outline-none focus:border-brand-green"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setActivePage(item.page);
                  setMobileMenuOpen(false);
                  setSearchTerm('');
                  onSearch('');
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

          <div className="pt-4 border-t border-brand-light-green flex justify-between items-center">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-sm shadow">
                  CJ
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Chinmay Jain</p>
                  <button 
                    onClick={() => setIsLoggedIn(false)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLoginModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-green text-sm font-bold text-white shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Account Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-natural-oat border border-brand-light-green rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-brand-dark-green mb-2">Welcome to Fitkode</h3>
            <p className="text-xs text-gray-500 mb-4">Access your customized nutrition plans and daily workouts.</p>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-sm focus:outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="text-right">
                <a href="#reset" className="text-[11px] text-brand-green hover:underline font-medium">Forgot password?</a>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-lg bg-brand-green text-white text-xs font-bold shadow-md hover:bg-brand-dark-green transition-all"
              >
                Log In to My Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
