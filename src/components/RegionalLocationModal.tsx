import React, { useState } from 'react';
import { RegionalLocation } from '../types';
import { REGIONAL_LOCATIONS } from '../data/catalog';
import { 
  MapPin, 
  X, 
  Check, 
  Info, 
  Navigation, 
  Loader2, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';

interface RegionalLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: RegionalLocation;
  onSelectLocation: (loc: RegionalLocation) => void;
}

// Coordenadas aproximadas das capitais/centros dos estados da base SINAPI
const UF_COORDINATES: Record<string, { lat: number; lng: number }> = {
  SP: { lat: -23.5505, lng: -46.6333 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  MG: { lat: -19.9167, lng: -43.9345 },
  PR: { lat: -25.4284, lng: -49.2733 },
  RS: { lat: -30.0346, lng: -51.2177 },
  SC: { lat: -27.5954, lng: -48.5480 },
  BA: { lat: -12.9777, lng: -38.5016 },
  PE: { lat: -8.0476, lng: -34.8770 },
  CE: { lat: -3.7319, lng: -38.5267 },
  GO: { lat: -16.6869, lng: -49.2648 },
  DF: { lat: -15.7942, lng: -47.8822 },
  AM: { lat: -3.1190, lng: -60.0217 },
  PA: { lat: -1.4558, lng: -48.4902 },
  MT: { lat: -15.6010, lng: -56.0974 },
  MS: { lat: -20.4697, lng: -54.6201 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const RegionalLocationModal: React.FC<RegionalLocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const filtered = REGIONAL_LOCATIONS.filter(
    l => l.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         l.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
         l.uf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const findClosestLocation = (lat: number, lng: number): RegionalLocation => {
    let closestUF = 'SP';
    let minDistance = Infinity;

    for (const [uf, coords] of Object.entries(UF_COORDINATES)) {
      const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestUF = uf;
      }
    }

    return REGIONAL_LOCATIONS.find(l => l.uf === closestUF) || REGIONAL_LOCATIONS[0];
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectionFeedback(null);

    // 1. Tentar Geolocation do Navegador (GPS)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const match = findClosestLocation(latitude, longitude);
          onSelectLocation(match);
          setIsDetecting(false);
          setDetectionFeedback({
            type: 'success',
            message: `Região detectada com precisão via GPS: ${match.stateName} (${match.uf})! Fator ${match.priceMultiplier}x aplicado.`
          });
          setTimeout(() => {
            onClose();
          }, 2000);
        },
        async () => {
          // Fallback para IP
          await detectByIP();
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      await detectByIP();
    }
  };

  const detectByIP = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('Falha no serviço de IP');
      const data = await res.json();
      
      const regionCode = data.region_code || '';
      let match = REGIONAL_LOCATIONS.find(l => l.uf.toUpperCase() === regionCode.toUpperCase());

      if (!match && data.latitude && data.longitude) {
        match = findClosestLocation(data.latitude, data.longitude);
      }

      if (match) {
        onSelectLocation(match);
        setIsDetecting(false);
        setDetectionFeedback({
          type: 'success',
          message: `Região identificada pela rede: ${match.stateName} (${match.uf})! Tabela SINAPI atualizada.`
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Estado não mapeado na tabela');
      }
    } catch (err) {
      setIsDetecting(false);
      setDetectionFeedback({
        type: 'error',
        message: 'Não foi possível capturar sua região automaticamente. Por favor, escolha seu estado na lista abaixo.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        id="location-modal-content"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tabela Regional de Preços</h3>
              <p className="text-xs text-slate-500">Selecione seu estado para ajustar os custos médios do SINAPI</p>
            </div>
          </div>
          <button
            id="btn-close-location-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BOTÃO DE DETECÇÃO AUTOMÁTICA DE REGIÃO (GPS / IP) */}
        <div className="my-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-200/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  Capturar Região Automaticamente
                </h4>
                <p className="text-[11px] text-slate-600 truncate">
                  Identifica seu estado por GPS ou rede e ajusta o multiplicador
                </p>
              </div>
            </div>

            <button
              id="btn-detect-region"
              type="button"
              disabled={isDetecting}
              onClick={handleAutoDetect}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Detectando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Detectar</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback de Detecção */}
          {detectionFeedback && (
            <div className={`mt-2.5 p-2 rounded-lg text-xs flex items-center gap-2 animate-in fade-in ${
              detectionFeedback.type === 'success' 
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {detectionFeedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{detectionFeedback.message}</span>
            </div>
          )}
        </div>

        {/* CAMPO DE BUSCA MANUAL */}
        <div className="mb-2">
          <input
            id="input-search-location"
            type="text"
            placeholder="Ou busque por Estado ou UF (ex: SP, Bahia, RJ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {/* LISTA DE ESTADOS / REGIÕES */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {filtered.map((loc) => {
            const isSelected = loc.uf === currentLocation.uf;
            return (
              <button
                key={loc.uf}
                id={`btn-select-location-${loc.uf.toLowerCase()}`}
                type="button"
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium' 
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-200 text-slate-800">
                      {loc.uf}
                    </span>
                    <span className="font-semibold text-sm">{loc.stateName}</span>
                    <span className="text-xs text-slate-500">({loc.city})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Fator Regional: {loc.priceMultiplier.toFixed(2)}x</span>
                    <span>•</span>
                    <span className="text-slate-400">{loc.source}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1 rounded-full bg-amber-500 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Os multiplicadores regionais são indexados com base na mediana estatística do SINAPI (Caixa/IBGE) e pesquisas de mercado da construção civil.
          </span>
        </div>
      </div>
    </div>
  );
};
