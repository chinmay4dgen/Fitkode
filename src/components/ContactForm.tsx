import React, { useState } from 'react';
import { Send, Phone, Mail, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    goal: '',
    code: 'IN +91',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        goal: '',
        code: 'IN +91',
      });
    }, 5000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Title */}
      <div className="text-center space-y-2 mb-12">
        <h1 className="font-display text-4xl font-extrabold text-[#111] tracking-tight">Contact Fitkode Studio</h1>
        <p className="text-xs text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
          Embark on your holistic body transformation journey. Send over any custom questions or coaching queries today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* Detail Panel */}
        <div className="lg:col-span-2 bg-[#1C8A43] text-white p-8 rounded-3xl flex flex-col justify-between space-y-12 shadow-md relative overflow-hidden">
          
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
            <Send className="w-80 h-80" />
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold">Connect With Coach</h3>
            <p className="text-xs text-brand-light-green leading-relaxed">
              We look forward to helping you simplify your fitness, manage your carbs properly, and reach peak aesthetics naturally.
            </p>
          </div>

          <div className="space-y-6 z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-brand-light-green font-extrabold tracking-widest uppercase">Hotline Contact</p>
                <p className="text-sm font-bold font-mono tracking-wide">+91-9828402190</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-brand-light-green font-extrabold tracking-widest uppercase">Direct Email</p>
                <p className="text-sm font-bold font-mono tracking-wide">myfitkode@gmail.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-brand-light-green font-extrabold tracking-widest uppercase">Fitkode Studio HQ</p>
                <p className="text-xs font-semibold leading-relaxed">A1905, Prateek Wisteria Society, Sec-77, Noida-201301 (INDIA)</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-brand-light-green font-extrabold tracking-widest uppercase">Studio Hours</p>
                <p className="text-xs font-semibold leading-relaxed">Monday – Sunday: 06:00 AM – 10:00 PM</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-brand-light-green/90 leading-tight">
            Fitkode Studio supports global clients with customized bilingual plans and weekly remote checkout reviews.
          </p>
        </div>

        {/* Input Form Panel */}
        <div className="lg:col-span-3 bg-white border border-gray-150 rounded-3xl p-8 shadow-sm">
          {submitted ? (
            <div className="min-h-96 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-14 bg-brand-light-green/45 text-brand-green rounded-full flex items-center justify-center font-bold text-2xl shadow-inner">
                ✓
              </div>
              <div>
                <h3 className="font-display font-extrabold text-gray-950 text-xl">Feedback Received!</h3>
                <p className="text-xs text-gray-500 mt-1">Your query was compiled and dispatched directly to Chinmay Jain.</p>
              </div>
              <p className="text-[11px] text-gray-400 italic">We usually respond within 4 - 6 hours during standard studio hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-display text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Submit Your Fitness Interest</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">First Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Email *</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Code *</label>
                  <select 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green"
                  >
                    <option value="IN +91">IN +91</option>
                    <option value="US +1">US +1</option>
                    <option value="UK +44">UK +44</option>
                    <option value="AE +971">AE +971</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="98284 02190"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">What goal are you chasing?</label>
                <textarea 
                  rows={4}
                  placeholder="Describe your current status, gym experience, or what barriers are holding you back from your desired aesthetics..."
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green transition-colors resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-[#1C8A43] text-white font-bold text-xs shadow hover:bg-brand-dark-green transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                Submit My Consultation Request
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
