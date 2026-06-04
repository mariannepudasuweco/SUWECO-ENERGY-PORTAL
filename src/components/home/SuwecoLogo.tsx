import React from "react";

interface SuwecoLogoProps {
  className?: string;
  isDarkTheme?: boolean;
}

export function SuwecoLogo({ className = "h-11", isDarkTheme = true }: SuwecoLogoProps) {
  const textColor1 = "#56B3E4"; // Light blue matching branding
  const textColor2 = isDarkTheme ? "#FFFFFF" : "#717174"; // Dark grey matching branding
  const textColor3 = isDarkTheme ? "#E5E7EB" : "#3F3F41"; // Color for bottom text

  return (
    <svg viewBox="0 0 720 200" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Icon Image */}
      <image 
        href="https://res.cloudinary.com/dit5iwj2o/image/upload/v1779070798/suweco_logo_kdfwwq.jpg" 
        x="15" 
        y="15" 
        width="110" 
        height="110" 
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* "SUWECO" Text */}
      <text x="145" y="108" fontFamily="system-ui, -apple-system, sans-serif" fontSize="110" fontWeight="600" letterSpacing="-1">
        <tspan fill={textColor1}>SUWE</tspan>
        <tspan fill={textColor2}>CO</tspan>
      </text>
      
      {/* "TABLAS ENERGY CORPORATION" Text */}
      <text x="15" y="172" fontFamily="system-ui, -apple-system, sans-serif" fontSize="33" fontWeight="500" textLength="620" lengthAdjust="spacing" fill={textColor3} letterSpacing="0">
        TABLAS ENERGY CORPORATION
      </text>
    </svg>
  );
}
