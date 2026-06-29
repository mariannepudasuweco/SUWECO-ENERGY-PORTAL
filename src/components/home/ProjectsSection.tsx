import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Zap, Target, Calendar, 
  Map as MapIcon, CheckCircle2, Building2, BarChart2, LayoutGrid, Factory,
  ArrowRight, RotateCcw, MapPin, Activity, ListChecks
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet blank map issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const PROJECTS_BG = "https://res.cloudinary.com/dit5iwj2o/image/upload/v1779068389/ChatGPT_Image_Apr_30_2026_01_59_04_PM_o927pe.png";

const markerColors: Record<string, string> = {
  Operational: "#22c55e",
  Active: "#2563eb",
  Ongoing: "#3b82f6",
};

const PROJECTS = [
  {
    id: 1,
    title: "Carabao Island Diesel Power Plant",
    location: "Binibitoon, San Jose, Romblon",
    coordinates: [12.0673, 121.9426] as [number, number],
    status: "Operational",
    capacity: "2.100 MW",
    commissioned: "2018",
    technology: "Diesel Power Plant",
    desc: "Supplying reliable energy to the isolated community of Carabao Island, fostering local economic growth.",
    image: "https://images.unsplash.com/photo-1555132225-b04bcf84cc7a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Tablas Diesel Power Plant",
    location: "Batiano, Odiongan, Romblon",
    coordinates: [12.3551, 121.9863] as [number, number],
    status: "Operational",
    capacity: "13.7 MW",
    commissioned: "2016",
    technology: "Diesel Power Plant",
    desc: "The primary source of baseload power for the main Tablas Island distribution network.",
    image: "https://images.unsplash.com/photo-1518556608518-e87747e94626?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Tablas Island 13.7 MW Diesel Power Plant Projects - Alcantara",
    location: "Poblacion, Alcantara, Romblon",
    coordinates: [12.2599, 122.0494] as [number, number],
    status: "Active",
    capacity: "13.7 MW (Total Program)",
    commissioned: "2023",
    technology: "Diesel Power Plant",
    desc: "Part of the integrated program to stabilize the power grid in the Alcantara region.",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Tablas Island 13.7 MW Diesel Power Plant Projects - San Agustin",
    location: "Dona Juana, San Agustin, Romblon",
    coordinates: [12.5487, 122.1360] as [number, number],
    status: "Active",
    capacity: "13.7 MW (Total Program)",
    commissioned: "2023",
    technology: "Diesel Power Plant",
    desc: "Extending reach to the northern municipalities with dedicated diesel generation capacity.",
    image: "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Tablas Island 13.7 MW Diesel Power Plant Projects - Santa Fe",
    location: "Pandan, Santa Fe, Romblon",
    coordinates: [12.1293, 121.9926] as [number, number],
    status: "Active",
    capacity: "13.7 MW (Total Program)",
    commissioned: "2023",
    technology: "Diesel Power Plant",
    desc: "Regional node for power generation serving the southern coastal communities of Tablas.",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Tablas Island 13.7 MW Diesel Power Plant Projects - Tumingad",
    location: "Tumingad, Odiongan, Tablas Island",
    coordinates: [12.3995, 121.9791] as [number, number],
    status: "Active",
    capacity: "13.7 MW (Total Program)",
    commissioned: "2023",
    technology: "Diesel Power Plant",
    desc: "Key infrastructure component for the centralized island power hub at Tumingad.",
    image: "https://images.unsplash.com/photo-1518118024227-2c1b96a93902?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Tablas Island 13.7 MW Diesel Power Plant Projects - Odiongan",
    location: "Odiongan, Romblon",
    coordinates: [12.4045, 121.9818] as [number, number],
    status: "Active",
    capacity: "13.7 MW (Total Program)",
    commissioned: "2023",
    technology: "Diesel Power Plant",
    desc: "Supporting the administrative and commercial capital with robust energy reserves.",
    image: "https://images.unsplash.com/photo-1544724569-5f546fa66055?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Tumingad Solar Power Plant",
    location: "Sitio Cardumay, Tumingad, Odiongan, Romblon",
    coordinates: [12.3995, 121.9967] as [number, number],
    status: "Ongoing",
    capacity: "7.542 MWp",
    commissioned: "2024",
    technology: "Solar Power Plant",
    desc: "State-of-the-art solar facility transitioning the island towards more renewable energy sources.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Tumingad Solar Expansion",
    location: "Sitio Cardumay, Tumingad, Odiongan, Romblon",
    coordinates: [12.4010, 121.9950] as [number, number],
    status: "Ongoing",
    capacity: "2.733 MWp",
    commissioned: "2024",
    technology: "Solar Power Plant",
    desc: "Expansion of the solar hub to further decrease dependence on fossil fuels.",
    image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?q=80&w=800&auto=format&fit=crop",
  },
];

