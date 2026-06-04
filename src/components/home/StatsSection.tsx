import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "9", label: "Municipalities", sub: "Across Tablas Island" },
  { value: "4.48", label: "Megawatts", sub: "Generating Capacity" },
  { value: "11+", label: "Years", sub: "Of Reliable Service" },
  { value: "24/7", label: "Operations", sub: "Round-the-Clock" },
];

export default function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[#1b2d48]" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #f5a623 0%, transparent 60%), radial-gradient(circle at 80% 50%, #1e40af 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center px-8 py-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="font-inter text-5xl md:text-6xl font-extrabold text-[#f5a623] mb-1">{stat.value}</p>
              <p className="text-white text-sm font-semibold mb-1 font-inter">{stat.label}</p>
              <p className="text-white/40 text-[11px] tracking-wide font-inter">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
