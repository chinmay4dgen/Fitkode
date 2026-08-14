import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import PlansPricing from './components/PlansPricing';
import FitnessTools from './components/FitnessTools';
import ContactForm from './components/ContactForm';
import AboutPage from './components/AboutPage';
import ResultsPage from './components/ResultsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import Footer from './components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-natural-oat flex flex-col justify-between selection:bg-brand-light-green selection:text-brand-dark-green">
      <ScrollToTop />
      <Header />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home onPlanClick={() => navigate('/coaching-plans')} />} />
          <Route path="/coaching-plans" element={<PlansPricing searchTerm="" />} />
          <Route path="/tools" element={<FitnessTools />} />
          <Route path="/tools/bmi-calculator" element={<FitnessTools focusedTool="bmi" />} />
          <Route path="/tools/tdee-calculator" element={<FitnessTools focusedTool="tdee" />} />
          <Route path="/tools/macro-calculator" element={<FitnessTools focusedTool="macro" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="*" element={<Home onPlanClick={() => navigate('/coaching-plans')} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
