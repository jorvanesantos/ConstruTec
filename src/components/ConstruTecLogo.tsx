import React from 'react';
import yellowHelmetImage from '../assets/images/yellow_hardhat_logo_1790727668517.jpg';

interface ConstruTecLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const ConstruTecLogo: React.FC<ConstruTecLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  subtitle
}) => {
  const sizeMap = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblema do Capacete Amarelo de Construção */}
      <div 
        className={`relative shrink-0 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/40 shadow-lg shadow-amber-950/30 overflow-hidden group-hover:border-amber-400 group-hover:scale-105 transition-all duration-300 ${sizeMap[size]}`}
      >
        <img
          src={yellowHelmetImage}
          alt="Capacete Amarelo ConstruTec"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter brightness-105 contrast-110 drop-shadow-md"
        />
        {/* Brilho âmbar sutil nas bordas */}
        <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/30 pointer-events-none rounded-[inherit]" />
      </div>

      {/* Texto de Branding Opcional */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center tracking-tight font-extrabold text-xl leading-none">
            <span className="text-slate-900">Constru</span>
            <span className="text-amber-500">Tec</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            {subtitle || 'Inteligência em Obras'}
          </span>
        </div>
      )}
    </div>
  );
};
