import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Zap, ShieldCheck, Users } from "lucide-react";

import OrgChart from "./OrgChart";

const ABOUT_IMG = "https://res.cloudinary.com/dit5iwj2o/image/upload/v1779068423/ChatGPT_Image_Apr_30_2026_01_45_41_PM_kcuqfd.png";

const CARDS = [
  {
    num: "01",
    title: "Our Mission",
    icon: Zap,
    text: "SUWECO Tablas Energy Corporation (STEC) is dedicated to delivering reliable, efficient, and sustainable energy solutions that empower communities and support regional development across Tablas Island. Since 2013, we have worked tirelessly to ensure that island residents have access to the electricity they need to thrive, driving economic growth and improving quality of life."
  },
  {
    num: "02",
    title: "Our Operations",
    icon: ShieldCheck,
    text: "STEC operates one of the largest and most advanced hybrid solar-diesel microgrid systems with innovative battery storage technology in the Philippines. This dual-source approach ensures a stable and resilient electricity supply even in challenging conditions, significantly reducing our carbon footprint while maintaining 24/7 reliability for our valued consumers."
  },
  {
    num: "03",
    title: "Our Commitment",
    icon: Users,
    text: "Our team remains steadfast in our commitment to 24/7 reliability and stakeholder coordination. We are continuously expanding our generation capacity to stay ahead of rising demand, investing in modern infrastructure, and fostering strong partnerships with local government units and cooperatives to build a brighter, more electrified future for all."
  }
];

export default function AboutSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showOrgChart, setShowOrgChart] = useState(false);

  useEffect(() => {
    const handleOpenOrgChart = () => {
      setShowOrgChart(true);
    };

    window.addEventListener('open-org-chart', handleOpenOrgChart);
    return () => {
      window.removeEventListener('open-org-chart', handleOpenOrgChart);
    };
  }, []);

  return (
    <section 
      id="about" 
      className="about-section relative bg-[#f4f7fb] py-24 lg:py-32 font-inter"
    >
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-[0.35] mix-blend-multiply bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${ABOUT_IMG})` }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.2 }}
          className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24"
        >
          {/* Left Column: Content */}
          <div className="w-full lg:w-5/12 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-[2px] bg-[#f5a623]" />
              <span className="text-[#1b2d48] font-bold text-sm tracking-[0.2em] uppercase">
                ABOUT SUWECO
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-[#1b2d48] text-4xl md:text-5xl lg:text-6xl font-black text-left leading-[1.1] mb-6 tracking-tight"
            >
              Discover Our <span className="text-[#f5a623]">Story</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-[#1b2d48]/70 text-lg md:text-xl leading-relaxed mb-8 max-w-lg"
            >
              SUWECO Tablas Energy Corporation (STEC) is at the forefront of providing sustainable and reliable energy solutions to the beautiful island of Tablas. Our journey is defined by innovation, community empowerment, and a legacy of excellence in energy transmission.
            </motion.p>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ x: 5 }}
              onClick={() => setShowOrgChart(true)}
              className="group flex items-center gap-3 text-[#1b2d48] font-black tracking-widest text-sm uppercase transition-all"
            >
              MEET OUR TEAM
              <ArrowRight className="w-5 h-5 text-[#f5a623] group-hover:translate-x-2 transition-transform duration-300" />
            </motion.button>
          </div>

          {/* Right Column: Interaction Cards */}
          <div className="w-full lg:w-7/12 flex flex-col gap-6">
            {CARDS.map((card, idx) => {
              const Icon = card.icon;
              const isActive = activeIndex === idx;

              return (
                <motion.div
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: 0.4 + idx * 0.1,
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                  className={`
                    group relative backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden cursor-pointer
                    ${idx === 1 ? 'lg:ml-12' : idx === 2 ? 'lg:ml-24' : ''}
                    ${isActive ? 'bg-white/95 scale-[1.02] shadow-2xl z-20' : 'bg-white/80 scale-100 z-10'}
                    transition-all duration-500
                  `}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-[#1b2d48]/10 group-hover:text-[#f5a623]/20 transition-colors">
                            {card.num}
                          </span>
                          <div className={`w-8 h-[1px] ${isActive ? 'bg-[#f5a623]' : 'bg-[#1b2d48]/10'} transition-colors duration-500`} />
                          <h4 className="text-xl font-bold text-[#1b2d48]">
                            {card.title}
                          </h4>
                       </div>
                       <Icon className={`w-6 h-6 transition-all duration-500 ${isActive ? 'text-[#f5a623] rotate-12 scale-110' : 'text-[#1b2d48]/30'}`} />
                    </div>

                    <div 
                      className={`grid transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-[#1b2d48]/60 text-sm md:text-base leading-relaxed">
                          {card.text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover Accent */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-[#f5a623] transform transition-transform duration-500 ${isActive ? 'translate-x-0' : '-translate-x-full'}`} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Org Chart Modal */}
      <AnimatePresence>
        {showOrgChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-2xl"
            onClick={() => setShowOrgChart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden p-12 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowOrgChart(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all z-20"
              >
                <div className="w-6 h-6 rotate-45 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current" />
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-current" />
                </div>
              </button>

              <div className="text-center mb-16">
                 <h3 className="text-[#1b2d48] text-4xl font-black uppercase tracking-tight mb-4">Organizational Chart</h3>
                 <div className="w-16 h-1.5 bg-[#f5a623] mx-auto rounded-full" />
              </div>

              {/* Simple Org Chart Visualization */}
              <div className="flex flex-col items-center justify-center w-full">
                <img 
                  src="https://res.cloudinary.com/dz8pj30k0/image/upload/v1777948889/ChatGPT_Image_May_5_2026_10_39_39_AM_duprnj.png" 
                  alt="SUWECO Organization Chart" 
                  className="w-full max-w-5xl h-auto rounded-xl shadow-sm object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function OrgMember({ name, title, color, highlight = false }: { name: string, title: string, color: string, highlight?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl text-center border shadow-lg w-full max-w-[240px] ${highlight ? 'ring-4 ring-[#f5a623]/20' : ''}`}
      style={{ 
        backgroundColor: highlight ? '#fff' : 'white',
        borderColor: highlight ? '#f5a623' : '#e2e8f0'
      }}
    >
      <div className="text-xl font-bold mb-1" style={{ color }}>{name}</div>
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</div>
    </motion.div>
  );
}