const createCustomIcon = (status: string, title: string, isSelected: boolean) => {
  const color = markerColors[status] || "#3b82f6";
  
  return L.divIcon({
    className: "custom-marker-wrapper bg-transparent border-none",
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-40'}">
        <!-- Pin Marker -->
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 24 32" class="drop-shadow-md">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.52-4.48-10-10-10zm0 13.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 8.5 12 8.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="${color}"/>
        </svg>

        <!-- Tooltip Label -->
        <div class="absolute bottom-full mb-2 whitespace-nowrap pointer-events-none transition-all duration-300 ${isSelected || 'opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0'}">
           <div class="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-slate-100 flex flex-col items-center">
              <div class="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-tight mb-0.5">${status}</div>
              <div class="text-[10px] font-bold text-[#1b2d48] uppercase tracking-tight leading-tight">${title.split(' - ')[1] || title.split(' Projects')[0]}</div>
           </div>
           <div class="w-2 h-2 bg-white/95 border-b border-r border-slate-100 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-sm"></div>
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  });
};

function MapViewController({ selectedProject }: { selectedProject: any }) {
  const map = useMap();
  useEffect(() => {
    if (selectedProject) {
      const isMobile = window.innerWidth < 768;
      const zoom = 13;
      if (!isMobile) {
        // Shift map center to the right so the pin appears left
        // The panel is ~340px wide on right, so offsetting by 160px makes pin visually centered in the remaining space
        const targetPoint = map.project(selectedProject.coordinates, zoom);
        targetPoint.x += 160;
        const targetLatLng = map.unproject(targetPoint, zoom);
        map.flyTo(targetLatLng, zoom, { animate: true, duration: 1.5 });
      } else {
        // On mobile, panel might cover bottom, so shift down
        const targetPoint = map.project(selectedProject.coordinates, zoom);
        targetPoint.y -= 100;
        const targetLatLng = map.unproject(targetPoint, zoom);
        map.flyTo(targetLatLng, zoom, { animate: true, duration: 1.5 });
      }
    } else {
      const bounds = L.latLngBounds(PROJECTS.map(p => p.coordinates));
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    }
  }, [selectedProject, map]);
  return null;
}

