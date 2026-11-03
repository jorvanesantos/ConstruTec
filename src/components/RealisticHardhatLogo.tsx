import React from 'react';
import hardhatImage from '../assets/images/yellow_hardhat_logo_1790727668517.jpg';

interface RealisticHardhatLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const RealisticHardhatLogo: React.FC<RealisticHardhatLogoProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-1 shadow-md border border-amber-400/40 overflow-hidden group-hover:border-amber-400 group-hover:scale-105 transition-all duration-300 ${sizeClasses[size]} ${className}`}
    >
      <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none" />
      
      <img
        src={hardhatImage}
        alt="Capacete Amarelo ConstruTec"
        referrerPolicy="no-referrer"
        className="relative z-10 w-full h-full object-contain filter drop-shadow-md transition-transform duration-300"
        loading="eager"
      />

      <div className="absolute top-0 inset-x-2 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
    </div>
  );
};
