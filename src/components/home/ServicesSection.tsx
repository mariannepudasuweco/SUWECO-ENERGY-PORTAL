import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView, Variants } from "motion/react";
import { Zap, Sun, Settings, Wrench, Users, Building2 } from "lucide-react";

const SERVICES = [
  {
    icon: Zap,
    title: "Power Generation",
    desc: "Reliable electricity production using hybrid systems designed for island grid operations.",
  },
  {
    icon: Sun,
    title: "Solar Energy",
    desc: "We harness the power of the sun to deliver clean, reliable and sustainable energy solutions for a brighter future.",
  },
  {
    icon: Building2,
    title: "Diesel Power Plant",
    desc: "Robust and efficient diesel power plants providing baseline power and grid stability.",
  },
  {
    icon: Settings,
    title: "Engineering Services",
    desc: "Comprehensive engineering, design, and planning for energy infrastructure and grid management.",
  },
  {
    icon: Wrench,
    title: "Operations & Maintenance",
    desc: "24/7 monitoring, preventive and corrective maintenance extending the life of our power assets.",
  },
  {
    icon: Users,
    title: "Community Electrification",
    desc: "Empowering communities through reliable electrification programs and stakeholder coordination.",
  },
];

const SERVICE_BG = "https://res.cloudinary.com/dit5iwj2o/image/upload/v1779068435/ChatGPT_Image_Apr_30_2026_03_55_52_PM_vym3rb.png";