export default function ProjectsSection() {
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleSelectProject = (e: any) => {
      if (e.detail && e.detail.projectId) {
        setSelectedId(e.detail.projectId);
        setViewMode('map');
        const section = document.getElementById('projects');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('select-project', handleSelectProject);
    return () => {
      window.removeEventListener('select-project', handleSelectProject);
    };
  }, []);

  const selectedProject = PROJECTS.find(p => p.id === selectedId);

  return (
    <section 
      id="projects" 
      className="projects-section relative bg-[#f8fafc] py-12 font-inter"
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-[0.1] mix-blend-multiply bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${PROJECTS_BG})` }}
      />

      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.1fr)] gap-[clamp(1.5rem,2.5vw,3rem)] items-center">
        
        {/* Left Column: Stats & Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col gap-[clamp(1rem,1.8vw,1.75rem)] sticky top-12"
        >
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[2px] bg-[#f5a623]" />
              <span className="text-[#1b2d48] font-bold text-sm tracking-[0.2em] uppercase">
                OUR PROJECTS
              </span>
            </div>
            
            <h2 className="text-[#1b2d48] text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight max-w-[90%]">
              Powering Communities <span className="text-[#f5a623]">Across Tablas</span>
            </h2>
            <p className="text-[#1b2d48]/70 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              From north to south, we deliver reliable and sustainable energy solutions that support progress and improve lives across Tablas Island.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Projects", value: PROJECTS.length, icon: Building2, color: '#1b2d48' },
              { label: "Operational", value: PROJECTS.filter(p => p.status === 'Operational').length, icon: CheckCircle2, color: '#22c55e' },
              { label: "Active", value: PROJECTS.filter(p => p.status === 'Active').length, icon: Target, color: '#2563eb' },
              { label: "Ongoing", value: PROJECTS.filter(p => p.status === 'Ongoing').length, icon: BarChart2, color: '#3b82f6' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:bg-white/90 transition-colors"
              >
                <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <stat.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1b2d48] leading-none mb-1">{stat.value}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
            className="bg-[#1b2d48] hover:bg-[#2c446a] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 w-fit uppercase group"
          >
            {viewMode === 'map' ? (
              <>VIEW ALL PROJECTS <ArrowRight className="w-5 h-5 text-[#f5a623] group-hover:translate-x-2 transition-transform duration-300" /></>
            ) : (
              <>VIEW IN MAP <ArrowRight className="w-5 h-5 text-[#f5a623] group-hover:translate-x-2 transition-transform duration-300" /></>
            )}
          </button>
        </motion.div>

        {/* Right Column: Display Area (The Viewer box) */}
        <div className="min-h-[400px] lg:h-[600px] w-full relative pt-2 lg:pt-0">
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden relative"
              >
                {isMounted && (
                  <MapContainer
                    center={[12.35, 122.0]}
                    zoom={10}
                    zoomControl={false}
                    className="w-full h-full"
                  >
                    <TileLayer 
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    />
                    <ZoomControl position="bottomleft" />
                    <MapViewController selectedProject={selectedProject} />
                    
                    {PROJECTS.map(p => (
                      <Marker 
                        key={p.id} 
                        position={p.coordinates} 
                        icon={createCustomIcon(p.status, p.title, selectedId === p.id)}
                        eventHandlers={{ click: () => setSelectedId(p.id) }}
                      />
                    ))}

                    <div className="absolute top-4 left-16 z-[1000]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(null);
                        }}
                        className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 text-[10px] font-bold uppercase text-[#1b2d48] tracking-widest hover:bg-slate-50 transition-all transform active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" strokeWidth={2} /> Reset View
                      </button>
                    </div>

                    {/* Map Legend */}
                    <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex flex-col gap-3">
                       <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1 border-b border-slate-100 pb-2">Legend</div>
                       {Object.entries(markerColors).map(([status, color]) => (
                         <div key={status} className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 24 32">
                              <path d="M12 2C6.48 2 2 6.48 2 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.52-4.48-10-10-10zm0 13.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 8.5 12 8.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill={color}/>
                            </svg>
                            <span className="text-xs font-bold text-[#1b2d48] capitalize tracking-wide">{status}</span>
                         </div>
                       ))}
                    </div>
                  </MapContainer>
                )}

                {/* Details Overlay Side-Panel (Video Style) */}
                <AnimatePresence>
                  {selectedProject && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute top-4 right-4 md:top-6 md:right-6 w-[calc(100%-2rem)] max-w-[340px] bg-white rounded-2xl shadow-2xl z-[1001] p-0 overflow-hidden"
                    >
                      <button 
                        onClick={() => setSelectedId(null)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all z-10"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>

                      <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: markerColors[selectedProject.status] }} />
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedProject.status}</span>
                        </div>

                        <h3 className="text-2xl font-black text-[#1b2d48] uppercase leading-tight mb-8">
                          {selectedProject.title}
                        </h3>

                        <div className="space-y-6">
                          <div className="flex items-start gap-4">
                            <div className="mt-1"><MapPin className="w-4 h-4 text-[#f5a623]" /></div>
                            <div>
                              <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Location</div>
                              <div className="text-sm font-bold text-[#1b2d48]">{selectedProject.location}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="mt-1"><Zap className="w-4 h-4 text-[#f5a623]" /></div>
                            <div>
                              <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Capacity</div>
                              <div className="text-sm font-bold text-[#1b2d48]">{selectedProject.capacity}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="mt-1"><Building2 className="w-4 h-4 text-[#f5a623]" /></div>
                            <div>
                              <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Type</div>
                              <div className="text-sm font-bold text-[#1b2d48]">{selectedProject.technology}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="mt-1"><Activity className="w-4 h-4 text-[#f5a623]" /></div>
                            <div>
                              <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Status</div>
                              <div className="text-sm font-bold text-[#1b2d48]">In Operation</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="mt-1"><Calendar className="w-4 h-4 text-[#f5a623]" /></div>
                            <div>
                              <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Commissioned</div>
                              <div className="text-sm font-bold text-[#1b2d48]">{selectedProject.commissioned}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Divider line (Energy line) */}
                      <div className="h-1.5 w-full bg-[#f1f5f9] relative overflow-hidden">
                        <motion.div 
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-[#f5a623]/30 to-transparent"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full pb-12 pr-4 overflow-y-auto content-start custom-scrollbar">
                   {PROJECTS.map((p, idx) => (
                     <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-slate-100 group flex flex-col hover:shadow-2xl transition-all duration-500 min-h-[320px] relative"
                     >
                        <div className="w-full aspect-[4/3] overflow-hidden relative shrink-0 bg-slate-100">
                           <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.title} />
                           <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                             <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: markerColors[p.status] }} />
                             <span className="text-[9px] font-bold uppercase text-[#1b2d48] tracking-widest">{p.status}</span>
                           </div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 flex-1 justify-between bg-white">
                           <h4 className="text-[clamp(1.1rem,1.3vw,1.5rem)] font-bold text-[#1b2d48] leading-[1.15] group-hover:text-[#f5a623] transition-colors line-clamp-2">
                             {p.title}
                           </h4>
                           
                           <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 mt-auto">
                              <div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capacity</div>
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3 h-3 text-[#f5a623]" />
                                  <span className="text-[13px] font-semibold text-[#4b5563] truncate">{p.capacity}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</div>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span className="text-[13px] font-semibold text-[#4b5563] truncate">{p.technology.split(' ')[0]}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
