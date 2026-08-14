import React, { useState, useRef } from 'react';
import { Award, Zap, Heart, Shield, Dumbbell, Sparkles, Send, Phone, Mail, MapPin, CheckCircle, ChevronDown, ChevronUp, User, GraduationCap, Trophy, Briefcase, Star, Quote, Linkedin, Instagram, Play, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ContactForm from './ContactForm';
import Seo from './Seo';
import chinmayImg from '../../assets/Chinmay_compresed_webp.webp';
import alankarImg from '../../assets/Alankar_Bhatnagar.jpg';
import dhawalImg from '../../assets/Dhawal_Kapil.png';
import karamjitImg from '../../assets/Karamjit _Singh.jpg';
import nitishImg from '../../assets/Nitish_Srivastave.jpeg';
import sanketImg from '../../assets/Sanket_Sarda.jpg';
import shuchiImg from '../../assets/Shuchi.png';
import snehaImg from '../../assets/Sneha_Sharma.png';

interface HomeProps {
  onPlanClick: () => void;
}

export default function Home({ onPlanClick }: HomeProps) {
  // Interactive FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Interactive Transformation Tab State
  const [activeTransformationTab, setActiveTransformationTab] = useState<'profile' | 'athlete' | 'story'>('profile');

  // Hero Section Interactive Tab State
  const [heroTab, setHeroTab] = useState<'coach' | 'transformation'>('coach');

  // Testimonials Active State
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  const pillars = [
    {
      title: 'Home & Travel Workouts',
      desc: 'No gym? No problem. Bespoke resistance programs designed for hotels, living rooms, and busy travel schedules.',
      img: 'https://static.wixstatic.com/media/176a3f_2e87bc0a9aab4ec68992f6ea0c28d2e2~mv2.jpg/v1/fill/w_310,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/kid-his-father-doing-sport-home.jpg',
    },
    {
      title: 'Custom Measured Nutrition',
      desc: 'Precision nutrition tailored to vegetarian lifestyles, traditional fasting periods, and native Indian home cooking.',
      img: 'https://static.wixstatic.com/media/11062b_ec433d2e054d45a99f75bd2073c51817~mv2.jpg/v1/crop/x_1077,y_0,w_2845,h_3333/fill/w_310,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Calorie%20Count.jpg',
    },
    {
      title: 'Elite Gym Programming',
      desc: 'Evidence-based strength, hypertrophy, and posture correction routines utilizing optimum variables and recovery curves.',
      img: 'https://static.wixstatic.com/media/176a3f_4fe54ac6147945238bd243dcc9782915~mv2.png/v1/crop/x_644,y_0,w_1527,h_1797/fill/w_310,h_360,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/lady%20workout.png',
    },
    {
      title: 'Mindfulness & Meditation',
      desc: 'Integrate ancient mental focus methods to lower cortisol, manage high corporate stress, and boost deep recovery.',
      img: 'https://static.wixstatic.com/media/176a3f_19781c109b7144d9adce2b5e7c3d13ad~mv2.png/v1/crop/x_619,y_0,w_1139,h_1335/fill/w_310,h_360,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/meditation.png',
    },
  ];

  const scientificTruths = [
    {
      myth: 'Exotic "Superfoods" & Detox Teas',
      truth: 'Pure Organic Real Food',
      desc: 'You do not need expensive black alkaline water, gluten-free trends, or detox supplements. We achieve elite biochemistry strictly from home-cooked organic meals.',
      icon: '🌿'
    },
    {
      myth: 'Severe Caloric Starvation Diets',
      truth: 'EAT ALL YOU LOVE WITH MACROS',
      desc: 'Forget extreme caloric restriction. We construct intelligent macronutrient frameworks allowing you to eat your favorite foods and healthy carbs every single day.',
      icon: '🍕'
    },
    {
      myth: 'Impractical, Rigid Eating Clocks',
      truth: 'Chronological Eating Flexibility',
      desc: 'No rigid, lifestyle-breaking fasts are mandatory. You eat at times that fit your specific corporate schedule or sleep cycles while maintaining caloric targets.',
      icon: '⏰'
    },
    {
      myth: 'Overwhelming Supplement Protocols',
      truth: 'Supplements are Strictly Optional',
      desc: 'We rely on real micronutrient profiles first. No compulsory, synthetic supplement loads. Safe, evidence-backed supplements are only suggested if clinically indicated.',
      icon: '💊'
    },
    {
      myth: 'Exhaustive 2-Hour Daily Workouts',
      truth: 'Time-Efficient Dynamic Training',
      desc: 'Long gym sessions are counter-productive for high-stress executives. Our custom plans take 40-50 minutes, optimizing intensity, tension, and muscular recruitment.',
      icon: '⚡'
    },
    {
      myth: 'Perpetual Dependency on Coaches',
      truth: 'The Fitkode "Independence" Metric',
      desc: 'We don\'t just give you a PDF. We teach you the exact science of TDEE, exercise variables, and biofeedback so you eventually become entirely self-sufficient.',
      icon: '🎓'
    }
  ];

  const clientSuccesses = [
    {
      id: 'sneha-sharma',
      name: 'Sneha Sharma',
      role: 'Fitkode Graduate',
      quote: 'Gained a better understanding of weight loss through portion control and proper workouts rather than starvation.',
      img: snehaImg,
      rating: 5,
      score: '10 / 10',
      achievements: 'Clothes that didn\'t fit now fit.',
      feedback: 'Suggested continuing with your current approach, providing motivation, and uploading educational videos.',
      focus: 'Portion Control & Fat Loss'
    },
    {
      id: 'shuchi-agarwal',
      name: 'Shuchi Agarwal',
      role: 'Fitkode Graduate',
      quote: 'Feels more confident and appreciates the guidance and support.',
      img: shuchiImg,
      rating: 5,
      score: '10 / 10',
      achievements: 'Satisfied with weight and inch loss as per targets.',
      feedback: 'Would like more diet adaptation for work/travel and options for covering cravings. Suggested easing up on pushing for high step counts when it becomes difficult.',
      focus: 'Weight & Inch Loss'
    },
    {
      id: 'sanket-sarda',
      name: 'Sanket Sarda',
      role: 'Fitkode Graduate',
      quote: 'Praised Coach Chinmay\'s communication skills and ability to quantify diet plans without major changes to preferences.',
      img: sanketImg,
      rating: 5,
      score: '10 / 10',
      achievements: 'Loss in waist inches, increased strength and endurance.',
      feedback: 'Would like more frequent weekly follow-ups, 1-on-1 workout sessions, and a system to track planned vs. actual workouts/diet.',
      focus: 'Body Recomposition & Quantified Diet'
    },
    {
      id: 'karamjit-singh-bedi',
      name: 'Karamjit Singh Bedi',
      role: 'Fitkode Graduate',
      quote: 'Gained strength, improved sleep and diet, and is seeing steady results.',
      img: karamjitImg,
      rating: 5,
      score: '10 / 10',
      achievements: 'Gained strength, improved sleep and diet, and is seeing steady results.',
      feedback: 'Add a start-up guide for beginners (listing products/supplements to purchase) and continue adding non-isolated exercises that engage multiple muscle groups. Would like a detailed explanation or demonstration on regulating breathing patterns during exercises.',
      focus: 'Strength & Sleep Optimization'
    },
    {
      id: 'arnav-jain',
      name: 'Arnav Jain',
      role: 'Fitkode Graduate',
      quote: 'Found the 3-month journey fun and helpful for balancing life and remaining consistent with physical targets.',
      img: null,
      rating: 5,
      score: '10 / 10',
      achievements: 'Learned about fitness, diet, and supplements; achieved consistency in workouts.',
      feedback: 'Continue motivating, teaching fitness knowledge, and keeping people consistent.',
      focus: 'Consistency & Fitness Knowledge'
    },
    {
      id: 'alankar-bhatnagar',
      name: 'Alankar Bhatnagar',
      role: 'Fitkode Graduate',
      quote: '',
      img: alankarImg,
      rating: 5,
      score: '10 / 10',
      achievements: '',
      feedback: '',
      focus: 'Verified Fitkode Student'
    },
    {
      id: 'dhawal-kapil',
      name: 'Dhawal Kapil',
      role: 'Fitkode Graduate',
      quote: '',
      img: dhawalImg,
      rating: 5,
      score: '10 / 10',
      achievements: '',
      feedback: '',
      focus: 'Verified Fitkode Student'
    },
    {
      id: 'nitish-srivastava',
      name: 'Nitish Srivastava',
      role: 'Fitkode Graduate',
      quote: '',
      img: nitishImg,
      rating: 5,
      score: '10 / 10',
      achievements: '',
      feedback: '',
      focus: 'Verified Fitkode Student'
    }
  ];

  const faqItems = [
    {
      q: 'Is this program suitable for busy corporate professionals with long working hours?',
      a: 'Absolutely. In fact, this is our core specialization. Coach Chinmay spent 14 years in executive corporate leadership (MBA & Computer Science Engineer) before becoming a nutrition consultant. We build the workouts (45 minutes, highly optimized) and nutrition around your board meetings, client dinners, and travel schedules—not the other way around.'
    },
    {
      q: 'What credentials does Coach Chinmay hold to ensure safety?',
      a: 'Coach Chinmay is an INFS (Institute of Nutrition and Fitness Sciences) Certified Fitness & Nutrition Consultant. He is also an active Natural Bodybuilding Athlete and ICN Medalist, meaning all methods are strictly tested on himself, evidence-based, clean, and free from any synthetic enhancements.'
    },
    {
      q: 'Do I have to buy expensive, exotic superfoods or strict meal-prep plans?',
      a: 'Never. Fitkode strictly opposes marketing gimmicks like detox teas, black water, green powders, or costly exotic berries. We build your diet entirely on your regular home-cooked food, whether vegetarian or non-vegetarian, adjusting for local grocery accessibility and traditional fasting days.'
    },
    {
      q: 'How does the "Supervised Workout Sessions" aspect work?',
      a: 'Depending on your package (3M, 6M, or Annual), we schedule personal virtual sessions to review your lifting form, breathing techniques, and posture correction. This prevents injury and ensures you are training with optimal intensity (RPE/RIR) to get results.'
    },
    {
      q: 'What is the "Fitkode Independence Promise"?',
      a: 'Our target is to eventually fire ourselves! Unlike standard apps that keep you dependent on static PDFs, we include comprehensive Masterclasses in our programs. We teach you how to calculate your own TDEE, structure custom macro splits, adjust your diet for festive/fasting days, and design your own routines for life.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://fitkode.com/#org",
    "name": "Fitkode",
    "legalName": "Fitkode",
    "url": "https://fitkode.com",
    "logo": "https://fitkode.com/icon-512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9828402190",
      "contactType": "customer service",
      "email": "myfitkode@gmail.com",
      "areaServed": "IN"
    }
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://fitkode.com/#chinmay",
    "name": "Chinmay Jain",
    "jobTitle": "INFS Certified Fitness & Nutrition Consultant",
    "worksFor": { "@id": "https://fitkode.com/#org" },
    "description": "INFS Certified Nutrition Consultant, ICN Natural Bodybuilding Medalist, former corporate executive with 14+ years experience.",
    "telephone": "+91-9828402190",
    "email": "myfitkode@gmail.com"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden">
      <Seo 
        title="Fitkode — Fitness Simplified | Personalized Coaching by Chinmay Jain"
        description="Evidence-based nutrition and workout coaching built by INFS-certified consultant Chinmay Jain. Simplified Indian diets, 45-minute workouts, 10 masterclasses."
        canonicalPath="/"
        schema={[orgSchema, personSchema, faqSchema]}
      />
      
      {/* Premium Hero Section Inspired by Inspiration Design */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-dark-green via-[#1f2d1f] to-brand-green border-b border-brand-light-green/20 min-h-[550px] sm:min-h-[620px] flex items-center text-white">
        {/* Subtle Atmospheric Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(20,30,20,0.95) 0%, rgba(20,30,20,0.8) 50%, rgba(0,0,0,0.4) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')`
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Big Bold Name, Subtitle & CTA */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left z-10">
              
              {/* Stacked Large Display Name */}
              <div className="space-y-1">
                <h1 className="font-sans font-black text-6xl sm:text-7xl lg:text-8xl tracking-wider text-white uppercase leading-[0.92] select-none drop-shadow-sm">
                  CHINMAY<br />JAIN
                </h1>
                <p className="pt-3 sm:pt-4 text-base sm:text-xl md:text-2xl font-bold tracking-[0.2em] sm:tracking-[0.26em] text-brand-light-green uppercase font-mono">
                  FITNESS &amp; LIFESTYLE COACH
                </p>
              </div>

              {/* Red Contact Button & Primary Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a 
                  href="#contact-form"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 sm:px-10 py-3.5 sm:py-4 bg-[#E51212] hover:bg-[#c40e0e] text-white font-bold tracking-widest text-sm uppercase transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 inline-block text-center cursor-pointer rounded-sm"
                >
                  CONTACT ME
                </a>
                <button
                  onClick={onPlanClick}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-white hover:bg-white hover:text-brand-dark-green text-white font-bold tracking-wider text-sm uppercase transition-all inline-block text-center cursor-pointer rounded-sm"
                >
                  EXPLORE PLANS
                </button>
              </div>

              {/* Sub-Badges / Quick Credentials */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium text-brand-light-green">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-brand-light-green/30 shadow-sm text-white">
                  <GraduationCap className="h-3.5 w-3.5 text-brand-light-green" /> INFS Certified Consultant
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-brand-light-green/30 shadow-sm text-white">
                  <Trophy className="h-3.5 w-3.5 text-brand-light-green" /> ICN Natural Athlete Medalist
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-brand-light-green/30 shadow-sm text-white">
                  <Briefcase className="h-3.5 w-3.5 text-brand-light-green" /> 14+ Yrs Corporate Executive Empathy
                </span>
              </div>

            </div>

            {/* Right Column: Coach Chinmay Photo with Interactive Toggle option */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md sm:max-w-lg">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/80 bg-neutral-900/10 backdrop-blur-sm group">
                  <img 
                    src={chinmayImg} 
                    alt="Coach Chinmay Jain - Fitness & Lifestyle Coach" 
                    className="w-full aspect-[4/3] sm:aspect-[5/4] lg:aspect-square object-cover object-top brightness-[1.02] contrast-[1.02] hover:scale-[1.02] transition-all duration-500 rounded-2xl shadow-2xl"
                  />
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50/95 border border-emerald-500/20 shadow-md backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Accepting Clients
                  </div>
                  {/* Bottom Caption */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-left text-white">
                    <p className="font-bold text-xl font-display tracking-wide">Chinmay Jain</p>
                    <p className="text-xs text-amber-200 font-mono tracking-wider uppercase mt-0.5">Founder &amp; Nutrition Consultant</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Premium Trust Ribbon / Authority Badges */}
      <section className="bg-brand-dark-green text-natural-oat py-8 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-6">
            <p className="text-[10px] tracking-widest uppercase text-brand-light-green font-bold">ESTABLISHED BOARD CERTIFICATION & ATHLETIC AUTHORITY</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
            
            <div className="space-y-1 sm:border-r sm:border-white/10">
              <h4 className="font-display font-extrabold text-sm tracking-wide text-brand-light-green">INFS CERTIFIED</h4>
              <p className="text-[9px] uppercase tracking-wider text-white/70">Nutrition & Fitness Specialist</p>
            </div>

            <div className="space-y-1 sm:border-r sm:border-white/10">
              <h4 className="font-display font-extrabold text-sm tracking-wide text-brand-light-green">ICN MEDALIST</h4>
              <p className="text-[9px] uppercase tracking-wider text-white/70">Natural Bodybuilding Competitor</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-display font-extrabold text-sm tracking-wide text-brand-light-green">14+ YRS CORPORATE</h4>
              <p className="text-[9px] uppercase tracking-wider text-white/70">Executive Lifestyle Empathy</p>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials Section - Weblium Studio Style Split Layout */}
      <section className="bg-[#F8F8F6] py-16 sm:py-24 border-y border-neutral-200/80 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Main Weblium Studio Card */}
          <div className="bg-white rounded-[2.5rem] border border-neutral-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            
            {/* Left Half: Large Client Photo (Weblium Style) */}
            <div className="lg:col-span-5 relative bg-neutral-100 flex items-center justify-center overflow-hidden min-h-[350px] sm:min-h-[450px] lg:min-h-[540px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={clientSuccesses[activeTestimonialIndex].id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  src={clientSuccesses[activeTestimonialIndex].img}
                  alt={clientSuccesses[activeTestimonialIndex].name}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
            </div>

            {/* Right Half: Testimonial Details (Weblium Style) */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-left space-y-8 bg-white">
              <div>
                {/* Heading & Underline Line */}
                <div className="mb-8">
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
                    What our Students say
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1.5 tracking-wide">
                    Real people .. real transformations.
                  </p>
                  <div className="w-20 h-1 bg-brand-green mt-3 rounded-full" />
                </div>

                {/* Main Quote Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={clientSuccesses[activeTestimonialIndex].id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {clientSuccesses[activeTestimonialIndex].quote ? (
                      <p className="text-base sm:text-lg lg:text-xl text-neutral-800 leading-relaxed font-normal">
                        "{clientSuccesses[activeTestimonialIndex].quote}"
                      </p>
                    ) : (
                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-emerald-800 font-medium text-sm flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0" />
                        <span>Verified Fitkode Graduate Alumnus</span>
                      </div>
                    )}

                    {/* Complete textual information for each student */}
                    {(clientSuccesses[activeTestimonialIndex].achievements || clientSuccesses[activeTestimonialIndex].feedback) && (
                      <div className="space-y-3 pt-2">
                        {clientSuccesses[activeTestimonialIndex].achievements && (
                          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block mb-1 font-mono">
                              VERIFIED ACHIEVEMENTS
                            </span>
                            <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed">
                              {clientSuccesses[activeTestimonialIndex].achievements}
                            </p>
                          </div>
                        )}

                        {clientSuccesses[activeTestimonialIndex].feedback && (
                          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block mb-1 font-mono">
                              COACH FEEDBACK & REQUESTS
                            </span>
                            <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed">
                              {clientSuccesses[activeTestimonialIndex].feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Client Name & Profession (Weblium Accent Style) */}
              <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    {clientSuccesses[activeTestimonialIndex].name}
                  </h3>
                  <p className="text-sm font-bold text-brand-green mt-1 tracking-wide">
                    {clientSuccesses[activeTestimonialIndex].role}
                  </p>
                  <p className="text-xs font-mono text-neutral-400 mt-1 uppercase tracking-wider">
                    {clientSuccesses[activeTestimonialIndex].focus}
                  </p>
                </div>

                {/* Dot Pagination Controls & Prev/Next */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => setActiveTestimonialIndex((prev) => (prev - 1 + clientSuccesses.length) % clientSuccesses.length)}
                    className="w-10 h-10 rounded-full border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all flex items-center justify-center text-neutral-700 cursor-pointer shadow-sm"
                    aria-label="Previous Testimonial"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {clientSuccesses.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTestimonialIndex(idx)}
                        className={`transition-all rounded-full cursor-pointer ${
                          activeTestimonialIndex === idx
                            ? 'w-7 h-2 bg-brand-green'
                            : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-500'
                        }`}
                        aria-label={`Go to student ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTestimonialIndex((prev) => (prev + 1) % clientSuccesses.length)}
                    className="w-10 h-10 rounded-full border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all flex items-center justify-center text-neutral-700 cursor-pointer shadow-sm"
                    aria-label="Next Testimonial"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Interactive Student Avatar Selector Thumbnails at Bottom */}
          <div className="pt-2 space-y-3">
            <div className="text-center">
              <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                SELECT A GRADUATE TO READ THEIR STORY
              </span>
            </div>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
              {clientSuccesses.map((student, idx) => (
                <button
                  key={student.id}
                  onClick={() => setActiveTestimonialIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
                    activeTestimonialIndex === idx
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-105'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <img
                    src={student.img}
                    alt={student.name}
                    className="w-6 h-6 rounded-full object-cover border border-white/40"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-bold tracking-tight">{student.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* The Pillars of Simplified Fitness */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/45">
            <Heart className="h-3.5 w-3.5" /> THE FITKODE PILLARS
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark-green tracking-tight">
            Fitness Simplified
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A premium independent program must treat health as an integrated equation. We pair precision macronutrients with calculated training parameters and mindfulness to maximize results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((p, idx) => (
            <div 
              key={idx} 
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-light-green hover:shadow-md transition-all duration-350 transform hover:-translate-y-1"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={p.img} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-4 left-4 text-[10px] text-white/95 font-mono font-bold tracking-widest bg-brand-green/80 px-2 py-0.5 rounded">PILLAR 0{idx+1}</span>
              </div>
              <div className="p-6 space-y-2">
                <h3 className="font-display font-extrabold text-brand-dark-green text-lg group-hover:text-brand-green transition-colors leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid: Scientific Reality vs Fitness Pseudoscience */}
      <section className="bg-brand-light-green/15 py-20 border-y border-brand-light-green/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/45">
              <Shield className="h-3.5 w-3.5" /> EVIDENCE-BASED METRICS
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark-green">
              The Scientific Bento Framework
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We separate fitness truths from toxic marketing lies. No gimmick diets, no generic templates. Here is how we build long-term metabolic health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scientificTruths.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl border border-brand-light-green shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light-green/10 rounded-bl-full pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="text-2xl">{item.icon}</div>
                  
                  {/* Pseudoscience Myth Red Crossout */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-red-500 line-through font-bold uppercase tracking-wider block">MYTH: {item.myth}</span>
                    <h3 className="font-display font-extrabold text-brand-dark-green text-lg flex items-center gap-1.5 leading-snug">
                      <CheckCircle className="h-4.5 w-4.5 text-brand-green flex-shrink-0" />
                      {item.truth}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 text-[10px] text-brand-green font-mono font-bold uppercase">
                  ✓ FITKODE PROTOCOL
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-brand-light-green rounded-2xl p-6 text-center max-w-3xl mx-auto shadow-sm">
            <p className="text-xs text-brand-dark-green font-semibold italic font-serif">
              "We follow the KISS principle — Keep It Simple Silly! Fitness is a matter of thermal biology, progressive muscle loading, and stress management. By stripping away overcomplicated protocols, we ensure sustainable consistency."
            </p>
          </div>

        </div>
      </section>

      {/* Trust, Credentials & Coach Transformations section */}
      <section id="founder" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/45">
            <Award className="h-3.5 w-3.5" /> PROVEN CLINICAL RESULTS
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark-green tracking-tight">
            Meet the Coach Who Leads by Example
          </h2>
          <p className="text-sm text-gray-650 max-w-2xl mx-auto leading-relaxed">
            From an overweight corporate executive sitting 10+ hours a day to a certified nutrition consultant and natural bodybuilding medalist. He has walked the path, mastered the biology, and transformed lives globally.
          </p>
        </div>

        {/* Interactive Case Study Tab System */}
        <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl border border-brand-light-green p-6 md:p-10 shadow-sm space-y-8">
          
          {/* Navigation Controls */}
          <div className="flex justify-center border-b border-brand-light-green pb-4 gap-2 md:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTransformationTab('profile')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
                activeTransformationTab === 'profile'
                  ? 'text-brand-green bg-brand-light-green/50 border border-brand-green/20'
                  : 'text-gray-500 hover:text-brand-green hover:bg-gray-50'
              }`}
            >
              Side Profile (Body Recomp)
            </button>
            <button
              onClick={() => setActiveTransformationTab('athlete')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
                activeTransformationTab === 'athlete'
                  ? 'text-brand-green bg-brand-light-green/50 border border-brand-green/20'
                  : 'text-gray-500 hover:text-brand-green hover:bg-gray-50'
              }`}
            >
              Front Profile (Fat-to-Muscle)
            </button>
            <button
              onClick={() => setActiveTransformationTab('story')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
                activeTransformationTab === 'story'
                  ? 'text-brand-green bg-brand-light-green/50 border border-brand-green/20'
                  : 'text-gray-500 hover:text-brand-green hover:bg-gray-50'
              }`}
            >
              ICN Medals & Athletic Journey
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTransformationTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden border border-brand-light-green shadow-lg">
                    <img 
                      src="https://static.wixstatic.com/media/176a3f_7fa55bd22ae94a50b944aa20a7a81927~mv2.jpg/v1/fill/w_1000,h_1200,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/left%20side.jpg" 
                      alt="Coach Before / After Left Profile" 
                      className="w-full h-[440px] object-cover object-center brightness-[1.03] contrast-[1.02] hover:scale-[1.02] transition-all duration-300 rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-brand-dark-green/95 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/10 font-bold uppercase">
                      Coach Chinmay Jain: Body Recomposition
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-5 text-left">
                  <span className="text-[10px] bg-brand-light-green text-brand-green font-bold font-mono px-2.5 py-1 rounded">TRANSFORMATION FILE #01</span>
                  <h3 className="font-display text-2xl font-extrabold text-brand-dark-green leading-snug">The Power of Measured Thermodynamics</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This transformation represents the exact clinical science taught inside Fitkode. By balancing glycogen depots and strictly adjusting for specific macronutrient targets, we optimized fat mobilization while maximizing clean, natural muscle preservation. 
                  </p>
                  <div className="grid grid-cols-2 gap-4 bg-brand-light-green/20 p-4 rounded-xl border border-brand-green/5 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">FOUNDATIONAL WEIGHT</p>
                      <p className="text-lg font-mono font-extrabold text-red-600">89 kg (Obese DAD)</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">OPTIMIZED STATE</p>
                      <p className="text-lg font-mono font-extrabold text-brand-green">74 kg (Athletic State)</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-green" /> 100% Home-cooked meals, no restrictive starvation.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-green" /> Posture correction routines focused on pelvic pelvic tilt.</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTransformationTab === 'athlete' && (
              <motion.div 
                key="athlete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden border border-brand-light-green shadow-inner">
                    <img 
                      src="https://static.wixstatic.com/media/176a3f_5a4fff7f83464fc59180c9a3e539c7c7~mv2.jpg/v1/crop/x_97,y_0,w_671,h_865/fill/w_310,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/front.jpg" 
                      alt="Coach Before / After Front Profile" 
                      className="w-full h-[420px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-brand-dark-green/95 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/10 font-bold uppercase">
                      Frontal Progressive Hypertrophy
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-5 text-left">
                  <span className="text-[10px] bg-brand-light-green text-brand-green font-bold font-mono px-2.5 py-1 rounded">TRANSFORMATION FILE #02</span>
                  <h3 className="font-display text-2xl font-extrabold text-brand-dark-green leading-snug">Metabolic Reconstruction</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Proof that age is just a placeholder. Building high-contrast musculature and complete metabolic recovery doesn't require performance drugs or black-market fat burners. By organizing progressive overload (TUT, optimal sets, training volume), we rebuilt structural core aesthetics.
                  </p>
                  <div className="grid grid-cols-2 gap-4 bg-brand-light-green/20 p-4 rounded-xl border border-brand-green/5 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">BODY FAT PERCENTAGE</p>
                      <p className="text-lg font-mono font-extrabold text-red-600">~28% Initial</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">SHREDDED METRICS</p>
                      <p className="text-lg font-mono font-extrabold text-brand-green">~9% Competition Ready</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-green" /> Complete mastery of calorie counting and micro tracking.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-green" /> Safe progressive overload with zero joint pain or injuries.</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTransformationTab === 'story' && (
              <motion.div 
                key="story"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden border border-brand-light-green shadow-inner">
                    <img 
                      src="https://static.wixstatic.com/media/176a3f_9bdfdf33c5604346b1bc25e04ef76f4c~mv2.png/v1/crop/x_0,y_59,w_353,h_455/fill/w_310,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/medals.png" 
                      alt="Trophies Athlete" 
                      className="w-full h-[420px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-brand-dark-green/95 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/10 font-bold uppercase">
                      ICN Natural Athlete Medalist Status
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 space-y-5 text-left">
                  <span className="text-[10px] bg-brand-light-green text-brand-green font-bold font-mono px-2.5 py-1 rounded">MEDALS & COMPETITION RECOGNITION</span>
                  <h3 className="font-display text-2xl font-extrabold text-brand-dark-green leading-snug">Competing Naturally on High-Integrity Stages</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Representing ICN (I Compete Natural) means adhering to the absolute highest standards of athletic integrity and drug-free sportsmanship. Coach Chinmay has proven that an ordinary corporate executive can reach world-class, shredded natural levels through calculated biological discipline.
                  </p>
                  <div className="p-4 bg-brand-light-green/30 rounded-xl space-y-2 border border-brand-green/10">
                    <p className="text-xs font-bold text-brand-dark-green flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-brand-green" />
                      ICN Natural Bodybuilding Medalist
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Rigorous testing, organic nutrition, and structured progressive loading. If we can reach competition metrics cleanly, we can easily simplify your fat-loss or longevity goals.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Corporate Bio Card */}
          <div className="mt-12 pt-10 border-t border-brand-light-green grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow border border-brand-light-green flex-shrink-0 relative group">
                <img 
                  src="https://static.wixstatic.com/media/176a3f_a7a17d443655487684248b44f6dd9c3f~mv2.jpg/v1/fill/w_600,h_800,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/176a3f_a7a17d443655487684248b44f6dd9c3f~mv2.jpg" 
                  alt="Chinmay Jain Coach Studio Profile" 
                  className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-display text-xl font-bold text-brand-dark-green flex items-center gap-2">
                The Founder's Journey: From Executive to Consultant
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                "For 14 years, I worked in intense corporate executive roles. I sat at a desk for 11 hours, ate processed meals during deadlines, and faced severe chronic fatigue. I hold an MBA in Marketing and an Engineering degree in Computer Science, so analytical metrics are in my blood. When I discovered the clinical science of nutrition and transformed my own life, I became an INFS Certified Nutrition & Fitness Consultant to share this simplified science with the world."
              </p>
              <div className="text-[11px] text-brand-green font-bold uppercase tracking-wider font-mono">
                My Promise: I will help you master the metrics so you never need to hire a coach again.
              </div>
              
              {/* Social links */}
              <div className="flex gap-3 pt-2">
                <a href="https://www.linkedin.com/in/chinmay4jain/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-brand-light-green/30 hover:bg-brand-green hover:text-white transition-all text-[11px] font-bold text-brand-green flex items-center gap-1.5 border border-brand-green/10">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn Professional Profile
                </a>
                <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-brand-light-green/30 hover:bg-brand-green hover:text-white transition-all text-[11px] font-bold text-brand-green flex items-center gap-1.5 border border-brand-green/10">
                  <Instagram className="h-3.5 w-3.5" /> @fitkode
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Instagram Grid CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-brand-green tracking-wider bg-brand-light-green/45 px-3 py-1 rounded-full">
            INSTAGRAM FEED
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark-green">
            Join us on Instagram <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer" className="text-brand-green hover:underline">@fitkode</a>
          </h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">Get daily posture correction exercises, meal-swapping masterclasses, and scientific calorie metrics directly on your social feed.</p>
        </div>
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-brand-light-green hover:shadow-lg transition-shadow bg-white p-2">
          <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer">
            <img 
              src="https://static.wixstatic.com/media/176a3f_5921d1160ded4768845dc5045df5b13d~mv2.png/v1/fill/w_833,h_778,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Instagram%20Fitkode_edited.png" 
              alt="Fitkode Instagram grid feed" 
              className="w-full h-auto object-cover hover:scale-101 transition-transform duration-500 rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </section>

      {/* Interactive FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-brand-green tracking-wider bg-brand-light-green/45 px-3 py-1 rounded-full">
            FAQS
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark-green">
            Frequently Asked Scientific Questions
          </h2>
          <p className="text-xs text-gray-400">Clear, transparent answers to help you make an informed investment in your health.</p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-brand-light-green shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-display font-extrabold text-brand-dark-green text-sm md:text-base leading-snug">
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-brand-green flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-brand-green flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-xs text-gray-500 leading-relaxed border-t border-brand-light-green/40 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Get in Touch / Consultation Intake Form Section */}
      <section className="w-full">
        <ContactForm />
      </section>

    </div>
  );
}