const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-[#f5a623] rounded-full shadow-[0_0_8px_#f5a623]"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000) + 100,
            opacity: Math.random() * 0.6 + 0.2,
          }}
          animate={{
            y: [null, -500],
            opacity: [null, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 7,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
};

export default function ServicesSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const containerRef = useRef(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [hasEntered, setHasEntered] = useState(false);

  React.useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setHasEntered(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setSelected(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const radius = 220; // Adjusted for 460x460 SVG

  const circleVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 2.5, ease: "easeInOut", delay: 0.3 } 
    }
  };

  return (
    <section 
      ref={containerRef}
      id="services" 
      className="services-section relative bg-[#f8fafc] py-24 lg:py-32 font-inter"
    >
      {/* Background Image with Multiply Blend */}
      <div 
        className="absolute inset-0 opacity-[0.1] mix-blend-multiply bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${SERVICE_BG})` }}
      />
      
      {/* Floating Energy Particles */}
      <Particles />

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Desktop Radial Layout (The Energy Ring) */}
        <div ref={widgetRef} className="hidden lg:flex relative w-[600px] h-[600px] items-center justify-center mt-[-30px]">
          
          {/* SVG Ring (Energy Flow) */}
          <motion.div className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          >
            <svg width="444" height="444" viewBox="0 0 444 444">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5a623" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#f5a623" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f5a623" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <circle 
                cx="222" cy="222" r="220" 
                fill="none" 
                stroke="rgba(245, 166, 35, 0.15)" 
                strokeWidth="1"
              />
              <motion.circle
                cx="222" cy="222" r="220"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.8 }}
                style={{ rotate: -90, transformOrigin: "center" }}
                className="drop-shadow-[0_0_8px_rgba(245,166,35,0.3)]"
              />
            </svg>
            
            {/* Tiny Glowing Spark */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 w-[440px] h-[440px] -mt-[220px] -ml-[220px] pointer-events-none"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#f5a623] z-50 border border-[#f5a623]/30" />
            </motion.div>
          </motion.div>

          {/* Service Orbiting Nodes */}
          {SERVICES.map((service, i) => {
            const angleDeg = -90 + i * (360 / SERVICES.length);
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);
            const isSelected = selected === i;
            const isOtherSelected = selected !== null && selected !== i;

            const getLabelStyle = (index: number) => {
              // 0: Top, 1: Top Right, 2: Bottom Right, 3: Bottom, 4: Bottom Left, 5: Top Left
              switch(index) {
                case 0: return { left: "50%", bottom: "100%", transform: "translate(-50%, -10px)" };
                case 3: return { left: "50%", top: "100%", transform: "translate(-50%, 10px)" };
                case 1:
                case 2: return { left: "100%", top: "50%", transform: "translate(12px, -50%)" };
                case 4:
                case 5: return { right: "100%", top: "50%", transform: "translate(-12px, -50%)" };
                default: return {};
              }
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.75, x: (x * 0.6) - 28, y: (y * 0.6) - 28 }}
                animate={isInView ? { 
                  opacity: isOtherSelected ? 0.35 : 1, 
                  scale: isSelected ? 1.08 : 1, 
                  x: x - 28, 
                  y: y - 28 
                } : { 
                  opacity: 0, 
                  scale: 0.75, 
                  x: (x * 0.6) - 28, 
                  y: (y * 0.6) - 28 
                }}
                transition={{ 
                  delay: !hasEntered && isInView ? 1.0 + i * 0.12 : 0,
                  opacity: { duration: 0.45 },
                  scale: { duration: 0.45, type: "spring", stiffness: 150, damping: 20 },
                  x: { duration: 0.6, type: "spring", stiffness: 100, damping: 20 },
                  y: { duration: 0.6, type: "spring", stiffness: 100, damping: 20 }
                }}
                className="absolute z-20 group"
                style={{ 
                  left: "50%",
                  top: "50%",
                  width: "56px",
                  height: "56px"
                }}
              >
                  <motion.button
                    onClick={() => setSelected(i)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-full h-full absolute inset-0 rounded-full bg-white flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-all duration-300
                      ${isSelected ? 'shadow-[0_0_20px_rgba(245,166,35,0.4)] ring-2 ring-[#f5a623]' : 'hover:shadow-[0_4px_12px_rgba(245,166,35,0.15)]'}
                    `}
                  >
                    <service.icon className={`w-6 h-6 relative z-10 ${isSelected ? 'text-[#f5a623]' : 'text-slate-400 group-hover:text-[#f5a623] transition-colors'}`} strokeWidth={1.5} />
                    
                    {/* Glow Pulse Effect */}
                    {isSelected && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0.3, 0], scale: [1, 1.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-[#f5a623]"
                      />
                    )}
                  </motion.button>
                  
                  {/* Floating Title (Surrounding Text) */}
                  <div className={`absolute whitespace-nowrap pointer-events-none transition-all duration-300`} style={getLabelStyle(i)}>
                    <span className={`block text-[10px] uppercase tracking-[0.1em] transition-all duration-300 ${isSelected ? 'text-[#f5a623] font-bold' : 'text-slate-500 font-medium group-hover:text-slate-700'} ${isOtherSelected ? 'opacity-50' : 'opacity-100'}`}>
                      {service.title}
                    </span>
                  </div>
              </motion.div>
            );
          })}

          {/* Center Info Overlay (White circular card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute w-[220px] h-[220px] rounded-full bg-white shadow-xl z-10 flex items-center justify-center p-6 overflow-hidden border border-slate-100"
          >
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,166,35,0.08)_0%,_transparent_70%)]" />

            <AnimatePresence mode="wait">
              {selected === null ? (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center relative z-10 w-full"
                >
                  <Zap className="w-8 h-8 text-[#f5a623] mb-3" />
                  <h3 className="text-2xl pt-1 font-black text-[#1b2d48] uppercase tracking-tighter leading-none mb-3">
                    Our<br />Services
                  </h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed max-w-[140px] font-medium">
                    Powering Tablas Island with integrated solutions.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`service-${selected}`}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col items-center text-center relative z-10 w-full"
                >
                  <div className="w-10 h-10 bg-[#1b2d48] rounded-xl flex items-center justify-center mb-3 shadow-md">
                    {React.createElement(SERVICES[selected].icon, { 
                      className: "w-5 h-5 text-[#f5a623]",
                      strokeWidth: 2 
                    })}
                  </div>
                  <h3 className="text-[13px] font-bold text-[#1b2d48] uppercase tracking-widest mb-2 leading-tight">
                    {SERVICES[selected].title}
                  </h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed max-w-[150px]">
                    {SERVICES[selected].desc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile Vertical Timeline Layout */}
        <div className="lg:hidden w-full max-w-md relative pt-20 pb-12">
          <div className="text-left mb-16 px-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-[2px] bg-[#f5a623]" />
              <span className="text-[#1b2d48] font-bold text-sm tracking-[0.2em] uppercase">
                Core Offerings
              </span>
            </div>
             <h2 className="text-4xl md:text-5xl font-black text-[#1b2d48] leading-[1.1] tracking-tight mb-2">Our Services</h2>
          </div>

          <div className="relative">
            {/* The Vertical energy track (left side) */}
            <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-slate-200 overflow-hidden">
               {/* Vertical Electricity Animation */}
               <motion.div 
                 animate={{ y: ["-100%", "300%"] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="w-full h-40 bg-gradient-to-b from-transparent via-[#f5a623] to-transparent shadow-[0_0_10px_#f5a623]"
               />
            </div>

            {SERVICES.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }} // Slide in from side
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="mb-16 flex items-start relative pl-20 group"
              >
                {/* Icon attached exactly to the track */}
                <div className="absolute left-8 top-0 -translate-x-1/2 w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center z-10 shadow-md group-hover:border-[#f5a623]/50 transition-all duration-300">
                   <service.icon className="w-6 h-6 text-[#f5a623]" strokeWidth={2} />
                </div>
                
                <div className="flex-1">
                   <h4 className="text-lg font-black text-[#1b2d48] uppercase tracking-widest mb-1">{service.title}</h4>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-[240px]">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
