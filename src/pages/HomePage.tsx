import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/home/Navbar";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import ServicesSection from "../components/home/ServicesSection";
import ProjectsSection from "../components/home/ProjectsSection";
import UpdatesSection from "../components/home/UpdatesSection";
import Footer from "../components/home/Footer";
import { SuwecoLogo } from "../components/home/SuwecoLogo";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    // Simulate loading time for the entrance transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#111d2d] overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, backgroundColor: "transparent" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Lightning Streak (0.5 to 1.0) */}
            <motion.div
              className="absolute h-[2px] w-[150vw] bg-white z-20"
              initial={{ x: "-100vw", y: 0, opacity: 0, rotate: -5 }}
              animate={{ x: ["-100vw", "10vw", "100vw"], opacity: [0, 1, 0] }}
              transition={{ times: [0, 0.4, 1], duration: 0.4, delay: 0.5, ease: "easeIn" }}
              style={{ boxShadow: '0 0 20px 5px rgba(96,165,250,0.6), 0 0 40px 10px rgba(59,130,246,0.6)' }}
            />
            {/* Second lightning strike (fast) */}
            <motion.div
              className="absolute h-[1px] w-[50vw] bg-[#60a5fa] z-20"
              initial={{ x: "100vw", y: "10vh", opacity: 0, rotate: 5 }}
              animate={{ x: ["100vw", "-100vw"], opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, delay: 0.7, ease: "linear" }}
              style={{ boxShadow: '0 0 15px 3px rgba(96,165,250,0.6)' }}
            />

            {/* Background Glow Pulses (1.0 onwards) */}
            <motion.div
              className="absolute rounded-full bg-blue-500/20 blur-[100px] w-[400px] h-[400px] max-w-[80vw] max-h-[80vw]"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.5, 1.2, 0], 
                opacity: [0, 1, 0.8, 0] 
              }}
              transition={{ times: [0, 0.3, 0.8, 1], duration: 1.5, delay: 1.0, ease: "easeOut" }}
            />
            
            <motion.div
              className="absolute rounded-full bg-[#f5a623]/10 blur-[80px] w-[300px] h-[300px] max-w-[60vw] max-h-[60vw]"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.2, 1, 0], 
                opacity: [0, 1, 0.6, 0] 
              }}
              transition={{ times: [0, 0.3, 0.8, 1], duration: 1.5, delay: 1.1, ease: "easeOut" }}
            />

            {/* Logo and Text Container */}
            <motion.div
              className="relative flex flex-col items-center justify-center z-10"
              initial={{ scale: 0.9, opacity: 0, x: 0, y: 0 }}
              animate={{ 
                scale: [0.9, 1.05, 1, 1, 1], 
                opacity: [0, 1, 1, 1, 0],
                y: 0,
                x: 0
              }}
              transition={{ times: [0, 0.1, 0.2, 0.8, 1], duration: 1.5, delay: 1.0, ease: "easeInOut" }}
            >
              <div className="relative overflow-hidden px-4 py-4">
                <SuwecoLogo className="h-16 md:h-24" />
                
                {/* Light Streak inside logo */}
                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-20deg]"
                  initial={{ left: "-100%" }}
                  animate={{ left: "200%" }}
                  transition={{ duration: 1, ease: "easeInOut", delay: 1.2 }}
                />
              </div>

              {/* Stabilizer Text */}
              <motion.div
                className="mt-6 text-[#f5a623] text-xs font-bold tracking-[0.3em] uppercase font-inter text-center whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ times: [0, 0.2, 0.8, 1], duration: 1.1, delay: 1.4 }}
                style={{
                  textShadow: '0 0 10px rgba(245, 166, 35, 0.5)'
                }}
              >
                Powering System...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white fixed inset-0 overflow-hidden">
        <motion.div
           initial={{ opacity: 0, y: "15vh" }}
           animate={!loading ? { opacity: 1, y: 0 } : { opacity: 0, y: "15vh" }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
           className="w-full h-full relative"
        >
          <Navbar key="navbar" />
          
          {/* Scroll Snap Container covering full window */}
          <div 
            id="main-scroll-container" 
            ref={containerRef}
            className={`w-full h-full overflow-y-auto overflow-x-hidden snap-y bg-[#1b2d48] snap-mandatory`}
          >
             <div className="snap-start snap-always w-full flex-shrink-0 relative">
                <HeroSection containerRef={containerRef} />
             </div>
             <div className="snap-start snap-always w-full flex-shrink-0 relative bg-white">
                <AboutSection />
             </div>
             <div className="snap-start snap-always w-full flex-shrink-0 relative bg-white">
                <ServicesSection />
             </div>
             <div className="snap-start snap-always w-full flex-shrink-0 relative bg-white">
                <ProjectsSection />
             </div>
             <div className="snap-start snap-always w-full flex-shrink-0 relative bg-white">
                <UpdatesSection />
             </div>
             <div className="snap-end w-full relative bg-white">
                <Footer />
             </div>
          </div>
        </motion.div>
        <Toaster />
      </div>
    </>
  );
}
