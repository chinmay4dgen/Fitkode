import React, { useState } from 'react';
import { ActivePage } from './types';
import Header from './components/Header';
import Home from './components/Home';
import PlansPricing from './components/PlansPricing';
import FitnessTools from './components/FitnessTools';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Dumbbell, Sparkles } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [searchTerm, setSearchTerm] = useState('');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Home onPlanClick={() => setActivePage('plans-pricing')} />
          </motion.div>
        );
      case 'plans-pricing':
        return (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <PlansPricing searchTerm={searchTerm} />
          </motion.div>
        );
      case 'fitness-tools':
        return (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <FitnessTools />
          </motion.div>
        );
      case 'contact-us':
        return (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <ContactForm />
          </motion.div>
        );
      default:
        return <Home onPlanClick={() => setActivePage('plans-pricing')} />;
    }
  };

  return (
    <div className="min-h-screen bg-natural-oat flex flex-col justify-between selection:bg-brand-light-green selection:text-brand-dark-green">
      
      {/* Top Banner Notice */}
      <div className="bg-brand-dark-green text-natural-oat text-[11px] font-bold py-2.5 px-4 text-center tracking-wider flex items-center justify-center gap-1.5 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-200" />
        <span>LIMITED TIME OFFER: Get 100% satisfying results with free starter kits on all custom annual programs!</span>
      </div>

      <Header 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onSearch={setSearchTerm} 
      />

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
