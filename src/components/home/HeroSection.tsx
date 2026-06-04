import React, { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HeroSection({ containerRef }: { containerRef?: React.RefObject<HTMLDivElement> }) {
  const { scrollY } = useScroll(containerRef ? { container: containerRef } : undefined);
  const [winHeight, setWinHeight] = useState(1000);
  
  useEffect(() => {
    setWinHeight(window.innerHeight);
    const handleResize = () => setWinHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Motion values based on vertical scroll
  const backgroundScale = useTransform(scrollY, [0, winHeight], [1, 1.05]);
  const videoBlur = useTransform(scrollY, [0, winHeight], ["blur(0px)", "blur(12px)"]);
  const overlayOpacity = useTransform(scrollY, [0, winHeight], [0.4, 0.85]);
  
  const contentY = useTransform(scrollY, [0, winHeight * 0.8], [0, -150]);
  const contentOpacity = useTransform(scrollY, [0, winHeight * 0.6], [1, 0]);

  return (
    <section id="home" className="hero-section relative w-full flex flex-col overflow-hidden bg-[#1b2d48]">
      {/* Background */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ scale: backgroundScale }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
      >
        {/* Background Video */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ filter: videoBlur }}
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
            src="https://res.cloudinary.com/dit5iwj2o/video/upload/v1779070351/lv_0_20260518100922_omrscc.mp4"
          />
        </motion.div>
        <motion.div className="absolute inset-0 bg-[#1b2d48]" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b2d48]/90 via-[#1b2d48]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b2d48]/90 via-transparent to-transparent" />
      </motion.div>

      {/* Accent Line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-[#f5a623] to-transparent opacity-60" />

      {/* Content */}
      <motion.div 
        className="relative z-10 flex flex-col justify-center max-w-7xl mx-auto px-6 lg:px-10 w-full flex-1 pt-16"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-[2px] bg-[#f5a623]" />
            <span className="text-[#f5a623] font-bold text-sm tracking-[0.2em] uppercase">
              Powering Tablas Island Since 2013
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.9 }} className="block">Energizing</motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 2.0 }} className="block text-[#f5a623]">Communities.</motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 2.1 }} className="block leading-[1.2]">Building Futures.</motion.span>
          </h1>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 2.4 }} className="flex flex-wrap gap-4">
              <a
                href="#about"
                className="bg-[#f5a623] hover:bg-[#e09820] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(245,166,35,0.3)] transition-all hover:scale-105 active:scale-95 text-center flex items-center justify-center min-w-[160px]"
              >
                About
              </a>
              <a
                href="#projects"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-center flex items-center justify-center min-w-[160px]"
              >
              Projects
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full mb-6"
        style={{ y: contentY, opacity: contentOpacity }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/10 rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 shadow-xl">
          {[
             { value: "9", label: "Municipalities Served" },
             { value: "14.640 MW", label: "Installed Diesel Capacity" },
             { value: "10.275 MWp", label: "Total Solar Capacity" },
             { value: "13.7 MW", label: "System Expansion Program" },
             { value: "2013", label: "Year Established" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1b2d48]/60 px-4 py-3 text-center">
              <p className="font-inter text-xl md:text-2xl font-extrabold text-[#f5a623]">{stat.value}</p>
              <p className="text-white/50 text-[10px] mt-0.5 tracking-wide font-inter">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-14 right-10 hidden lg:flex flex-col items-center gap-2 z-10"
        style={{ opacity: contentOpacity }}
      >
        <span className="text-white/30 text-[10px] tracking-widest uppercase rotate-90 mb-2 font-inter">Scroll</span>
        <ChevronDown className="w-4 h-4 text-white/30 animate-bounce" />
      </motion.div>
    </section>
  );
}
