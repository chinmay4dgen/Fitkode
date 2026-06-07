import React, { useState } from 'react';
import { Award, Zap, Heart, Shield, Dumbbell, Sparkles, Send, Phone, Mail, MapPin, CheckCircle, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onPlanClick: () => void;
}

export default function Home({ onPlanClick }: HomeProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    goal: '',
    code: 'IN +91',
  });
  const [submitted, setSubmitted] = useState(false);

  const pillars = [
    {
      title: 'Plan your Home / Travel workouts',
      img: 'https://static.wixstatic.com/media/176a3f_2e87bc0a9aab4ec68992f6ea0c28d2e2~mv2.jpg/v1/fill/w_310,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/kid-his-father-doing-sport-home.jpg',
    },
    {
      title: 'Set your own Nutrition Plans',
      img: 'https://static.wixstatic.com/media/11062b_ec433d2e054d45a99f75bd2073c51817~mv2.jpg/v1/crop/x_1077,y_0,w_2845,h_3333/fill/w_310,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Calorie%20Count.jpg',
    },
    {
      title: 'Plan your Gym Workouts',
      img: 'https://static.wixstatic.com/media/176a3f_4fe54ac6147945238bd243dcc9782915~mv2.png/v1/crop/x_644,y_0,w_1527,h_1797/fill/w_310,h_360,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/lady%20workout.png',
    },
    {
      title: 'Learn Art of Meditation',
      img: 'https://static.wixstatic.com/media/176a3f_19781c109b7144d9adce2b5e7c3d13ad~mv2.png/v1/crop/x_619,y_0,w_1139,h_1335/fill/w_310,h_360,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/meditation.png',
    },
  ];

  const highlights = [
    {
      title: 'Eat All You Love',
      desc: 'Eat your favorite foods & Carbs Daily, no starvation diets.',
    },
    {
      title: 'No Superfoods Required',
      desc: 'No expensive gluten-free, black water, Moringa, detox, or exotic superfoods required.',
    },
    {
      title: 'Quick Workouts',
      desc: 'Bespoke Home, Gym & Travel resistance plans built entirely around your busy schedule.',
    },
    {
      title: 'Eat Any Time',
      desc: 'No rigid, impractical clocks. Eat anytime of the day and night as per macros.',
    },
    {
      title: 'No Fasting Mandatory',
      desc: 'Forget intermittent, dry, or extreme fasts. Get stellar results gracefully.',
    },
    {
      title: 'Zero Compulsory Supplements',
      desc: 'Complete all vital nutrition strictly from real, organic food sources.',
    },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Simple reset
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
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-light-green/20 via-transparent to-transparent pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/45">
            <Sparkles className="h-3.5 w-3.5" /> What is Fitkode?
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-brand-green">
            It's Fitness Simplified
          </h1>
          <p className="font-display text-xl md:text-2xl font-medium text-brand-dark-green max-w-3xl mx-auto">
            An Educational Initiative to Help You Live Healthier & Happier
          </p>
          <div className="h-[2px] w-20 bg-brand-green/30 mx-auto" />
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Apart from providing you with custom nutrition plans and workout regimes, we make you fully independent by teaching you how to maintain metrics yourself.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              onClick={onPlanClick}
              className="px-8 py-3 rounded-full bg-brand-green hover:bg-brand-dark-green text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Explore Our Plans
            </button>
            <a 
              href="#founder"
              className="px-8 py-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all"
            >
              Meet the Coach & founder
            </a>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, idx) => (
            <div 
              key={idx} 
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-72 overflow-hidden relative">
                <img 
                  src={p.img} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-display font-bold text-gray-900 leading-tight block group-hover:text-brand-green transition-colors">
                  {p.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights / Features Grid */}
      <section className="bg-brand-light-green/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-dark-green">
              Our Foundations for Simplified Fitness
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              We follow the "KISS" principle — Keep It Simple Silly! No complicated protocols or ridiculous supplement loads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((h, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-light-green/60 text-brand-green flex items-center justify-center font-bold">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-gray-900 text-base">{h.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur border border-brand-green/10 rounded-2xl p-6 text-center max-w-2xl mx-auto">
            <p className="text-xs text-gray-600 font-medium">
              Combining Measured Nutrition, Spirituality through Meditation & Resistance Training. Reach peak longevity and sustainable energy.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Transformation Section */}
      <section id="founder" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-display text-4xl font-extrabold text-brand-dark-green tracking-tight">
            Why should YOU trust Fitkode?
          </h2>
          <p className="text-brand-green font-bold text-sm tracking-wide uppercase">
            And Founder also Leads with Example!
          </p>
          <div className="max-w-3xl mx-auto text-gray-600 text-sm leading-relaxed space-y-2">
            <p>From Fat DAD to FIT DAD. From General Fitness to Competition Level Prep.</p>
            <p>From Natural Bodybuilding Athlete to Qualified Nutrition & Fitness Consultant.</p>
            <p>From self-transformation to transforming the lives of people globally!</p>
          </div>
        </div>

        {/* High fidelity Wix cropped transformation images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 rounded-2xl overflow-hidden shadow-sm border border-brand-light-green hover:shadow-lg transition-all p-3">
            <img 
              src="https://static.wixstatic.com/media/176a3f_7fa55bd22ae94a50b944aa20a7a81927~mv2.jpg/v1/crop/x_144,y_4,w_647,h_835/fill/w_310,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/left%20side.jpg" 
              alt="Coach Before / After Left Profile" 
              className="w-full h-96 object-cover rounded-xl shadow-inner animate-fade-in"
              referrerPolicy="no-referrer"
            />
            <p className="text-[11px] text-brand-green text-center font-bold font-mono tracking-wider mt-3">COACH PROFILE - SIDE PROFILE TRANSFORMATION</p>
          </div>

          <div className="bg-white/70 rounded-2xl overflow-hidden shadow-sm border border-brand-light-green hover:shadow-lg transition-all p-3">
            <img 
              src="https://static.wixstatic.com/media/176a3f_5a4fff7f83464fc59180c9a3e539c7c7~mv2.jpg/v1/crop/x_97,y_0,w_671,h_865/fill/w_310,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/front.jpg" 
              alt="Coach Before / After Front Profile" 
              className="w-full h-96 object-cover rounded-xl shadow-inner animate-fade-in"
              referrerPolicy="no-referrer"
            />
            <p className="text-[11px] text-brand-green text-center font-bold font-mono tracking-wider mt-3">COACH PROFILE - FRONT PROFILE PROGRESS</p>
          </div>

          <div className="bg-white/70 rounded-2xl overflow-hidden shadow-sm border border-brand-light-green hover:shadow-lg transition-all p-3">
            <img 
              src="https://static.wixstatic.com/media/176a3f_9bdfdf33c5604346b1bc25e04ef76f4c~mv2.png/v1/crop/x_0,y_59,w_353,h_455/fill/w_310,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/medals.png" 
              alt="Trophies Athlete" 
              className="w-full h-96 object-cover rounded-xl shadow-inner animate-fade-in"
              referrerPolicy="no-referrer"
            />
            <p className="text-[11px] text-brand-green text-center font-bold font-mono tracking-wider mt-3">ICN NATURAL ATHLETE MEDALS & REPRESENTATION</p>
          </div>
        </div>

        {/* Coach Bio Sidebar & Details Layout */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-brand-light-green p-8 shadow-sm flex flex-col lg:flex-row gap-10 items-center">
          
          {/* Coach avatar */}
          <div className="w-56 h-72 lg:w-64 lg:h-96 rounded-2xl overflow-hidden shadow border border-brand-light-green flex-shrink-0">
            <img 
              src="https://static.wixstatic.com/media/176a3f_a7a17d443655487684248b44f6dd9c3f~mv2.jpg/v1/fill/w_281,h_610,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/176a3f_a7a17d443655487684248b44f6dd9c3f~mv2.jpg" 
              alt="Chinmay Jain Coach" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Coach Info text */}
          <div className="flex-1 space-y-6">
            <div className="space-y-1 text-center lg:text-left">
              <h3 className="font-display text-3xl font-extrabold text-brand-dark-green">Chinmay Jain</h3>
              <p className="text-brand-green font-bold text-lg font-mono">Founder, FITKODE</p>
            </div>

            <p className="text-sm leading-relaxed text-gray-600 font-medium">
              Not just your regular Gym Trainer. <span className="bg-brand-light-green/45 px-1.5 py-0.5 rounded text-brand-dark-green font-bold">A Holistic Health Coach</span> with 13 Yrs of successful corporate career. MBA in Marketing and Engineering in Computer Science. Now a <span className="text-gray-800 font-bold">Certified Nutrition & Fitness Consultant</span>.
            </p>

            <div className="h-[1px] bg-gray-100 w-full" />

            <div className="space-y-4 text-xs lg:text-sm text-gray-500 leading-relaxed">
              <p>A teacher by heart, I truly believe in sharing & spreading the knowledge that can help transform lives for the better.</p>
              <p>My vision is to educate people globally about concepts of Holistic fitness and Simplify the approach through FITKODE. Every human should be able to experience Strength, Energy, Mental focus, and overall quality of life in their lifetime.</p>
              <p>If my initiative improves even 1 Life - I will consider myself blessed. My mission is to help at least 1 MN lives globally in my lifetime.</p>
              <p className="font-bold text-brand-green">Let's spread this Code of Simplified Holistic Fitness together. Let's build our FITKODE!</p>
            </div>

            {/* Social handles */}
            <div className="flex gap-4 pt-2">
              <a href="https://www.linkedin.com/in/chinmay4jain/" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-brand-light-green/40 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm">
                <Linkedin className="h-4.5 w-4.5" />
              </a>
              <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-brand-light-green/40 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm">
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=100086139707747" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-brand-light-green/40 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm">
                <Facebook className="h-4.5 w-4.5" />
              </a>
              <a href="https://www.youtube.com/@fitkode" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-brand-light-green/40 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm">
                <Youtube className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">
            Check us on Instagram <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer" className="text-brand-green hover:underline">@fitkode</a>
          </h2>
          <p className="text-xs text-gray-400">Join our online tribe for daily motivation, posture tips, and macro educational lessons.</p>
        </div>
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-brand-light-green hover:shadow-lg transition-shadow">
          <a href="https://www.instagram.com/fitkode/" target="_blank" rel="noreferrer">
            <img 
              src="https://static.wixstatic.com/media/176a3f_5921d1160ded4768845dc5045df5b13d~mv2.png/v1/fill/w_833,h_778,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Instagram%20Fitkode_edited.png" 
              alt="Fitkode Instagram grid feed" 
              className="w-full h-auto object-cover hover:scale-101 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-brand-light-green overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-5">
          
          {/* Quick Info Sidebar */}
          <div className="md:col-span-2 bg-brand-green text-white p-8 flex flex-col justify-between space-y-8">
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-bold">Get in Touch</h3>
              <p className="text-xs text-brand-light-green/90 leading-relaxed">
                Connect for corporate fitness seminars, personal checkup requests, or selecting appropriate pricing schemes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-light-green font-medium">CALL US</p>
                  <p className="text-xs font-bold font-mono">+91-9828402190</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-light-green font-medium">EMAIL US</p>
                  <p className="text-xs font-bold font-mono">myfitkode@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-brand-light-green font-medium">HEAD OFFICE</p>
                  <p className="text-xs font-medium font-sans">A1905, Prateek Wisteria, Sec-77, Noida-201301 </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-brand-light-green/75">
              Available 7 days a week for custom consultation workouts.
            </div>
          </div>

          {/* Interactive Form */}
          <div className="md:col-span-3 p-8 space-y-4">
            <h4 className="font-display font-bold text-gray-900 text-lg">Send a Message</h4>
            
            {submitted ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-brand-light-green text-brand-green flex items-center justify-center font-bold text-xl shadow-inner">
                  ✓
                </div>
                <p className="font-display font-bold text-brand-dark-green">Thank you for submitting!</p>
                <p className="text-xs text-gray-500">Coach Chinmay Jain or a Fitkode assistant will call you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-650 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green text-brand-dark-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-650 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green text-brand-dark-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-650 mb-1">Email *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green text-brand-dark-green"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-gray-655 mb-1">Code *</label>
                    <select 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-2 py-2 border border-brand-light-green bg-white rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green text-brand-dark-green text-[11px]"
                    >
                      <option value="IN +91">IN +91</option>
                      <option value="US +1">US +1</option>
                      <option value="UK +44">UK +44</option>
                      <option value="AE +971">AE +971</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-650 mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="98284 02190"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green text-brand-dark-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-650 mb-1">What goal are you chasing?</label>
                  <textarea 
                    rows={2}
                    placeholder="Tell us about your fitness targets (e.g. general strength, shredded physique, natural bodybuilding prep)..."
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green resize-none text-brand-dark-green"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-brand-green text-white font-bold text-xs shadow hover:bg-brand-dark-green transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send My Fitness Metrics
                </button>
              </form>
            )}

          </div>

        </div>
      </section>

    </div>
  );
}
