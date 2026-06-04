import React, { useState, useEffect } from "react";
import { Zap, Menu, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { SuwecoLogo } from "./SuwecoLogo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isHero, setIsHero] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainScroll = document.getElementById("main-scroll-container");
      const scrollPos = mainScroll ? mainScroll.scrollTop : window.scrollY;
      const vh = window.innerHeight;
      
      setScrolled(scrollPos > 40);
      setIsHero(scrollPos < vh * 0.8);
    };
    
    window.addEventListener("scroll", handleScroll);
    
    const mainScroll = document.getElementById("main-scroll-container");
    if (mainScroll) {
      mainScroll.addEventListener("scroll", handleScroll);
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainScroll) {
        mainScroll.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const isVisible = isHero || isHovered || mobileMenuOpen;

  return (
    <>
      {/* Invisible Hover Sensor Area (only when not in hero and not hovered) */}
      {!isVisible && (
        <div 
          onMouseEnter={() => setIsHovered(true)}
          className="fixed top-0 left-0 right-0 h-4 z-[55] cursor-pointer"
        />
      )}

      <motion.nav
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 px-6 lg:px-10 ${
          scrolled 
            ? "bg-white/80 backdrop-blur-lg shadow-md py-3 border-b border-gray-100" 
            : "bg-transparent py-6"
        }`}
      >
        <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-300 ${
          !scrolled ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : ""
        }`}>
          <a href="#home" className="flex items-center gap-3">
            <SuwecoLogo 
              isDarkTheme={!scrolled} 
              className="h-10 md:h-12 lg:h-14 transition-all duration-300" 
            />
          </a>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#home" className={`text-sm font-semibold transition-colors font-inter ${
              scrolled ? "text-[#1b2d48] hover:text-[#f5a623]" : "text-white/80 hover:text-white"
            }`}>Home</a>
            
            <div className="relative group py-6 -my-6">
              <button className={`flex items-center gap-1 text-sm font-semibold transition-colors font-inter outline-none ${
                scrolled ? "text-[#1b2d48] group-hover:text-[#f5a623]" : "text-white/80 group-hover:text-white"
              }`}>
                About
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 w-48 bg-white text-[#1b2d48] rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left -translate-y-2 group-hover:translate-y-0">
                <a href="#about" className="block px-4 py-3 hover:bg-blue-50 text-sm font-medium rounded-t-xl transition-colors">Overview</a>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-org-chart'));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium rounded-b-xl transition-colors border-t border-gray-50"
                >
                  Our Team
                </button>
              </div>
            </div>

            <a href="#services" className={`text-sm font-semibold transition-colors font-inter ${
              scrolled ? "text-[#1b2d48] hover:text-[#f5a623]" : "text-white/80 hover:text-white"
            }`}>Services</a>
            
            <div className="relative group py-6 -my-6">
              <button className={`flex items-center gap-1 text-sm font-semibold transition-colors font-inter outline-none ${
                scrolled ? "text-[#1b2d48] group-hover:text-[#f5a623]" : "text-white/80 group-hover:text-white"
              }`}>
                Projects
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white text-[#1b2d48] rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left -translate-y-2 group-hover:translate-y-0 flex flex-col">
                <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 2 } })); }} className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium rounded-t-xl transition-colors">Tablas Diesel Power Plant</button>
                <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 8 } })); }} className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium transition-colors border-t border-gray-50">Tumingad Solar Power Plant</button>
                <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 9 } })); }} className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium transition-colors border-t border-gray-50">Tumingad Solar Expansion</button>
                <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 1 } })); }} className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium transition-colors border-t border-gray-50">Carabao Island Diesel Plant</button>
                <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 3 } })); }} className="w-full text-left block px-4 py-3 hover:bg-blue-50 text-sm font-medium rounded-b-xl transition-colors border-t border-gray-50">Tablas Island 13.7 MW Diesel Power Plant Projects</button>
              </div>
            </div>

            <a href="#updates" className={`text-sm font-semibold transition-colors font-inter ${
              scrolled ? "text-[#1b2d48] hover:text-[#f5a623]" : "text-white/80 hover:text-white"
            }`}>Updates</a>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/monitoring"
              className={`text-[13px] font-bold px-5 py-2.5 rounded-full border transition-all duration-300 font-inter ${
                scrolled 
                  ? "text-[#1b2d48] border-[#1b2d48]/20 hover:border-[#1b2d48] hover:bg-[#1b2d48] hover:text-white" 
                  : "text-white border-white/25 hover:border-white/50"
              }`}
            >
              STEC Portal
            </a>
          </div>

          <button
            className={`lg:hidden transition-colors ${scrolled ? "text-[#1b2d48]" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#1b2d48]/98 pt-24 px-6 pb-6 flex flex-col">
          <div className="flex flex-col gap-4">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-white/80 text-base py-3 border-b border-white/10 font-inter">Home</a>
            
            <div className="flex flex-col border-b border-white/10">
              <button 
                onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                className="flex items-center justify-between text-white/80 text-base py-3 font-inter w-full text-left"
              >
                About
                <ChevronDown className={`w-5 h-5 transition-transform ${aboutDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {aboutDropdownOpen && (
                <div className="flex flex-col pl-4 pb-2">
                  <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white text-base py-2 font-inter">Overview</a>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open-org-chart'));
                      setMobileMenuOpen(false);
                      setAboutDropdownOpen(false);
                    }} 
                    className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter"
                  >
                    Our Team
                  </button>
                </div>
              )}
            </div>

            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-white/80 text-base py-3 border-b border-white/10 font-inter">Services</a>
            
            <div className="flex flex-col border-b border-white/10">
              <button 
                onClick={() => setProjectsDropdownOpen(!projectsDropdownOpen)}
                className="flex items-center justify-between text-white/80 text-base py-3 font-inter w-full text-left"
              >
                Projects
                <ChevronDown className={`w-5 h-5 transition-transform ${projectsDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {projectsDropdownOpen && (
                <div className="flex flex-col pl-4 pb-2">
                  <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 2 } })); setMobileMenuOpen(false); setProjectsDropdownOpen(false); }} className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter">Tablas Diesel Power Plant</button>
                  <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 8 } })); setMobileMenuOpen(false); setProjectsDropdownOpen(false); }} className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter">Tumingad Solar Power Plant</button>
                  <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 9 } })); setMobileMenuOpen(false); setProjectsDropdownOpen(false); }} className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter">Tumingad Solar Expansion</button>
                  <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 1 } })); setMobileMenuOpen(false); setProjectsDropdownOpen(false); }} className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter">Carabao Island Diesel Plant</button>
                  <button onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('select-project', { detail: { projectId: 3 } })); setMobileMenuOpen(false); setProjectsDropdownOpen(false); }} className="w-full text-left text-white/60 hover:text-white text-base py-2 font-inter">Tablas Island 13.7 MW Diesel Power Plant Projects</button>
                </div>
              )}
            </div>

            <a href="#updates" onClick={() => setMobileMenuOpen(false)} className="text-white/80 text-base py-3 font-inter">Updates</a>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <a
              href="/monitoring"
              className="text-center text-white text-sm font-medium px-5 py-3 rounded-full border border-white/25 font-inter"
            >
              STEC Portal
            </a>
          </div>
        </div>
      )}
    </>
  );
}
