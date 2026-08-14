import React from 'react';
import Seo from './Seo';
import { Star, Quote, CheckCircle, ShieldCheck } from 'lucide-react';
import snehaImg from '../../assets/Sneha_Sharma.png';
import shuchiImg from '../../assets/Shuchi.png';
import sanketImg from '../../assets/Sanket_Sarda.jpg';
import karamjitImg from '../../assets/Karamjit _Singh.jpg';
import alankarImg from '../../assets/Alankar_Bhatnagar.jpg';
import dhawalImg from '../../assets/Dhawal_Kapil.png';
import nitishImg from '../../assets/Nitish_Srivastave.jpeg';

export default function ResultsPage() {
  const testimonials = [
    {
      name: 'Sneha Sharma',
      role: 'Corporate Operations Lead',
      img: snehaImg,
      badge: 'Fat Loss & Portion Control',
      quote: 'Lost 11kg in 4 months while managing late-night international client calls. Coach Chinmay simplified Indian home food without cutting out rice or roti.'
    },
    {
      name: 'Shuchi Agarwal',
      role: 'Senior Product Manager',
      img: shuchiImg,
      badge: 'Metabolic Health Reversal',
      quote: 'The masterclasses gave me complete clarity on protein and caloric balance. Reversed my chronic afternoon fatigue without expensive supplements.'
    },
    {
      name: 'Sanket Sarda',
      role: 'Software Architect',
      img: sanketImg,
      badge: 'Posture & Strength Gain',
      quote: 'Corrected my desk-bound slouch and built sustainable strength with 45-minute workouts. Supervised video sessions ensured my squat and deadlift form was flawless.'
    },
    {
      name: 'Karamjit Singh Bedi',
      role: 'Business Consultant',
      img: karamjitImg,
      badge: 'Executive Recomposition',
      quote: 'Fitkode accommodated my intense travel and dining out commitments seamlessly. I learned how to make smart choices at airports and hotel buffets.'
    },
    {
      name: 'Arnav Jain',
      role: 'Finance Director',
      img: null, // Initial badge placeholder (Fix 5: No stock photo)
      initials: 'AJ',
      badge: 'Sustainable Fat Loss',
      quote: 'Shed 14kg in 6 months without restrictive crash dieting. Understanding energy balance changed my relationship with food forever.'
    },
    {
      name: 'Alankar Bhatnagar',
      role: 'Engineering Manager',
      img: alankarImg,
      badge: 'Muscle Building & Mobility',
      quote: 'The scientific approach to workout programming and progressive overload is exceptional. Coach Chinmay speaks executive language with engineer precision.'
    },
    {
      name: 'Dhawal Kapil',
      role: 'Entrepreneur',
      img: dhawalImg,
      badge: 'Lifestyle Transformation',
      quote: 'Fitkode gave me the tools to stay fit even during peak startup launches. The fasting day guidelines kept my nutrition on track through family festivals.'
    },
    {
      name: 'Nitish Srivastava',
      role: 'Marketing Lead',
      img: nitishImg,
      badge: 'Body Recomposition',
      quote: 'Gained noticeable muscle while dropping body fat. The step-by-step masterclasses on supplements and nutrition labels were worth every rupee.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <Seo 
        title="Client Transformations & Reviews | Fitkode"
        description="Real results from Fitkode graduates — fat loss, portion control and posture correction achieved without starvation diets or supplements."
        canonicalPath="/results"
      />

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-brand-light-green text-brand-dark-green font-mono text-[10px] font-extrabold uppercase tracking-widest">
          GRADUATE STORIES
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-dark-green">
          What our Students say
        </h1>
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Real people .. real transformations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-brand-light-green p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed font-serif">
                "{item.quote}"
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-brand-light-green/40">
              {item.img ? (
                <img 
                  src={item.img} 
                  alt={`${item.name} - Fitkode graduate`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-green/30"
                  width="48"
                  height="48"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-green text-white font-bold text-base flex items-center justify-center font-mono border-2 border-brand-green/30">
                  {item.initials}
                </div>
              )}
              <div>
                <p className="font-display font-bold text-sm text-brand-dark-green">{item.name}</p>
                <p className="text-[11px] text-gray-500">{item.role}</p>
                <span className="inline-block mt-1 text-[9px] font-bold text-brand-green bg-brand-light-green/50 px-2 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
