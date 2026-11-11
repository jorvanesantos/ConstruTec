import React, { useEffect, useState } from 'react';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS } from '../data/catalog';
import { PriceCatalogItem, RegionalLocation } from '../types';
import { 
  PackageCheck, 
  Search, 
  MapPin, 
  Tag, 
  ExternalLink, 
  ShoppingCart, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MaterialsCatalogProps {
  location: RegionalLocation;
  onOpenLocationModal: () => void;
}

export const MaterialsCatalog: React.FC<MaterialsCatalogProps> = ({
  location,
  onOpenLocationModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [materials, setMaterials] = useState<PriceCatalogItem[]>(BASE_MATERIALS_CATALOG);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/materiais')
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os preços atualizados.');
        return response.json();
      })
      .then((items: Array<{ id: string; name: string; description: string; unit: string; price: number; category: string; updatedAt?: string }>) => {
        if (!Array.isArray(items)) throw new Error('A resposta do catálogo de materiais é inválida.');
        if (active) {
          setMaterials(items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            baseUnit: item.unit,
            commercialUnit: item.unit,
            basePrice: Number(item.price),
            category: item.category || 'Geral',
            updatedAt: item.updatedAt || new Date().toISOString()
          })));
          setCatalogError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error('[Catálogo] Falha ao carregar os preços administrados:', error);
          setCatalogError('Não foi possível atualizar o catálogo. Os valores exibidos são os preços locais de referência.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = [
    { id: 'todos', label: 'Todos os Materiais' },
    { id: 'Alvenaria', label: 'Alvenaria & Blocos' },
    { id: 'Aglomerantes', label: 'Cimentos & Cal' },
    { id: 'Agregados', label: 'Areia & Brita' },
    { id: 'Pisos', label: 'Pisos & Revestimentos' },
    { id: 'Argamassas', label: 'Argamassas & Rejuntes' },
    { id: 'Pintura', label: 'Tintas & Acessórios' },
    { id: 'Telhados', label: 'Telhas & Coberturas' },
    ...Array.from(new Set<string>(materials.map((material) => material.category)))
      .filter((category) => !['Alvenaria', 'Aglomerantes', 'Agregados', 'Pisos', 'Argamassas', 'Pintura', 'Telhados'].includes(category))
      .map((category) => ({ id: category, label: category }))
  ];

  const filteredMaterials = materials.filter((mat) => {
    const matchesSearch = 
      mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'todos' || mat.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
            <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>TABELA OFICIAL DE INSUMOS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Catálogo de Materiais & Preços Regionais
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulte insumos padronizados com preços médios SINAPI atualizados por estado.
          </p>
        </div>

        {catalogError && (
          <p role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {catalogError}
          </p>
        )}

        {/* SELECTOR REGIONAL ATIVO */}
        <button
          onClick={onOpenLocationModal}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Região: <strong>{location.stateName} ({location.uf})</strong></span>
          <span className="text-[10px] text-slate-400 font-mono">({location.priceMultiplier}x)</span>
        </button>
      </div>

      {/* BANNER DE INTEGRAÇÃO FUTURA DE COMPRAS (ECOSSISTEMA DE LOJAS) */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>ConstruTec Marketplace</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-950 font-extrabold">EM BREVE</span>
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Envie a lista de materiais do seu orçamento diretamente para depósitos e lojas parceiras na sua região ({location.city}) com 1 clique.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH AND CATEGORY FILTER */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar material por nome ou aplicação (ex: cimento, bloco, areia, porcelanato)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => {
          const regionalPrice = mat.basePrice * location.priceMultiplier;
          return (
            <div
              key={mat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {mat.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Unidade: {mat.commercialUnit}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {mat.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Preço Estimado ({location.uf}):
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                    R$ {regionalPrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">/ {mat.commercialUnit}</span>
                </div>

                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-md border border-amber-200/60 dark:border-amber-700/60">
                  Preço base administrado
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
