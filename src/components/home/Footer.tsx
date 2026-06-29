import React from "react";
import { Zap } from "lucide-react";
import { SuwecoLogo } from "./SuwecoLogo";

const QUICK_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Updates", href: "#updates" },
];

const SERVICES = [
  "Power Generation",
  "System Operations",
  "Renewable Integration",
  "Energy Management",
  "Maintenance and Reliability",
  "Community Engagement",
];

export default function Footer() {
  return (
    <footer className="bg-[#1b2d48] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="mb-6 scale-90 origin-left">
              <SuwecoLogo className="h-8" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed font-inter">
              SUWECO Tablas Energy Corporation delivers reliable and sustainable power solutions across Tablas Island, supporting communities, infrastructure development, and long-term energy security.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-inter text-sm font-bold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/50 hover:text-[#f5a623] text-sm transition-colors font-inter">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-inter text-sm font-bold mb-5">Services</h4>
            <ul className="space-y-3">
              {SERVICES.map((s) => (
                <li key={s}>
                  <span className="text-white/50 text-sm font-inter">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Address */}
          <div>
            <h4 className="font-inter text-sm font-bold mb-5">Address</h4>
            <div className="flex flex-col gap-3">
              <p className="text-white/50 text-sm leading-relaxed font-inter">
                3rd Floor, Bldg. 9, Embarcadero de Legazpi<br />
                Port Area, Brgy. 27, Victory Village, Legazpi City
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-inter">© 2025 SUWECO Tablas Energy Corporation. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 hover:text-white/50 text-xs font-inter">Privacy Policy</a>
            <a href="#" className="text-white/30 hover:text-white/50 text-xs font-inter">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
