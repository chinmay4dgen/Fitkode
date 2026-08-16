import React, { useState } from 'react';
import Seo from './Seo';
import { Award, GraduationCap, Briefcase, Trophy, Sparkles, CheckCircle, Heart, ArrowRight, ShieldCheck, ExternalLink, Maximize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import chinmayImg from '../assets/images/Chinmay_compresed_webp.webp';
import diplomaImg from '../assets/images/Diploma_Nutrition_Fitness.webp';

export default function AboutPage() {
  const [showFullCertificate, setShowFullCertificate] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <Seo 
        title="Chinmay Jain — INFS Certified Coach | Fitkode"
        description="From 89 kg corporate executive to ICN natural bodybuilding medalist and INFS-certified nutrition consultant. The credentials and story behind Fitkode."
        canonicalPath="/about"
      />

      {/* Hero Header */}
      <section className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-light-green/60 text-brand-dark-green font-mono text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3 w-3 text-brand-green" /> Meet Your Coach
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark-green leading-tight">
            Chinmay Jain
          </h1>
          <p className="text-base font-semibold text-brand-green">
            INFS Certified Nutrition &amp; Fitness Consultant · ICN Natural Athlete Medalist
          </p>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            I spent 14 years in demanding corporate executive leadership, sitting at a desk for 11+ hours, battling chronic fatigue, and navigating corporate stress. With an MBA in Marketing and a Computer Science Engineering degree, analytical metrics are in my DNA. When I transformed my own health from 89 kg to competitive peak physical shape, I founded Fitkode to deliver evidence-based, sustainable fitness for busy professionals.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link 
              to="/coaching-plans" 
              className="px-5 py-3 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white font-bold text-xs shadow transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              View Coaching Programs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              to="/contact" 
              className="px-5 py-3 rounded-xl bg-white border border-brand-light-green hover:bg-brand-light-green/30 text-brand-dark-green font-bold text-xs shadow-sm transition-all"
            >
              Book Personal Intake
            </Link>
          </div>
        </div>

        <div className="md:col-span-5 flex justify-center">
          <div className="relative rounded-3xl overflow-hidden border-2 border-brand-light-green shadow-lg max-w-sm w-full bg-neutral-100">
            <img 
              src="https://res.cloudinary.com/akmvlt3d/image/upload/v1786877327/Chinmay_compresed.png" 
              alt="Chinmay Jain - INFS Certified Nutrition & Fitness Consultant" 
              className="w-full h-auto object-cover"
              width="400"
              height="500"
              fetchPriority="high"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = chinmayImg;
                }
              }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white text-center">
              <p className="font-display font-bold text-sm">Chinmay Jain</p>
              <p className="text-[10px] text-brand-light-green uppercase font-mono">Founder &amp; Lead Consultant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Official Diploma / Certification Section */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 rounded-3xl border-2 border-brand-light-green/80 p-6 sm:p-10 shadow-sm relative overflow-hidden space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-light-green/60 pb-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1C8A43]/10 text-[#1C8A43] font-mono text-[10px] font-extrabold uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1C8A43]" /> Verified Professional Credential
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Diploma in Nutrition &amp; Fitness
            </h2>
            <p className="text-xs text-gray-500">
              Institute of Nutrition and Fitness Sciences (INFS) &amp; SPEFL-SC (Skill India)
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-700 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cert ID: <span className="text-[#1C8A43]">INFS495893787</span>
            </span>
            <a 
              href="https://infs.co.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-light-green hover:bg-brand-light-green/40 text-brand-dark-green text-xs font-bold transition-all shadow-xs"
            >
              Verify on INFS <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Certificate Display Showcase Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 shadow-sm flex flex-col items-center space-y-6">
          <div className="relative group max-w-3xl w-full rounded-2xl overflow-hidden border-2 border-brand-light-green/90 shadow-md bg-white">
            <img 
              src="https://res.cloudinary.com/akmvlt3d/image/upload/v1786878789/Diploma_in_Nutrition_Fitness.webp" 
              alt="Chinmay Jain - Diploma in Nutrition and Fitness Course (INFS / SPEFL-SC Skill India)" 
              className="w-full h-auto object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
              onClick={() => setShowFullCertificate(true)}
              width="1200"
              height="850"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = diplomaImg;
                }
              }}
            />
            <button
              onClick={() => setShowFullCertificate(true)}
              className="absolute bottom-4 right-4 px-3.5 py-2 bg-black/75 hover:bg-black text-white text-xs font-bold rounded-xl backdrop-blur-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              aria-label="View Full Certificate"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
            </button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-[11px] font-mono text-gray-500">
            <span>✨ 40 Academic Credits</span>
            <span>•</span>
            <span>⏳ 1200 CPD Hours</span>
            <span>•</span>
            <span>🏅 13.5 CEU</span>
            <span>•</span>
            <span>🛡️ Valid through 2028</span>
          </div>
        </div>

        {/* Fullscreen Certificate Modal */}
        {showFullCertificate && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
            onClick={() => setShowFullCertificate(false)}
          >
            <div 
              className="relative max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1C8A43]" />
                  <h3 className="font-display font-bold text-sm sm:text-base text-gray-900">
                    Chinmay Jain — Diploma in Nutrition &amp; Fitness (INFS495893787)
                  </h3>
                </div>
                <button 
                  onClick={() => setShowFullCertificate(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-auto rounded-xl">
                <img 
                  src="https://res.cloudinary.com/akmvlt3d/image/upload/v1786878789/Diploma_in_Nutrition_Fitness.webp" 
                  alt="Chinmay Jain - Diploma in Nutrition and Fitness Course" 
                  className="w-full h-auto object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = diplomaImg;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Credentials Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
            Credentials &amp; Clinical Expertise
          </h2>
          <p className="text-xs text-gray-500 max-w-lg mx-auto">
            Science over dogma. Measured progress over restrictive fad diets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-brand-light-green p-6 shadow-sm space-y-3">
            <div className="p-3 bg-brand-light-green/60 rounded-xl text-brand-green w-fit">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-dark-green">INFS Certified</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Diploma certified in clinical nutrition, biomechanics, exercise programming, and fat-loss science.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-light-green p-6 shadow-sm space-y-3">
            <div className="p-3 bg-brand-light-green/60 rounded-xl text-brand-green w-fit">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-dark-green">ICN Athlete Medalist</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Competitive natural bodybuilding medalist proving evidence-based drug-free athletic excellence.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-light-green p-6 shadow-sm space-y-3">
            <div className="p-3 bg-brand-light-green/60 rounded-xl text-brand-green w-fit">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-dark-green">14+ Yrs Corporate</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Deep empathy for travel schedules, boardroom meetings, festive commitments, and busy desk jobs.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-light-green p-6 shadow-sm space-y-3">
            <div className="p-3 bg-brand-light-green/60 rounded-xl text-brand-green w-fit">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-dark-green">MBA + CS Engineer</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Data-driven analytical background ensuring precise caloric tracking, TDEE modeling, and habit design.
            </p>
          </div>
        </div>
      </section>

      {/* The Fitkode Promise */}
      <section className="bg-brand-green text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white text-center">
          The Fitkode Independence Promise
        </h2>
        <div className="max-w-3xl mx-auto space-y-4 text-xs sm:text-sm text-brand-light-green leading-relaxed">
          <p>
            Unlike traditional wellness platforms that keep you permanently dependent on proprietary meal boxes or endless subscription renewals, Fitkode is designed to educate you.
          </p>
          <p>
            Our masterclasses and supervised workout sessions teach you how to quantify calories, understand macronutrients, navigate Indian festive meals and wedding buffets, and program effective workouts anywhere — at home, in a hotel room, or in a gym.
          </p>
          <p className="font-bold text-white text-center text-base pt-2">
            "Our ultimate goal is to give you the science so you never need to hire a coach again."
          </p>
        </div>
      </section>
    </div>
  );
}
